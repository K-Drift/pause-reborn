"""Stage 2c 准入测试:中转站图像生成(图生图)。

⚠️ 该平台复用 chat/completions 接口:
   - POST $IMAGE_BASE_URL/chat/completions
   - 输入 messages[].content 内含 image_url(图生图)
   - 响应 choices[0].message.content 是 **Markdown 格式的图片链接**
     例如:`![image](https://...png)`
     代码需正则提取 URL 后下载图片到本地

首次运行会生成 backend/tests/fixtures/sample_64x64.png 作为输入图。
成功输出图保存到 backend/tests/_image_gen_output.png。

运行:
    cd backend
    .venv/Scripts/python.exe tests/test_image_gen.py
"""

from __future__ import annotations

import base64
import os
import re
import sys
from pathlib import Path

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

import httpx

API_KEY = os.getenv("IMAGE_API_KEY")
BASE_URL = os.getenv("IMAGE_BASE_URL")
MODEL = os.getenv("IMAGE_MODEL")

FIXTURE = Path(__file__).resolve().parent / "fixtures" / "sample_64x64.png"
OUT = Path(__file__).resolve().parent / "_image_gen_output.png"

# Markdown 图片:![alt](url)。url 不能含 ')' 或空白
MD_IMG_RE = re.compile(r"!\[[^\]]*\]\((https?://[^)\s]+)\)")
# 兜底:裸 URL
URL_RE = re.compile(r"https?://[^\s)\]]+\.(?:png|jpg|jpeg|webp|gif)", re.IGNORECASE)


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


def extract_image_url(content: str) -> str | None:
    m = MD_IMG_RE.search(content)
    if m:
        return m.group(1)
    m = URL_RE.search(content)
    if m:
        return m.group(0)
    return None


def main() -> int:
    missing = [
        k for k, v in {
            "IMAGE_API_KEY": API_KEY,
            "IMAGE_BASE_URL": BASE_URL,
            "IMAGE_MODEL": MODEL,
        }.items() if not v
    ]
    if missing:
        print(f"[FAIL] 缺少环境变量(检查 backend/.env):{', '.join(missing)}")
        return 1

    print(f"[INFO] IMAGE_API_KEY  = {mask(API_KEY)}")
    print(f"[INFO] IMAGE_BASE_URL = {BASE_URL}")
    print(f"[INFO] IMAGE_MODEL    = {MODEL}")
    proxy = os.getenv("HTTPS_PROXY") or os.getenv("HTTP_PROXY")
    if proxy:
        print(f"[INFO] proxy          = {proxy}")

    ensure_fixture()
    img_b64 = base64.b64encode(FIXTURE.read_bytes()).decode("ascii")
    data_uri = f"data:image/png;base64,{img_b64}"

    payload = {
        "model": MODEL,
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": "把这张图改造成深夜居酒屋的氛围画,暖色调灯光,木质吧台,胶片颗粒感。",
                    },
                    {"type": "image_url", "image_url": {"url": data_uri}},
                ],
            }
        ],
    }

    url = BASE_URL.rstrip("/") + "/chat/completions"
    try:
        with httpx.Client(timeout=180.0) as client:
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
        print(f"[FAIL] HTTP {r.status_code}\n响应前 800 字:\n{r.text[:800]}")
        return 1

    try:
        data = r.json()
        content = data["choices"][0]["message"]["content"]
    except (KeyError, IndexError, ValueError) as e:
        print(f"[FAIL] 响应解析失败:{type(e).__name__}: {e}\n原文:{r.text[:800]}")
        return 1

    # content 可能是 str 也可能是 list-of-parts;两种都展开为纯文本
    if isinstance(content, list):
        text_blob = "\n".join(
            p.get("text", "") for p in content if isinstance(p, dict)
        )
    else:
        text_blob = str(content)

    preview = text_blob[:300].replace("\n", " ")
    print(f"[INFO] message.content 前 300 字:{preview}")

    img_url = extract_image_url(text_blob)
    if not img_url:
        print("[FAIL] 无法从 Markdown 中提取图片 URL。完整 content:")
        print(text_blob)
        return 1
    print(f"[INFO] 提取到图片 URL:{img_url}")

    try:
        with httpx.Client(timeout=120.0, follow_redirects=True) as client:
            img_r = client.get(img_url)
    except Exception as e:
        print(f"[FAIL] 下载图片网络异常:{type(e).__name__}: {e}")
        return 1

    if img_r.status_code != 200:
        print(f"[FAIL] 下载图片 HTTP {img_r.status_code}\n响应前 300 字:{img_r.text[:300]}")
        return 1

    if len(img_r.content) < 200:
        print(f"[FAIL] 下载内容过小({len(img_r.content)} bytes),疑似不是图片")
        return 1

    OUT.write_bytes(img_r.content)
    size_kb = len(img_r.content) / 1024
    print(f"[OK] 图片已保存 → {OUT.name}({size_kb:.1f} KB)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
