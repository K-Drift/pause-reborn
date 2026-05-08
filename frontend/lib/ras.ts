// Stage 9.E:RAS(Restrained Advertising Score)— 克制广告分
// 把 4 项独立分数合成一个 0-100 的产品自有指标
// 公式与文档同步在 docs/RAS.md
import type { Decision } from "@/lib/types";

// 用户干扰度文字 → 数值映射(数值越高代表干扰越强)
const DISTURB_VALUE = { low: 10, medium: 50, high: 90 } as const;

export type RASTone = "success" | "warning" | "neutral";

export interface RASBreakdown {
  fit: number;       // 场景情绪契合
  tone: number;      // 品牌调性匹配
  calm: number;      // 克制度 = 100 - 干扰值
  lift: number;      // 注意力提升(归一到 0-100)
}

export interface RASResult {
  score: number | null;       // 0-100,content_switch 时为 null
  label: string;              // "克制典范" / "克制满分" / "—"
  tone: RASTone;              // 决定环色:success=绿 / warning=橙 / neutral=灰
  breakdown: RASBreakdown | null;
}

// 把 "+208% vs 传统弹窗" 这类字符串解析成 0-100 分(>200% 截断,/2 归一)
function parseLift(raw: string): number {
  const match = raw.match(/-?\d+/);
  const pct = match ? parseInt(match[0], 10) : 0;
  return Math.min(Math.max(pct, 0), 200) / 2;
}

export function computeRAS(d: Decision): RASResult {
  // no_ad / restraint:拒绝出广告 = 克制广告的最高表达 → 满分 100,橙环区分
  if (d.decision === "no_ad" || d.decision === "restraint") {
    return {
      score: 100,
      label: "克制满分",
      tone: "warning",
      breakdown: null,
    };
  }
  // content_switch:陪伴模式不是克制事件,不计 RAS
  if (d.decision === "content_switch") {
    return { score: null, label: "—", tone: "neutral", breakdown: null };
  }

  // show_ad:四项加权
  const s = d.scores;
  const fit = clamp01to100(s.scene_emotion_fit);
  const tone = clamp01to100(s.brand_tone_match);
  const calm = 100 - (DISTURB_VALUE[s.user_disturbance] ?? 50);
  const lift = parseLift(s.predicted_attention_lift ?? "0");

  const score = Math.round(fit * 0.30 + tone * 0.30 + calm * 0.25 + lift * 0.15);

  return {
    score,
    label: ratingLabel(score),
    tone: "success",
    breakdown: { fit, tone, calm, lift },
  };
}

function clamp01to100(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, n));
}

function ratingLabel(n: number): string {
  if (n >= 85) return "克制典范";
  if (n >= 70) return "得体";
  if (n >= 55) return "可接受";
  return "需要克制";
}
