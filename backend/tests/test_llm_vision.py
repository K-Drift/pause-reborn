"""Stage 2a 准入测试:Nova 视觉 LLM(走中转站,OpenAI 兼容协议)。

接口:POST $LLM_BASE_URL/chat/completions,Authorization: Bearer $LLM_API_KEY
首次运行会用 Pillow 生成 backend/tests/fixtures/sample_64x64.png 作为输入。

运行:
    cd backend
    .venv/Scripts/python.exe tests/test_llm_vision.py
"""

from __future__ import annotations

import base64
import os
import sys
from pathlib import Path

# 强制 stdout UTF-8,避免 Windows GBK 控制台打印中文报错
try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

import httpx

API_KEY = os.getenv("LLM_API_KEY")
BASE_URL = os.getenv("LLM_BASE_URL")
MODEL = os.getenv("LLM_MODEL_VISION")

FIXTURE = Path(__file__).resolve().parent / "fixtures" / "sample_64x64.png"


def mask(k: str | None) -> str:
    if not k:
        return "<empty>"
    return f"{k[:7]}...{k[-4:]}" if len(k) > 12 else "<short>"


def ensure_fixture() -> None:
    if FIXTURE.exists():
        return
    FIXTURE.parent.mkdir(parents=True, exist_ok=True)
    try:
        from PIL import Image, ImageDraw
    except ImportError:
        print("[FAIL] 缺少 Pillow,无法生成测试图片;pip install pillow")
        sys.exit(1)
    img = Image.new("RGB", (64, 64), (40, 50, 80))
    d = ImageDraw.Draw(img)
    d.rectangle([10, 10, 54, 54], outline=(220, 200, 120), width=2)
    d.line([(10, 10), (54, 54)], fill=(220, 200, 120), width=2)
    img.save(FIXTURE, "PNG")
    print(f"[INFO] 已生成测试图片 → {FIXTURE}")


def main() -> int:
    missing = [
        k for k, v in {
            "LLM_API_KEY": API_KEY,
            "LLM_BASE_URL": BASE_URL,
            "LLM_MODEL_VISION": MODEL,
        }.items() if not v
    ]
    if missing:
        print(f"[FAIL] 缺少环境变量(检查 backend/.env):{', '.join(missing)}")
        return 1

    print(f"[INFO] LLM_API_KEY      = {mask(API_KEY)}")
    print(f"[INFO] LLM_BASE_URL     = {BASE_URL}")
    print(f"[INFO] LLM_MODEL_VISION = {MODEL}")
    proxy = os.getenv("HTTPS_PROXY") or os.getenv("HTTP_PROXY")
    if proxy:
        print(f"[INFO] proxy            = {proxy}")

    ensure_fixture()
    img_b64 = base64.b64encode(FIXTURE.read_bytes()).decode("ascii")
    data_uri = f"data:image/png;base64,{img_b64}"

    payload = {
        "model": MODEL,
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": "请用一句中文描述这张图,不超过 20 字。"},
                    {"type": "image_url", "image_url": {"url": data_uri}},
                ],
            }
        ],
        "max_tokens": 80,
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

    # content 可能是 str 或 list-of-parts(部分中转站行为)
    if isinstance(text, list):
        text = "".join(p.get("text", "") for p in text if isinstance(p, dict))

    print(f"[OK] 模型返回:{text}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
