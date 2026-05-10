"use client";

import type { Decision, SceneJSON } from "@/lib/types";
import type { UserState } from "@/lib/personas";

// Stage 9.B:决策推理图
// 把状态层否决、敏感场景跳过这类核心机制做成可视化
// 纵向 4 节点(暂停帧 → VLM → 画像 → 状态层)→ 扇出 3 分支(展示 / 不打扰 / 陪伴)
// 当前决策对应的分支高亮,其他两条 dashed + 40% opacity

interface PersonaDisplay {
  id: string;
  label: string;
  hint: string;
}

interface Props {
  frameId: string;
  frameImageSrc?: string;
  scene: SceneJSON | null;
  decision: Decision | null;
  persona: PersonaDisplay;
  userState: UserState;
}

type Branch = "show_ad" | "no_ad" | "content_switch";

const BRANCH_LABEL: Record<Branch, string> = {
  show_ad: "展示原生广告",
  no_ad: "此刻不打扰",
  content_switch: "陪伴模式 · 切剧",
};

// 三分支颜色:绿/红/黄 = success/danger/warning
const BRANCH_TINT: Record<Branch, { dot: string; border: string; bg: string; text: string }> = {
  show_ad: {
    dot: "bg-text-secondary",
    border: "border-white/[0.10]",
    bg: "bg-white/[0.04]",
    text: "text-text-secondary",
  },
  no_ad: {
    dot: "bg-rose-400/60",
    border: "border-rose-500/25",
    bg: "bg-rose-500/[0.06]",
    text: "text-rose-300/70",
  },
  content_switch: {
    dot: "bg-accent-warning",
    border: "border-accent-warning/30",
    bg: "bg-accent-warning/[0.06]",
    text: "text-accent-warning",
  },
};

function getBranch(d: Decision | null): Branch | null {
  if (!d) return null;
  if (d.decision === "show_ad") return "show_ad";
  if (d.decision === "content_switch") return "content_switch";
  return "no_ad"; // 含 restraint
}

export default function DecisionPathGraph({
  frameId,
  frameImageSrc,
  scene,
  decision,
  persona,
  userState,
}: Props) {
  const branch = getBranch(decision);
  const sensitivity = scene?.sensitivity ?? null;
  const stateOverride =
    sensitivity === "high"
      ? "danger"
      : userState === "emotional_fatigue"
        ? "warning"
        : "neutral";

  return (
    <div className="flex flex-col gap-2">
      {/* 节点 1:暂停帧 */}
      <PathNode title="暂停帧" subtitle="原始信号" dot="bg-text-tertiary/70">
        <div className="flex items-center gap-3">
          {frameImageSrc && (
            <img
              src={frameImageSrc}
              alt={frameId}
              className="h-12 w-20 rounded-md border border-border-subtle object-cover"
            />
          )}
          <div className="text-xs text-text-tertiary">
            frame · <span className="font-mono">{frameId}</span>
          </div>
        </div>
      </PathNode>

      <DownConnector />

      {/* 节点 2:VLM 信号 */}
      <PathNode title="VLM 信号" subtitle="第一段 · 场景理解" dot="bg-accent-brand-from/70">
        {scene ? <VLMSignals scene={scene} /> : <Pending />}
      </PathNode>

      <DownConnector />

      {/* 节点 3:画像匹配 */}
      <PathNode title="画像匹配" subtitle="用户层 · 静态" dot="bg-accent-brand-to/70">
        <div className="text-sm text-text-primary">{persona.label}</div>
        <div className="mt-0.5 text-xs text-text-tertiary">{persona.hint}</div>
      </PathNode>

      <DownConnector />

      {/* 节点 4:状态层检查 — 触发否决时变色 */}
      <PathNode
        title="状态层检查"
        subtitle="动态 · 否决与改写"
        dot={
          stateOverride === "danger"
            ? "bg-rose-400/60"
            : stateOverride === "warning"
              ? "bg-accent-warning"
              : "bg-text-tertiary/70"
        }
        tone={stateOverride}
      >
        <StateCheck sensitivity={sensitivity} userState={userState} />
      </PathNode>

      {/* 分支扇出 */}
      <div className="ml-3 mt-1 border-l-2 border-white/[0.08] pt-2">
        <div className="ml-3 mb-2 text-[10px] uppercase tracking-widest text-text-tertiary">
          三种可能输出
        </div>
        <div className="ml-3 space-y-2">
          <BranchRow
            branch="show_ad"
            active={branch === "show_ad"}
            decision={decision}
          />
          <BranchRow
            branch="no_ad"
            active={branch === "no_ad"}
            decision={decision}
          />
          <BranchRow
            branch="content_switch"
            active={branch === "content_switch"}
            decision={decision}
          />
        </div>
      </div>
    </div>
  );
}

function PathNode({
  title,
  subtitle,
  children,
  dot,
  tone = "neutral",
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  dot: string;
  tone?: "neutral" | "danger" | "warning";
}) {
  const ring =
    tone === "danger"
      ? "border-rose-500/25 bg-rose-500/[0.04]"
      : tone === "warning"
        ? "border-accent-warning/25 bg-accent-warning/[0.04]"
        : "border-white/[0.06] bg-white/[0.03]";
  return (
    <div
      className={
        "flex items-start gap-3 rounded-lg border px-3 py-2.5 transition-colors " +
        ring
      }
    >
      <div className={"mt-1.5 h-2 w-2 shrink-0 rounded-full " + dot} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <div className="text-sm font-medium text-text-primary">{title}</div>
          {subtitle && (
            <div className="text-[10px] uppercase tracking-wider text-text-tertiary">
              {subtitle}
            </div>
          )}
        </div>
        <div className="mt-1.5">{children}</div>
      </div>
    </div>
  );
}

function DownConnector() {
  return <div className="ml-4 h-3 border-l-2 border-white/[0.08]" />;
}

function VLMSignals({ scene }: { scene: SceneJSON }) {
  const sceneLabel = scene.scene_category ?? scene.scene ?? "—";
  const emotion = Array.isArray(scene.emotion)
    ? scene.emotion.join(" · ")
    : scene.emotion;
  return (
    <div className="grid grid-cols-[64px_1fr] gap-y-1 text-xs">
      <div className="text-text-tertiary">场景</div>
      <div className="text-text-secondary">{sceneLabel}</div>
      <div className="text-text-tertiary">情绪</div>
      <div className="text-text-secondary">{emotion}</div>
      <div className="text-text-tertiary">敏感度</div>
      <div
        className={
          scene.sensitivity === "high"
            ? "font-medium text-rose-300/70"
            : "text-text-secondary"
        }
      >
        {scene.sensitivity}
        {scene.sensitivity === "high" && " · 触发否决"}
      </div>
    </div>
  );
}

function StateCheck({
  sensitivity,
  userState,
}: {
  sensitivity: SceneJSON["sensitivity"] | null;
  userState: UserState;
}) {
  const sensTriggered = sensitivity === "high";
  const fatigueTriggered = userState === "emotional_fatigue";
  return (
    <div className="grid grid-cols-[64px_1fr] gap-y-1 text-xs">
      <div className="text-text-tertiary">敏感度</div>
      <div
        className={
          sensTriggered ? "font-medium text-rose-300" : "text-text-secondary"
        }
      >
        {sensitivity ?? "—"}
        {sensTriggered && " ← 否决:不出广告"}
      </div>
      <div className="text-text-tertiary">用户状态</div>
      <div
        className={
          fatigueTriggered
            ? "font-medium text-accent-warning"
            : "text-text-secondary"
        }
      >
        {userState === "emotional_fatigue" ? "情绪疲劳" : "正常"}
        {fatigueTriggered && " ← 改写:陪伴模式"}
      </div>
    </div>
  );
}

function BranchRow({
  branch,
  active,
  decision,
}: {
  branch: Branch;
  active: boolean;
  decision: Decision | null;
}) {
  const tint = BRANCH_TINT[branch];
  const summary = getBranchSummary(branch, active, decision);
  return (
    <div
      className={
        "flex items-start gap-2 rounded-lg border px-3 py-2 transition-all " +
        (active
          ? `${tint.bg} ${tint.border}`
          : "border-dashed border-border-subtle bg-background-elevated/30 opacity-40")
      }
    >
      <span
        className={"mt-0.5 text-xs " + (active ? tint.text : "text-text-tertiary")}
      >
        {active ? "▶" : "▷"}
      </span>
      <div className="min-w-0 flex-1">
        <div
          className={
            "text-sm font-medium " +
            (active ? "text-text-primary" : "text-text-secondary")
          }
        >
          {BRANCH_LABEL[branch]}
        </div>
        {summary && (
          <div className="mt-0.5 text-xs leading-relaxed text-text-tertiary">
            {summary}
          </div>
        )}
      </div>
    </div>
  );
}

function getBranchSummary(
  branch: Branch,
  active: boolean,
  decision: Decision | null,
): string {
  if (!active || !decision) {
    if (branch === "show_ad") return "正常情况下:输出原生广告";
    if (branch === "no_ad") return "敏感场景:跳过广告 · RAS 100";
    return "情绪疲劳:推荐切剧";
  }
  if (branch === "show_ad" && decision.decision === "show_ad") {
    return `选中 · ${decision.selected_brand}`;
  }
  if (
    branch === "no_ad" &&
    (decision.decision === "no_ad" || decision.decision === "restraint")
  ) {
    return "reason" in decision && decision.reason ? decision.reason : "敏感场景 · 不出广告";
  }
  if (branch === "content_switch" && decision.decision === "content_switch") {
    return `推荐 · ${decision.suggested_content}`;
  }
  return "";
}

function Pending() {
  return <div className="text-xs text-text-tertiary">等待 VLM…</div>;
}
