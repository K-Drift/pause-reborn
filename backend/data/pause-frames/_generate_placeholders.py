"""生成 backend/data/pause-frames/{frame_id}.png 占位图。

真实 demo 时,把 PNG 替换为真实剧照即可(同名覆盖)。
重新生成:python backend/data/pause-frames/_generate_placeholders.py
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

OUT = Path(__file__).resolve().parent

FRAMES = [
    {
        "id": "urban_night_bar",
        "bg": [(45, 31, 21), (80, 55, 35)],
        "title": "都市夜居酒屋",
        "subtitle": "男性独饮 · 暖黄昏暗",
        "accent": (220, 160, 60),
    },
    {
        "id": "palace_ancient",
        "bg": [(58, 40, 32), (92, 65, 48)],
        "title": "古代宫廷",
        "subtitle": "烛火 · 木质",
        "accent": (200, 150, 90),
    },
    {
        "id": "sweet_morning",
        "bg": [(245, 200, 168), (255, 230, 200)],
        "title": "晨间咖啡馆",
        "subtitle": "阳光斜照 · 浅木桌",
        "accent": (180, 100, 60),
    },
    {
        "id": "hospital_sensitive",
        "bg": [(200, 214, 220), (240, 244, 248)],
        "title": "医院病房",
        "subtitle": "白光 · 仪器旁",
        "accent": (100, 110, 130),
    },
    {
        "id": "late_night_solo",
        "bg": [(20, 24, 31), (40, 50, 70)],
        "title": "深夜独居",
        "subtitle": "屏幕微光 · 卧室",
        "accent": (110, 130, 200),
    },
]

W, H = 1280, 720


def find_font(size: int):
    candidates = [
        "C:/Windows/Fonts/msyh.ttc",
        "C:/Windows/Fonts/msyhbd.ttc",
        "C:/Windows/Fonts/simhei.ttf",
        "C:/Windows/Fonts/simsun.ttc",
    ]
    for p in candidates:
        try:
            return ImageFont.truetype(p, size)
        except OSError:
            continue
    return ImageFont.load_default()


def vertical_gradient(c1: tuple, c2: tuple) -> Image.Image:
    img = Image.new("RGB", (W, H), c1)
    d = ImageDraw.Draw(img)
    for y in range(H):
        t = y / H
        r = int(c1[0] * (1 - t) + c2[0] * t)
        g = int(c1[1] * (1 - t) + c2[1] * t)
        b = int(c1[2] * (1 - t) + c2[2] * t)
        d.line([(0, y), (W, y)], fill=(r, g, b))
    return img


def main() -> None:
    title_font = find_font(72)
    sub_font = find_font(36)
    label_font = find_font(20)
    for f in FRAMES:
        img = vertical_gradient(f["bg"][0], f["bg"][1])
        d = ImageDraw.Draw(img)
        bbox = d.textbbox((0, 0), f["title"], font=title_font)
        tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
        d.text(
            ((W - tw) // 2, (H - th) // 2 - 30),
            f["title"],
            font=title_font,
            fill=f["accent"],
        )
        bbox = d.textbbox((0, 0), f["subtitle"], font=sub_font)
        tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
        d.text(
            ((W - tw) // 2, (H + th) // 2 + 30),
            f["subtitle"],
            font=sub_font,
            fill=(220, 220, 220),
        )
        d.text(
            (20, H - 40),
            f"占位帧 · {f['id']} · 替换为真实剧照",
            font=label_font,
            fill=(150, 150, 150),
        )
        out = OUT / f"{f['id']}.png"
        img.save(out, "PNG")
        print(f"  generated {out.name} ({out.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
    print("Done.")
