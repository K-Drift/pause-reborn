"""Pause Reborn — FastAPI 后端入口(Stage 4:三段独立 endpoint + 渐次反馈)

接口形态(每个独立可用、独立失败、独立降级到 mock):

  POST /api/analyze-scene   只跑 VLM 场景理解            → {stage:"scene",   ...}
  POST /api/decide-ad        只跑 LLM 广告决策(传 scene)  → {stage:"decision", ...}
  POST /api/generate-image  以 scene+decision 出广告图   → {stage:"image",   ...}

每个响应都带:
  stage        段标识,前端识别用
  source       "real" | "mock" | "mock_fallback"
                 - real:USE_REAL_AI=true 且本段成功
                 - mock:USE_REAL_AI=false,直接走预置 JSON
                 - mock_fallback:真 API 调用失败,自动回落到 mock(并附 error 字段)
  elapsed_ms   本段实际耗时(含 mock 假等待),用于调试

USE_REAL_AI=false 时,后端按"演示节奏"做假等待:
  scene=1.5s  decision=1.0s  image=2.0s,统一乘以 MOCK_DELAY_MULTIPLIER。
"""

from __future__ import annotations

import json
import os
import sys
import time
import traceback
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

# override=True:.env 文件值优先于 shell / 系统环境变量(防止外部环境变量误覆盖)
load_dotenv(Path(__file__).parent / ".env", override=True)


def _mask(v: str | None) -> str:
    if not v:
        return "<MISSING>"
    return f"{v[:7]}...{v[-4:]}" if len(v) > 12 else "<short>"


def _bool_env(key: str, default: bool) -> bool:
    raw = os.getenv(key)
    if raw is None:
        return default
    return raw.strip().lower() in ("1", "true", "yes", "on")


def _float_env(key: str, default: float) -> float:
    raw = os.getenv(key)
    if raw is None or raw.strip() == "":
        return default
    try:
        return float(raw)
    except ValueError:
        return default


USE_REAL_AI = _bool_env("USE_REAL_AI", True)
MOCK_DELAY_MULTIPLIER = _float_env("MOCK_DELAY_MULTIPLIER", 1.0)

# Mock 模式下三段假等待(秒),按 SPEC 演示节奏:1.5s / 1.0s / 2.0s
_MOCK_BASE_DELAYS = {"scene": 1.5, "decision": 1.0, "image": 2.0}

DATA_DIR = Path(__file__).parent / "data"
MOCK_DIR = DATA_DIR / "mock_responses"
GEN_DIR = Path(__file__).parent / "generated"
GEN_DIR.mkdir(parents=True, exist_ok=True)


# 启动时打印加载到的关键变量,确认 .env 真的生效
print("=" * 70, flush=True)
print("Pause Reborn backend  [Stage 4: 三段独立 endpoint]", flush=True)
print(f"  USE_REAL_AI            = {USE_REAL_AI}", flush=True)
print(f"  MOCK_DELAY_MULTIPLIER  = {MOCK_DELAY_MULTIPLIER}", flush=True)
print(f"  LLM_BASE_URL           = {os.getenv('LLM_BASE_URL') or '<MISSING>'}", flush=True)
print(f"  LLM_MODEL_VISION       = {os.getenv('LLM_MODEL_VISION') or '<MISSING>'}", flush=True)
print(f"  LLM_MODEL_TEXT         = {os.getenv('LLM_MODEL_TEXT') or '<MISSING>'}", flush=True)
print(f"  LLM_API_KEY            = {_mask(os.getenv('LLM_API_KEY'))}", flush=True)
print(f"  IMAGE_BASE_URL         = {os.getenv('IMAGE_BASE_URL') or '<MISSING>'}", flush=True)
print(f"  IMAGE_MODEL            = {os.getenv('IMAGE_MODEL') or '<MISSING>'}", flush=True)
print(f"  IMAGE_API_KEY          = {_mask(os.getenv('IMAGE_API_KEY'))}", flush=True)
print(f"  ELEVENLABS_API_KEY     = {_mask(os.getenv('ELEVENLABS_API_KEY'))}", flush=True)
print("=" * 70, flush=True)


app = FastAPI(title="Pause Reborn API", version="0.0.5-stage4")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/generated", StaticFiles(directory=str(GEN_DIR)), name="generated")


# ─── 全局异常 → 500 + traceback,既打到控制台也回到客户端 ──

@app.exception_handler(Exception)
async def all_exception_handler(request: Request, exc: Exception):
    if isinstance(exc, HTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail},
        )
    tb = traceback.format_exc()
    sys.stderr.write(
        f"\n{'=' * 70}\n"
        f"[UNHANDLED EXCEPTION]  {request.method} {request.url.path}\n"
        f"{tb}"
        f"{'=' * 70}\n"
    )
    sys.stderr.flush()
    return JSONResponse(
        status_code=500,
        content={
            "error": type(exc).__name__,
            "message": str(exc),
            "traceback": tb,
        },
    )


# ─── 工具:mock 数据加载 + 假等待 ──

def _mock_sleep(stage: str) -> None:
    delay = _MOCK_BASE_DELAYS.get(stage, 0) * MOCK_DELAY_MULTIPLIER
    if delay > 0:
        time.sleep(delay)


def _load_mock(frame_id: str) -> dict:
    """读 backend/data/mock_responses/{frame_id}.json 整体(含 scene + decision)。"""
    p = MOCK_DIR / f"{frame_id}.json"
    if not p.exists():
        raise HTTPException(status_code=404, detail=f"未找到 mock 数据:{frame_id}")
    return json.loads(p.read_text(encoding="utf-8"))


def _err_short(e: Exception) -> str:
    return f"{type(e).__name__}: {str(e)[:200]}"


# ─── Stage 5/6:content_switch 硬兜底 + 按 persona 派生陪伴内容 ──
# 字段严格对齐 SPEC §1.8.2:{decision, suggested_content, reason}

_CONTENT_SWITCH_BY_PERSONA: dict[str, tuple[str, str]] = {
    "urban_male_35": (
        "《武林外传》第 3 集 —— 佟湘玉的账本风波",
        "AI 护航:今晚不必再喝一杯,先看一段不必动脑的轻松剧。",
    ),
    "young_female_25": (
        "《下一站是幸福》第 5 集 —— 甜宠日常",
        "AI 护航:此刻情绪偏沉,换一段甜剧暖一暖。",
    ),
    "executive_female_40": (
        "纪录片《人生第二次》—— 选择",
        "AI 护航:决策已多,换一段他人的人生稍作喘息。",
    ),
}
_CONTENT_SWITCH_DEFAULT = (
    "《武林外传》第 3 集 —— 佟湘玉的账本风波",
    "AI 护航:检测到您当前可能需要放松,为您切换轻松内容。",
)


def _content_switch_fallback(persona_id: str | None) -> dict:
    content, reason = _CONTENT_SWITCH_BY_PERSONA.get(
        persona_id or "", _CONTENT_SWITCH_DEFAULT
    )
    return {
        "decision": "content_switch",
        "suggested_content": content,
        "reason": reason,
    }


def _enforce_fatigue_switch(decision: dict, persona_id: str | None) -> tuple[dict, bool]:
    """情绪疲劳态硬兜底:
    - decision==no_ad     → 保留(敏感场景优先级最高)
    - decision==content_switch → 保留 LLM 输出,缺字段时补
    - decision==show_ad    → 强行改写为陪伴模式 fallback,返回 (new, True)
    返回:(决策 dict, 是否被硬兜底改写)
    """
    d = decision.get("decision")
    if d == "no_ad":
        return decision, False
    if d == "content_switch":
        # 字段补全
        out = dict(decision)
        out.setdefault("suggested_content", _CONTENT_SWITCH_BY_PERSONA.get(
            persona_id or "", _CONTENT_SWITCH_DEFAULT)[0])
        out.setdefault("reason", _CONTENT_SWITCH_BY_PERSONA.get(
            persona_id or "", _CONTENT_SWITCH_DEFAULT)[1])
        # 移除 SPEC 之外的字段(如 LLM 误输出 voice_preset)
        out = {k: out[k] for k in ("decision", "suggested_content", "reason") if k in out}
        return out, False
    # show_ad 在 fatigue 态下违规 → 硬兜底
    print(
        f"[hard-fallback] LLM 在 user_state=emotional_fatigue 下输出 show_ad,"
        f"已强制改写为 content_switch(persona_id={persona_id!r})",
        flush=True,
    )
    return _content_switch_fallback(persona_id), True


@app.get("/health")
def health() -> dict:
    return {
        "status": "ok",
        "use_real_ai": USE_REAL_AI,
        "mock_delay_multiplier": MOCK_DELAY_MULTIPLIER,
        "llm_base_url": os.getenv("LLM_BASE_URL"),
        "llm_model_vision": os.getenv("LLM_MODEL_VISION"),
        "llm_model_text": os.getenv("LLM_MODEL_TEXT"),
        "image_base_url": os.getenv("IMAGE_BASE_URL"),
        "image_model": os.getenv("IMAGE_MODEL"),
    }


# ─── /api/analyze-scene:第一段(VLM 场景理解)──

class AnalyzeSceneRequest(BaseModel):
    frame_id: str


@app.post("/api/analyze-scene")
def analyze_scene_route(req: AnalyzeSceneRequest) -> dict:
    import os
    print(f"=====================================")
    print(f"=== 探针输出 USE_REAL_AI: {os.getenv('USE_REAL_AI')} ===")
    print(f"=====================================")
    
    started = time.time()
    print(f"\n[/api/analyze-scene] frame_id={req.frame_id!r}  USE_REAL_AI={USE_REAL_AI}", flush=True)

    if not USE_REAL_AI:
        _mock_sleep("scene")
        scene = _load_mock(req.frame_id)["scene"]
        return {
            "stage": "scene",
            "source": "mock",
            "scene": scene,
            "elapsed_ms": int((time.time() - started) * 1000),
        }

    try:
        from pipeline.stage1_vision import analyze_scene, load_frame_image
        image_bytes = load_frame_image(req.frame_id)
        
        # ================= 插入探针 =================
        print(f"========== 探针: 验证图片真伪 ==========")
        print(f"[stage1] 当前传入的 frame_id: {req.frame_id}")
        print(f"[stage1] 即将发给VLM的图片大小: {len(image_bytes)} bytes")
        print(f"========================================")
        # ============================================

        scene = analyze_scene(image_bytes, frame_id=req.frame_id)
        return {
            "stage": "scene",
            "source": "real",
            "scene": scene,
            "elapsed_ms": int((time.time() - started) * 1000),
        }
    except Exception as e:
        traceback.print_exc()
        # 降级到 mock,不让流程中断
        scene = _load_mock(req.frame_id)["scene"]
        return {
            "stage": "scene",
            "source": "mock_fallback",
            "scene": scene,
            "error": _err_short(e),
            "elapsed_ms": int((time.time() - started) * 1000),
        }


# ─── /api/decide-ad:第二段(LLM 广告决策)──

class DecideAdRequest(BaseModel):
    frame_id: str  # 仅在降级时用于查 mock
    scene: dict
    persona_id: str | None = "urban_male_35"
    user_state: str | None = "normal"


# Mock 模式 normal 路径下,按 persona 覆盖品牌/文案/声线,演示"画像定品牌"。
# 真 API 模式由 LLM 自行根据 persona 选品,不走这里。
_PERSONA_NORMAL_OVERRIDE: dict[str, dict] = {
    "urban_male_35": {
        "selected_brand": "云岭十八年 · 单一麦芽",
        "alternative_brands": ["瑞士机械腕表", "深夜便利店啤酒"],
        "ad_copy": "今晚的夜,不必兑水。",
        "voice_preset": "深夜电台型",
        "reasoning": "金融男画像:威士忌品类与场景情绪贴合,声线维持深夜独酌的私语感。",
    },
    "young_female_25": {
        "selected_brand": "晨啄 · 手冲挂耳咖啡",
        "alternative_brands": ["南风香薰", "草本花茶"],
        "ad_copy": "醒来的第一件事,值得慢一点。",
        "voice_preset": "晨间咖啡馆型",
        "reasoning": "年轻女生画像:咖啡/香薰类轻消费品贴近其生活节奏,声线明亮轻盈。",
    },
    "executive_female_40": {
        "selected_brand": "蓝雾庄园 · 珍藏红",
        "alternative_brands": ["雅集瓷器", "高端面霜"],
        "ad_copy": "灯下,半盏可饮。",
        "voice_preset": "冷峻陈述型",
        "reasoning": "女性高管画像:红酒+雅致用品契合其雅致克制的审美;声线中性低调,不喧宾夺主。",
    },
}


def _apply_persona_override(decision: dict, persona_id: str | None) -> dict:
    """Mock 模式 normal 路径:把 persona 的品牌包覆盖到 mock decision 上。
    保留 mock 原有 scores / scene_emotion_fit 等字段。
    """
    if decision.get("decision") != "show_ad":
        return decision
    override = _PERSONA_NORMAL_OVERRIDE.get(persona_id or "")
    if not override:
        return decision
    out = dict(decision)
    out.update(override)
    return out


def _decide_mock(frame_id: str, persona_id: str | None, user_state: str) -> dict:
    """Mock 模式:基础 mock 决策 + fatigue 强转 content_switch + persona 品牌覆盖。
    优先级:no_ad(敏感场景)> emotional_fatigue > persona override。
    """
    base = _load_mock(frame_id)["decision"]
    if base.get("decision") == "no_ad":
        return base
    if user_state == "emotional_fatigue":
        return _content_switch_fallback(persona_id)
    return _apply_persona_override(base, persona_id)


@app.post("/api/decide-ad")
def decide_ad_route(req: DecideAdRequest) -> dict:
    started = time.time()
    persona_id = req.persona_id or "urban_male_35"
    user_state = req.user_state or "normal"
    print(
        f"\n[/api/decide-ad] frame_id={req.frame_id!r} persona_id={persona_id!r} "
        f"user_state={user_state!r}  USE_REAL_AI={USE_REAL_AI}",
        flush=True,
    )

    if not USE_REAL_AI:
        _mock_sleep("decision")
        decision = _decide_mock(req.frame_id, persona_id, user_state)
        return {
            "stage": "decision",
            "source": "mock",
            "decision": decision,
            "elapsed_ms": int((time.time() - started) * 1000),
        }

    try:
        from pipeline.stage2_decision import decide_ad, get_persona, load_ad_library
        persona = get_persona(persona_id)
        ad_library = load_ad_library()
        decision = decide_ad(req.scene, persona, user_state, ad_library)
    except Exception as e:
        traceback.print_exc()
        decision = _decide_mock(req.frame_id, persona_id, user_state)
        decision["_ai_status"] = "fallback"
        decision["_fallback_reason"] = f"{type(e).__name__}: {str(e)[:80]}"
        decision["_fallback_stage"] = "stage2"
        return {
            "stage": "decision",
            "source": "mock_fallback",
            "decision": decision,
            "error": _err_short(e),
            "elapsed_ms": int((time.time() - started) * 1000),
        }

    # 硬兜底:fatigue 态下若 LLM 出了 show_ad,强制改写为陪伴模式
    overridden = False
    if user_state == "emotional_fatigue":
        decision, overridden = _enforce_fatigue_switch(decision, persona_id)

    decision["_ai_status"] = "live"
    return {
        "stage": "decision",
        "source": "real_overridden" if overridden else "real",
        "decision": decision,
        "elapsed_ms": int((time.time() - started) * 1000),
    }


# ─── /api/generate-image:第三段(文生图,氛围卡片)──

class GenerateImageRequest(BaseModel):
    frame_id: str  # 仅 mock_fallback 标识用,本段没有 mock 图(前端会回退到 CSS 叠层)
    scene: dict
    decision: dict


@app.post("/api/generate-image")
def generate_image_route(req: GenerateImageRequest) -> dict:
    started = time.time()
    print(
        f"\n[/api/generate-image] frame_id={req.frame_id!r}  "
        f"brand={req.decision.get('selected_brand')!r}  USE_REAL_AI={USE_REAL_AI}",
        flush=True,
    )

    # 决策非 show_ad 时无需调用图像 API
    if req.decision.get("decision") != "show_ad":
        return {
            "stage": "image",
            "source": "skipped",
            "image_url": None,
            "reason": f"decision={req.decision.get('decision')!r},无需广告图",
            "elapsed_ms": int((time.time() - started) * 1000),
        }

    if not USE_REAL_AI:
        _mock_sleep("image")
        # mock 模式没有真图,前端按 image_url=null 回退到 CSS 叠层模拟
        return {
            "stage": "image",
            "source": "mock",
            "image_url": None,
            "elapsed_ms": int((time.time() - started) * 1000),
        }

    try:
        from pipeline.stage3_generate import generate_ad_image
        result = generate_ad_image(req.scene, req.decision)
        return {
            "stage": "image",
            "source": "real",
            "image_url": result["image_url"],
            "remote_url": result.get("remote_url"),
            "size_bytes": result.get("size_bytes"),
            "_ai_status": "live",
            "elapsed_ms": int((time.time() - started) * 1000),
        }
    except Exception as e:
        traceback.print_exc()
        # 降级:返 image_url=null,前端回退到 CSS 叠层
        return {
            "stage": "image",
            "source": "mock_fallback",
            "image_url": None,
            "error": _err_short(e),
            "_ai_status": "fallback",
            "_fallback_reason": f"{type(e).__name__}: {str(e)[:80]}",
            "_fallback_stage": "stage3",
            "elapsed_ms": int((time.time() - started) * 1000),
        }


# ─── 占位:对话追问 / TTS,留到后续阶段 ──

class AskRequest(BaseModel):
    question: str
    voice_preset: str | None = None
    ad_context: dict | None = None


@app.post("/api/ask")
def ask(req: AskRequest) -> dict:
    return {"text": f"(占位回答)收到问题:{req.question}", "audio_url": None}


class TTSRequest(BaseModel):
    text: str
    voice_preset: str


@app.post("/api/tts")
def tts(req: TTSRequest) -> dict:
    return {"audio_url": None, "note": "占位,未生成音频"}
