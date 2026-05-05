// 类型对齐 SPEC §1.8.1 / §1.8.2

export type Sensitivity = "low" | "medium" | "high";

export type Emotion =
  | "孤独"
  | "低落"
  | "紧张"
  | "甜蜜"
  | "悲伤"
  | "沉重"
  | "轻松"
  | "悬疑";

export interface SceneJSON {
  scene: string;
  characters: string;
  emotion: Emotion[] | string; // LLM 可能返 1-2 个
  color_tone: string;
  lighting: string;
  objects: string[];
  empty_surfaces: string[];
  sensitivity: Sensitivity;
}

export type VoicePreset =
  | "深夜电台型"
  | "晨间咖啡馆型"
  | "古风旁白型"
  | "悬疑低语型"
  | "冷峻陈述型";

export interface AdScores {
  scene_emotion_fit: number;
  brand_tone_match: number;
  user_disturbance: "low" | "medium" | "high";
  predicted_attention_lift: string;
}

export interface ShowAdDecision {
  decision: "show_ad";
  selected_brand: string;
  alternative_brands: string[];
  ad_copy: string;
  voice_preset: VoicePreset;
  scores: AdScores;
  reasoning: string;
  // Stage 2c 起前端会读 generated_image 字段(base64 或 URL);Stage 1 用 CSS 模拟
  generated_image?: string;
}

export interface NoAdDecision {
  decision: "no_ad";
  reason: string;
}

export interface ContentSwitchDecision {
  decision: "content_switch";
  suggested_content: string;
  reason: string;
}

// Stage 7:前端在 stage1 sensitivity==='high' 时熔断,不调 stage2/3,本地构造该决策。
// 不会出现在任何后端响应里,纯前端哨兵。
export interface RestraintModeDecision {
  decision: "restraint";
  reason: string;
}

export type Decision =
  | ShowAdDecision
  | NoAdDecision
  | ContentSwitchDecision
  | RestraintModeDecision;

// Stage 4:三段独立 endpoint 的响应类型
// source 值:
//   real             — 真 API 成功
//   real_overridden  — 真 API 成功,但被服务端硬兜底改写(如 fatigue 强转 content_switch)
//   mock             — USE_REAL_AI=false,直接走 mock_responses
//   mock_fallback    — 真 API 失败,自动降级到 mock
//   skipped          — image 段无需调用(decision != show_ad)
//   cached           — 前端 scene 缓存命中,未重跑 stage1
export type StageSource =
  | "real"
  | "real_overridden"
  | "mock"
  | "mock_fallback"
  | "skipped"
  | "cached";

export interface AnalyzeSceneResponse {
  stage: "scene";
  source: StageSource;
  scene: SceneJSON;
  elapsed_ms: number;
  error?: string;
}

export interface DecideAdRequest {
  frame_id: string;
  scene: SceneJSON;
  persona_id?: string;
  user_state?: "normal" | "emotional_fatigue";
}

export interface DecideAdResponse {
  stage: "decision";
  source: StageSource;
  decision: Decision;
  elapsed_ms: number;
  error?: string;
}

export interface GenerateImageRequest {
  frame_id: string;
  scene: SceneJSON;
  decision: Decision;
}

export interface GenerateImageResponse {
  stage: "image";
  source: StageSource;
  image_url: string | null;
  remote_url?: string;
  reason?: string;
  elapsed_ms: number;
  error?: string;
}
