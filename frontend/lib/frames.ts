// 5 个预置暂停帧 + 与"现状广告"的映射

export interface FrameMeta {
  id: string;             // 与 backend/data/mock_responses/{id}.json 对应
  label: string;          // UI 标签
  src: string;            // /pause-frames/*.svg
  currentAd: string;      // /current-ads/*.svg(对比用)
  durationMs: number;     // 伪视频每帧停留时长
}

export const FRAMES: FrameMeta[] = [
  {
    id: "urban_night_bar",
    label: "都市夜居酒屋",
    src: "/pause-frames/urban_night_bar.svg",
    currentAd: "/current-ads/current_ad_01.svg",
    durationMs: 6000,
  },
  {
    id: "palace_ancient",
    label: "古风庭院",
    src: "/pause-frames/palace_ancient.svg",
    currentAd: "/current-ads/current_ad_02.svg",
    durationMs: 6000,
  },
  {
    id: "sweet_morning",
    label: "甜宠晨间",
    src: "/pause-frames/sweet_morning.svg",
    currentAd: "/current-ads/current_ad_03.svg",
    durationMs: 6000,
  },
  {
    id: "hospital_sensitive",
    label: "病房 · 敏感",
    src: "/pause-frames/hospital_sensitive.svg",
    currentAd: "/current-ads/current_ad_01.svg",
    durationMs: 6000,
  },
  {
    id: "late_night_solo",
    label: "深夜独处",
    src: "/pause-frames/late_night_solo.svg",
    currentAd: "/current-ads/current_ad_02.svg",
    durationMs: 6000,
  },
];
