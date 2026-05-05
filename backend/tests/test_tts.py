"""Stage 4 准入测试:ElevenLabs TTS。

ElevenLabs 直连官方 https://api.elevenlabs.io(没有中转 base_url 约定)。
若需走代理,设置 HTTPS_PROXY 环境变量,httpx 会自动读取。

运行:
    cd backend
    .venv/Scripts/python.exe tests/test_tts.py
"""

from __future__ import annotations

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

API_KEY = os.getenv("ELEVENLABS_API_KEY")
# Rachel:ElevenLabs 公共预置 voice,所有 plan 可用
VOICE_ID = "21m00Tcm4TlvDq8ikWAM"

OUT = Path(__file__).resolve().parent / "_tts_smoketest.mp3"


def mask(k: str | None) -> str:
    if not k:
        return "<empty>"
    return f"{k[:7]}...{k[-4:]}" if len(k) > 12 else "<short>"


def main() -> int:
    if not API_KEY:
        print("[FAIL] ELEVENLABS_API_KEY 未配置(检查 backend/.env)")
        return 1
    print(f"[INFO] ELEVENLABS_API_KEY = {mask(API_KEY)}")
    print(f"[INFO] voice_id           = {VOICE_ID}(Rachel · 公共预置)")
    proxy = os.getenv("HTTPS_PROXY") or os.getenv("HTTP_PROXY")
    if proxy:
        print(f"[INFO] proxy             = {proxy}")

    url = f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}"
    payload = {
        "text": "今晚的夜,不必兑水。",
        "model_id": "eleven_multilingual_v2",
    }

    try:
        with httpx.Client(timeout=60.0) as client:
            r = client.post(
                url,
                headers={
                    "xi-api-key": API_KEY,
                    "Content-Type": "application/json",
                    "Accept": "audio/mpeg",
                },
                json=payload,
            )
    except Exception as e:
        print(f"[FAIL] 网络/调用异常:{type(e).__name__}: {e}")
        return 1

    if r.status_code != 200:
        print(f"[FAIL] HTTP {r.status_code}\n响应前 600 字:\n{r.text[:600]}")
        return 1

    audio = r.content
    if len(audio) < 200:
        print(f"[FAIL] 200 但音频字节过少({len(audio)} bytes)")
        return 1

    OUT.write_bytes(audio)
    print(f"[OK] 收到音频 {len(audio)} bytes,已写到 {OUT.name}(可试听后删除)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
