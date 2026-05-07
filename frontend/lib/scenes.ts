// Stage 8.5:四场景常量 — UI scene_id ↔ backend frame_id 的单一来源。
// UI 层只用 SceneId(bar/ancient/late-night/sensitive),
// 调用 backend 时映射回 backendFrameId,与已有 mock_responses 文件名对齐。
//
// mockAdImage 是 Stage 8.5 新增:
//   "AI 改造后"侧 complete 状态切换到的"融入版"整图(产品已嵌入剧情画面)。
//   handcrafted 模式直接用它;real API 模式作为 stage3 失败的兜底。

export type SceneId = "bar" | "ancient" | "late-night" | "sensitive";

export interface SceneMeta {
  id: SceneId;
  label: string;
  backendFrameId: string; // 与 backend/data/mock_responses/<id>.json 对应
  video: string;
  pauseFrame: string;
  currentAd: string;
  mockAdImage?: string; // "融入版"整图,sensitive 不配
}

export const SCENES: SceneMeta[] = [
  {
    id: "bar",
    label: "都市夜居酒屋",
    backendFrameId: "urban_night_bar",
    video: "/videos/scene-bar.mp4",
    pauseFrame: "/pause-frames/frame-bar.png",
    currentAd: "/current-ads/tencent-ad-bar.png",
    mockAdImage: "/mock-ad-images/mock-ad-bar.png",
  },
  {
    id: "ancient",
    label: "古风庭院",
    backendFrameId: "palace_ancient",
    video: "/videos/scene-ancient.mp4",
    pauseFrame: "/pause-frames/frame-ancient.png",
    currentAd: "/current-ads/tencent-ad-ancient.png",
    mockAdImage: "/mock-ad-images/mock-ad-ancient.png",
  },
  {
    id: "late-night",
    label: "深夜独处",
    backendFrameId: "late_night_solo",
    video: "/videos/scene-late-night.mp4",
    pauseFrame: "/pause-frames/frame-late-night.png",
    currentAd: "/current-ads/tencent-ad-late-night.png",
    mockAdImage: "/mock-ad-images/mock-ad-late-night.png",
  },
  {
    id: "sensitive",
    label: "病房 · 敏感",
    backendFrameId: "hospital_sensitive",
    video: "/videos/scene-sensitive.mp4",
    pauseFrame: "/pause-frames/frame-sensitive.png",
    currentAd: "/current-ads/tent-ad-sensitive.png",
    mockAdImage: "/mock-ad-images/mock-ad-sensitive.png",
  },
];

export const DEFAULT_SCENE_ID: SceneId = "bar";

export function getScene(id: SceneId): SceneMeta {
  const s = SCENES.find((x) => x.id === id);
  if (!s) throw new Error(`Unknown scene id: ${id}`);
  return s;
}
