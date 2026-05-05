// 切换器 UI 用的画像/状态显示映射。
// id 与 backend/data/personas.json 一致,label 只影响按钮文案。
// 后端 decide-ad 默认 persona_id 也是 urban_male_35,保持同步。

export interface PersonaOption {
  id: string;
  label: string;
  hint: string; // 鼠标悬停的小注解,沿用 SPEC 里"35岁金融男"等口径
}

export const PERSONAS: PersonaOption[] = [
  { id: "urban_male_35", label: "35岁金融男", hint: "都市金融,精致克制" },
  { id: "young_female_25", label: "25岁年轻女生", hint: "都市白领,生活美学" },
  { id: "executive_female_40", label: "40岁女性高管", hint: "高净值,雅致克制" },
];

export const DEFAULT_PERSONA_ID = "urban_male_35";

export type UserState = "normal" | "emotional_fatigue";

export interface UserStateOption {
  id: UserState;
  label: string;
  hint: string;
}

export const USER_STATES: UserStateOption[] = [
  { id: "normal", label: "情绪正常", hint: "正常匹配品类与品牌" },
  {
    id: "emotional_fatigue",
    label: "情绪疲劳",
    hint: "切换为陪伴模式,不展示广告",
  },
];

export const DEFAULT_USER_STATE: UserState = "normal";
