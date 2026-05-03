"""Pause Reborn — FastAPI 后端入口

Stage 0:最小骨架。所有 /api/* 端点先返回固定 mock JSON,Stage 1 起接 mock_responses 文件,
Stage 2 起逐段替换为真 AI 调用。
"""

from __future__ import annotations

import json
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

load_dotenv()

DATA_DIR = Path(__file__).parent / "data"
MOCK_DIR = DATA_DIR / "mock_responses"

app = FastAPI(title="Pause Reborn API", version="0.0.1")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "stage": 0}


# ─── Stage 0 占位:返回固定 mock,Stage 1 起按 frame_id 读 mock_responses ──

class AnalyzeRequest(BaseModel):
    frame_id: str
    persona_id: str | None = None
    user_state: str | None = "normal"


@app.post("/api/analyze")
def analyze(req: AnalyzeRequest) -> dict:
    """暂停帧 → SceneJSON + 广告决策。Stage 0 返回 placeholder。"""
    mock_file = MOCK_DIR / f"{req.frame_id}.json"
    if mock_file.exists():
        return json.loads(mock_file.read_text(encoding="utf-8"))
    return {
        "scene": {"placeholder": True, "frame_id": req.frame_id},
        "decision": {
            "decision": "show_ad",
            "selected_brand": "占位品牌",
            "ad_copy": "Stage 0 占位,Stage 1 起替换为真 mock 数据",
            "voice_preset": "深夜电台型",
            "scores": {
                "scene_emotion_fit": 0,
                "brand_tone_match": 0,
                "user_disturbance": "low",
                "predicted_attention_lift": "+0%",
            },
            "reasoning": "Stage 0 骨架占位",
        },
    }


class AskRequest(BaseModel):
    question: str
    voice_preset: str | None = None
    ad_context: dict | None = None


@app.post("/api/ask")
def ask(req: AskRequest) -> dict:
    """对话追问。Stage 0 占位,Stage 4 接 LLM + TTS。"""
    return {
        "text": f"(Stage 0 占位回答)收到问题:{req.question}",
        "audio_url": None,
    }


class TTSRequest(BaseModel):
    text: str
    voice_preset: str


@app.post("/api/tts")
def tts(req: TTSRequest) -> dict:
    """文字 → 语音。Stage 0 占位,Stage 4 接 ElevenLabs。"""
    return {"audio_url": None, "note": "Stage 0 占位,未生成音频"}
