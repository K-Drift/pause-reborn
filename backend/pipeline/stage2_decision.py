"""第二段:LLM 广告决策。

走中转站 (LLM_BASE_URL),OpenAI 兼容 chat/completions 协议。
调用方式照搬 backend/tests/test_llm_text.py(启用 response_format=json_object)。

输入:scene (dict) + persona (dict) + user_state (str) + ad_library (list)
输出:符合 prompts/decision_prompt.txt schema(SPEC §1.8.2)的决策 JSON dict
      decision ∈ {"show_ad", "no_ad", "content_switch"} —— 三层决策由 prompt 控制,
      LLM 自行根据 scene.sensitivity / user_state / persona.forbidden_categories 选择分支。

异常向上抛,由调用方(main.py)决定是否降级到 mock。
"""

from __future__ import annotations

import json
import os
import re
from pathlib import Path

import httpx

PROMPTS_DIR = Path(__file__).resolve().parent.parent / "prompts"
DATA_DIR = Path(__file__).resolve().parent.parent / "data"

_FENCE_RE = re.compile(r"```(?:json)?\s*(.+?)\s*```", re.DOTALL)


def _strip_json_fence(text: str) -> str:
    m = _FENCE_RE.search(text)
    return m.group(1).strip() if m else text.strip()


def load_personas() -> list:
    data = json.loads((DATA_DIR / "personas.json").read_text(encoding="utf-8"))
    return data.get("personas", [])


def load_ad_library() -> list:
    data = json.loads((DATA_DIR / "ad_library.json").read_text(encoding="utf-8"))
    return data.get("ads", [])


def get_persona(persona_id: str | None) -> dict:
    """按 id 找 persona。未指定 / 找不到 时返回 id=default;再找不到给最小空壳。"""
    personas = load_personas()
    if persona_id:
        for p in personas:
            if p.get("id") == persona_id:
                return p
    for p in personas:
        if p.get("id") == "default":
            return p
    return {"id": "default", "name": "未知用户", "forbidden_categories": []}


def _validate_decision(d: dict) -> dict:
    """字段兜底 + 决策值合法性校验。"""
    if not isinstance(d, dict):
        raise ValueError(f"LLM 返回不是 JSON 对象:{type(d).__name__}")
    decision = d.get("decision")
    if decision not in ("show_ad", "no_ad", "content_switch"):
        raise ValueError(f"非法 decision 值:{decision!r}")
    if decision == "show_ad":
        if not isinstance(d.get("alternative_brands"), list):
            d["alternative_brands"] = []
        if not isinstance(d.get("scores"), dict):
            d["scores"] = {}
        # 评分字段兜底
        scores = d["scores"]
        scores.setdefault("scene_emotion_fit", 0)
        scores.setdefault("brand_tone_match", 0)
        scores.setdefault("user_disturbance", "low")
        scores.setdefault("predicted_attention_lift", "+0%")
    return d


def decide_ad(
    scene: dict,
    persona: dict,
    user_state: str,
    ad_library: list,
) -> dict:
    """调 Nova LLM,返回决策 JSON。

    任何异常(配置缺失 / 网络错 / 非 200 / JSON 解析失败 / 字段非法)向上抛。
    """
    api_key = os.getenv("LLM_API_KEY")
    base_url = os.getenv("LLM_BASE_URL")
    model = os.getenv("LLM_MODEL_TEXT")
    if not (api_key and base_url and model):
        raise RuntimeError(
            "LLM_API_KEY / LLM_BASE_URL / LLM_MODEL_TEXT 未在 backend/.env 配置"
        )

    template = (PROMPTS_DIR / "decision_prompt.txt").read_text(encoding="utf-8")
    # 用 .replace() 而非 .format(),避免 prompt 内 JSON 示例的 { } 被误解
    prompt = (
        template
        .replace("{stage1_output_json}", json.dumps(scene, ensure_ascii=False, indent=2))
        .replace("{persona_json}", json.dumps(persona, ensure_ascii=False, indent=2))
        .replace("{user_state}", user_state or "normal")
        .replace(
            "{ad_library_json}",
            json.dumps(ad_library, ensure_ascii=False, indent=2),
        )
    )

    payload = {
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "response_format": {"type": "json_object"},
        "temperature": 0.3,
        "max_tokens": 4000,  # 决策 JSON + reasoning 中文段需要充足额度,防止被截断
    }

    url = base_url.rstrip("/") + "/chat/completions"
    print(f"[stage2] 即将调用 LLM, max_tokens=4000, model={model}")
    with httpx.Client(timeout=60.0) as client:
        r = client.post(
            url,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json=payload,
        )

    if r.status_code != 200:
        raise RuntimeError(f"LLM HTTP {r.status_code}: {r.text[:300]}")

    data = r.json()
    content = data["choices"][0]["message"]["content"]
    if isinstance(content, list):
        content = "".join(p.get("text", "") for p in content if isinstance(p, dict))

    print(f"[stage2] LLM 响应完整长度: {len(content)} 字符")
    print(f"[stage2] 响应末尾 100 字符: ...{content[-100:]}")

    cleaned = _strip_json_fence(content)
    try:
        decision = json.loads(cleaned)
    except json.JSONDecodeError as e:
        raise RuntimeError(
            f"LLM 输出非合法 JSON:{e};原文前 200 字:{content[:200]}"
        ) from e

    return _validate_decision(decision)
