"""第一段:VLM 场景理解。

走中转站(Nova),OpenAI 兼容 chat/completions 协议。
调用方式严格照搬 backend/tests/test_llm_vision.py 已验证的形态。

输入:暂停帧的图像字节(内部 base64 后作为 data URI 传入)
输出:符合 SPEC §1.8.1(prompts/vision_prompt.txt 内嵌 schema)的 SceneJSON dict

异常向上抛,由调用方(main.py)决定是否降级到 mock。
"""

from __future__ import annotations

import base64
import hashlib
import json
import os
import re
from pathlib import Path

import httpx

PROMPTS_DIR = Path(__file__).resolve().parent.parent / "prompts"
FRAME_DIR = Path(__file__).resolve().parent.parent / "data" / "pause-frames"

# 剥离 ```json ... ``` 或 ``` ... ``` 包裹
_FENCE_RE = re.compile(r"```(?:json)?\s*(.+?)\s*```", re.DOTALL)


def load_frame_image(frame_id: str) -> bytes:
    """读 backend/data/pause-frames/{frame_id}.png 的字节。"""
    path = FRAME_DIR / f"{frame_id}.png"
    if not path.exists():
        raise FileNotFoundError(f"暂停帧 PNG 未找到:{path}")
    return path.read_bytes()


def _strip_json_fence(text: str) -> str:
    m = _FENCE_RE.search(text)
    return m.group(1).strip() if m else text.strip()


def _normalize_scene(scene: dict) -> dict:
    """字段兜底:sensitivity 缺失则默认 low;emotion 是字符串则包成单元素 list。"""
    if not isinstance(scene, dict):
        raise ValueError(f"VLM 返回不是 JSON 对象:{type(scene).__name__}")
    if not scene.get("sensitivity"):
        scene["sensitivity"] = "low"
    emo = scene.get("emotion")
    if isinstance(emo, str):
        scene["emotion"] = [emo]
    elif emo is None:
        scene["emotion"] = []
    if not isinstance(scene.get("objects"), list):
        scene["objects"] = []
    if not isinstance(scene.get("empty_surfaces"), list):
        scene["empty_surfaces"] = []
    return scene


def analyze_scene(image_bytes: bytes, frame_id: str | None = None) -> dict:
    """调 Nova VLM,返回归一化后的 SceneJSON。

    frame_id 可选,只用于诊断打印(确认 main.py 传过来的就是预期那张图)。
    任何异常(配置缺失 / 网络错 / 非 200 / JSON 解析失败)向上抛。
    """
    api_key = os.getenv("LLM_API_KEY")
    base_url = os.getenv("LLM_BASE_URL")
    model = os.getenv("LLM_MODEL_VISION")
    if not (api_key and base_url and model):
        raise RuntimeError(
            "LLM_API_KEY / LLM_BASE_URL / LLM_MODEL_VISION 未在 backend/.env 配置"
        )

    img_b64 = base64.b64encode(image_bytes).decode("ascii")
    data_uri = f"data:image/png;base64,{img_b64}"
    prompt = (PROMPTS_DIR / "vision_prompt.txt").read_text(encoding="utf-8")

    # ─── 真实输入诊断:确认传给 VLM 的就是这张静帧图 ───
    image_path = (FRAME_DIR / f"{frame_id}.png") if frame_id else None
    img_md5 = hashlib.md5(image_bytes).hexdigest()
    print("=" * 60)
    print(f"[stage1 真实输入诊断] frame_id: {frame_id}")
    print(f"[stage1 真实输入诊断] 图片实际路径: {image_path}")
    print(f"[stage1 真实输入诊断] 图片文件大小: {len(image_bytes)} bytes")
    print(f"[stage1 真实输入诊断] 图片 MD5: {img_md5}")
    print(f"[stage1 真实输入诊断] base64 前 100 字符: {img_b64[:100]}")
    print("=" * 60)

    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": prompt},
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": "请按上述 schema 分析这张暂停帧,只输出 JSON。"},
                    {"type": "image_url", "image_url": {"url": data_uri}},
                ],
            },
        ],
        "max_tokens": 3000,  # 中文 SceneJSON 8 字段需要充足额度,防止被截断
        "temperature": 0.2,
    }

    url = base_url.rstrip("/") + "/chat/completions"
    
    import time
    print(f"🔥 [stage1] >>> 准备发起网络请求调大模型, 时间: {time.time()}")
    
    with httpx.Client(timeout=60.0) as client:
        r = client.post(
            url,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json=payload,
        )
        
    print(f"🔥 [stage1] <<< 网络请求结束，大模型返回, 时间: {time.time()}")

    if r.status_code != 200:
        raise RuntimeError(f"VLM HTTP {r.status_code}: {r.text[:300]}")

    data = r.json()
    content = data["choices"][0]["message"]["content"]
    if isinstance(content, list):
        content = "".join(p.get("text", "") for p in content if isinstance(p, dict))

    print(f"[stage1] VLM 原始响应前 500 字符: {content[:500]}")

    cleaned = _strip_json_fence(content)
    try:
        scene = json.loads(cleaned)
    except json.JSONDecodeError as e:
        raise RuntimeError(
            f"VLM 输出非合法 JSON:{e};原文前 2000 字:{content[:2000]}"
        ) from e

    return _normalize_scene(scene)
