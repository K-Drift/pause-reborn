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

export type Decision = ShowAdDecision | NoAdDecision | ContentSwitchDecision;

export interface AnalyzeResponse {
  scene: SceneJSON;
  decision: Decision;
}

export interface AnalyzeRequest {
  frame_id: string;
  persona_id?: string;
  user_state?: "normal" | "emotional_fatigue";
}
