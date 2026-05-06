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
  // VLM 直出的具体画面描述(30字内,含人物动作+关键物体);评委用来确认 AI 真的看见画面
  concrete_description?: string;
  // 新版 prompt:强制数人 + 主要动作
  person_count?: number | string; // VLM 偶尔返字符串"3",前端 String() 兜底
  main_action?: string;
  // 新版 prompt 用 scene_category,旧 mock 用 scene;前端取 scene_category ?? scene
  scene_category?: string;
  scene?: string;
  characters?: string;
  emotion: Emotion[] | string; // LLM 可能返 1-2 个
  color_tone: string;
  lighting: string;
  // 新版 prompt 用 key_objects,旧 mock 用 objects
  key_objects?: string[];
  objects?: string[];
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

// 后端给所有真实/降级路径的 decision 都会附加这组诊断字段(可选)
// _ai_status:live=LLM 真实成功,fallback=LLM 失败已降级到 mock
export interface AIDiagnosticFields {
  _ai_status?: "live" | "fallback";
  _fallback_reason?: string;
  _fallback_stage?: string;
}

export interface ShowAdDecision extends AIDiagnosticFields {
  decision: "show_ad";
  selected_brand: string;
  alternative_brands: string[];
  ad_copy: string;
  voice_preset: VoicePreset;
  scores: AdScores;
  reasoning: string;
  // Stage 2c 起前端会读 generated_image 字段(base64 或 URL);Stage 1 用 CSS 模拟
  generated_image?: string;
  // Stage 8.5:LLM 从 scene.empty_surfaces 中挑选的目标植入位置(可选)
  selected_surface?: string;
}

export interface NoAdDecision extends AIDiagnosticFields {
  decision: "no_ad";
  reason: string;
}

export interface ContentSwitchDecision extends AIDiagnosticFields {
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
  _ai_status?: "live" | "fallback";
  _fallback_reason?: string;
  _fallback_stage?: string;
}
