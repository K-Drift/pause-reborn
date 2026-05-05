"""第三段:图像生成(主路径 = 文生图,氛围卡片)。

走中转站 (IMAGE_BASE_URL,Dchai),复用 OpenAI chat/completions 协议。
特殊点:响应 content 是 Markdown,内含 ![](URL),需正则提取 URL 后下载。

调用方式照搬 backend/tests/test_image_gen.py 已验证的形态,
区别:此处不传 image_url(纯文生图),也不做 try/except 兜底。

输入:scene (dict) + decision (dict,decision=='show_ad')
输出:{"image_url": "/generated/<file>.png", "remote_url": "<原始 URL>", "prompt_used": "<填充后 prompt>"}

异常向上抛,由调用方(main.py)处理。

⚠️ 仅实现主路径(氛围卡片)。VPP 模式(图生图 + mask)留到 stage3_vpp.py,本文件不涉及。
"""

from __future__ import annotations

import os
import re
import time
import uuid
from pathlib import Path

import httpx

PROMPTS_DIR = Path(__file__).resolve().parent.parent / "prompts"
GEN_DIR = Path(__file__).resolve().parent.parent / "generated"

# Markdown 图片:![alt](url)。url 不能含 ')' 或空白
_MD_IMG_RE = re.compile(r"!\[[^\]]*\]\((https?://[^)\s]+)\)")
# 兜底:裸 URL(防止模型偶尔不带 Markdown 包裹)
_URL_RE = re.compile(r"https?://[^\s)\]]+\.(?:png|jpg|jpeg|webp|gif)", re.IGNORECASE)


def _extract_image_url(content: str) -> str | None:
    m = _MD_IMG_RE.search(content)
    if m:
        return m.group(1)
    m = _URL_RE.search(content)
    if m:
        return m.group(0)
    return None


def _build_prompt(scene: dict, decision: dict) -> str:
    """把 image_native_prompt.txt 模板里的占位符填上。"""
    template = (PROMPTS_DIR / "image_native_prompt.txt").read_text(encoding="utf-8")
    return (
        template
        .replace("{color_tone}", str(scene.get("color_tone") or "中性色调"))
        .replace("{lighting}", str(scene.get("lighting") or "柔和光"))
        .replace("{selected_brand}", str(decision.get("selected_brand") or ""))
        .replace("{ad_copy}", str(decision.get("ad_copy") or ""))
    )


def generate_ad_image(scene: dict, decision: dict) -> dict:
    """调中转站文生图,下载图片到 backend/generated/,返回相对 URL。

    任何异常(配置缺失 / 网络错 / 非 200 / Markdown 中无 URL / 下载失败)向上抛。
    """
    if decision.get("decision") != "show_ad":
        raise RuntimeError(
            f"stage3_generate 只在 decision==show_ad 时调用,当前 decision={decision.get('decision')!r}"
        )

    api_key = os.getenv("IMAGE_API_KEY")
    base_url = os.getenv("IMAGE_BASE_URL")
    model = os.getenv("IMAGE_MODEL")
    if not (api_key and base_url and model):
        raise RuntimeError(
            "IMAGE_API_KEY / IMAGE_BASE_URL / IMAGE_MODEL 未在 backend/.env 配置"
        )

    prompt = _build_prompt(scene, decision)

    payload = {
        "model": model,
        "messages": [
            {
                "role": "user",
                "content": [{"type": "text", "text": prompt}],
            }
        ],
    }

    url = base_url.rstrip("/") + "/chat/completions"
    with httpx.Client(timeout=180.0) as client:  # 文生图最长可能 40s,留足余量
        r = client.post(
            url,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json=payload,
        )

    if r.status_code != 200:
        raise RuntimeError(f"图像 HTTP {r.status_code}: {r.text[:300]}")

    data = r.json()
    content = data["choices"][0]["message"]["content"]
    if isinstance(content, list):
        content = "\n".join(p.get("text", "") for p in content if isinstance(p, dict))

    remote_url = _extract_image_url(str(content))
    if not remote_url:
        raise RuntimeError(
            f"无法从响应 Markdown 中提取图片 URL;原文前 300 字:{str(content)[:300]}"
        )

    # 下载
    with httpx.Client(timeout=120.0, follow_redirects=True) as client:
        img_r = client.get(remote_url)
    if img_r.status_code != 200:
        raise RuntimeError(f"下载图片 HTTP {img_r.status_code}: {img_r.text[:300]}")
    if len(img_r.content) < 200:
        raise RuntimeError(f"下载内容过小({len(img_r.content)} bytes),疑似不是图片")

    # 落盘
    GEN_DIR.mkdir(parents=True, exist_ok=True)
    fname = f"{int(time.time())}-{uuid.uuid4().hex[:8]}.png"
    out_path = GEN_DIR / fname
    out_path.write_bytes(img_r.content)

    return {
        "image_url": f"/generated/{fname}",
        "remote_url": remote_url,
        "prompt_used": prompt,
        "size_bytes": len(img_r.content),
    }
