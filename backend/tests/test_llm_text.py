"""Stage 2b 准入测试:Nova 文本 LLM(JSON 模式)。

接口:POST $LLM_BASE_URL/chat/completions,OpenAI 兼容协议。
要求模型严格输出 JSON,验证 response_format 与 UTF-8 中文往返。

运行:
    cd backend
    .venv/Scripts/python.exe tests/test_llm_text.py
"""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

import httpx

API_KEY = os.getenv("LLM_API_KEY")
BASE_URL = os.getenv("LLM_BASE_URL")
MODEL = os.getenv("LLM_MODEL_TEXT")


def mask(k: str | None) -> str:
    if not k:
        return "<empty>"
    return f"{k[:7]}...{k[-4:]}" if len(k) > 12 else "<short>"


def main() -> int:
    missing = [
        k for k, v in {
            "LLM_API_KEY": API_KEY,
            "LLM_BASE_URL": BASE_URL,
            "LLM_MODEL_TEXT": MODEL,
        }.items() if not v
    ]
    if missing:
        print(f"[FAIL] 缺少环境变量(检查 backend/.env):{', '.join(missing)}")
        return 1

    print(f"[INFO] LLM_API_KEY    = {mask(API_KEY)}")
    print(f"[INFO] LLM_BASE_URL   = {BASE_URL}")
    print(f"[INFO] LLM_MODEL_TEXT = {MODEL}")
    proxy = os.getenv("HTTPS_PROXY") or os.getenv("HTTP_PROXY")
    if proxy:
        print(f"[INFO] proxy          = {proxy}")

    payload = {
        "model": MODEL,
        "messages": [
            {
                "role": "system",
                "content": (
                    "你是一个 JSON 输出器。只输出严格 JSON,不要 markdown,不要解释。"
                    '字段:{"ok": true, "scene": "<场景一句话概括>", "mood": "<情绪关键词,2-4 个,空格分隔>"}。'
                ),
            },
            {
                "role": "user",
                "content": "都市深夜居酒屋,昏黄灯光下两人对话,桌上有一杯威士忌。",
            },
        ],
        "max_tokens": 300,
        "response_format": {"type": "json_object"},
        "temperature": 0.3,
    }

    url = BASE_URL.rstrip("/") + "/chat/completions"
    try:
        with httpx.Client(timeout=60.0) as client:
            r = client.post(
                url,
                headers={
                    "Authorization": f"Bearer {API_KEY}",
                    "Content-Type": "application/json",
                },
                json=payload,
            )
    except Exception as e:
        print(f"[FAIL] 网络/调用异常:{type(e).__name__}: {e}")
        return 1

    if r.status_code != 200:
        print(f"[FAIL] HTTP {r.status_code}\n响应前 600 字:\n{r.text[:600]}")
        return 1

    try:
        data = r.json()
        text = data["choices"][0]["message"]["content"]
    except (KeyError, IndexError, ValueError) as e:
        print(f"[FAIL] 响应解析失败:{type(e).__name__}: {e}\n原文:{r.text[:600]}")
        return 1

    if isinstance(text, list):
        text = "".join(p.get("text", "") for p in text if isinstance(p, dict))

    # 验证返回是否合法 JSON
    try:
        parsed = json.loads(text)
    except json.JSONDecodeError as e:
        print(f"[FAIL] 模型返回 200 但 content 非合法 JSON:{e}")
        print(f"原文:{text[:600]}")
        return 1

    print("[OK] 模型返回合法 JSON:")
    print(json.dumps(parsed, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
