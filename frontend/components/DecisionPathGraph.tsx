"use client";

import type { Decision, SceneJSON } from "@/lib/types";
import type { UserState } from "@/lib/personas";

// Stage 9.B:决策推理图
// Stage 9.H:去边框化 — 贯穿式主轴 + 节点浮在背景上 + 极简排版

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

const BRANCH_TINT: Record<Branch, { dot: string; text: string }> = {
  show_ad: {
    dot: "bg-zinc-300",
    text: "text-zinc-200",
  },
  no_ad: {
    dot: "bg-rose-400/70",
    text: "text-rose-300/70",
  },
  content_switch: {
    dot: "bg-amber-400/70",
    text: "text-amber-300/80",
  },
};

function getBranch(d: Decision | null): Branch | null {
  if (!d) return null;
  if (d.decision === "show_ad") return "show_ad";
  if (d.decision === "content_switch") return "content_switch";
  return "no_ad";
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
    <div className="relative pl-6">
      {/* 贯穿式主轴:从头到尾的极细暗线 */}
      <div className="absolute left-[7px] top-2 bottom-2 w-px bg-white/[0.08]" />

      {/* 节点 1:暂停帧 */}
      <TimelineNode
        title="暂停帧"
        subtitle="原始信号"
        dotClass="bg-zinc-500"
      >
        <div className="flex items-center gap-3">
          {frameImageSrc && (
            <img
              src={frameImageSrc}
              alt={frameId}
              className="h-10 w-16 rounded object-cover opacity-80"
            />
          )}
          <span className="font-mono text-xs text-zinc-500">{frameId}</span>
        </div>
      </TimelineNode>

      {/* 节点 2:VLM 信号 */}
      <TimelineNode
        title="VLM 信号"
        subtitle="场景理解"
        dotClass="bg-zinc-400"
      >
        {scene ? <VLMSignals scene={scene} /> : <Pending />}
      </TimelineNode>

      {/* 节点 3:画像匹配 */}
      <TimelineNode
        title="画像匹配"
        subtitle="用户层"
        dotClass="bg-zinc-400"
      >
        <div className="font-medium text-zinc-100">{persona.label}</div>
        <div className="mt-0.5 text-xs text-zinc-500">{persona.hint}</div>
      </TimelineNode>

      {/* 节点 4:状态层检查 */}
      <TimelineNode
        title="状态层检查"
        subtitle="否决与改写"
        dotClass={
          stateOverride === "danger"
            ? "bg-rose-400"
            : stateOverride === "warning"
              ? "bg-amber-400"
              : "bg-zinc-300"
        }
        active
      >
        <StateCheck sensitivity={sensitivity} userState={userState} />
      </TimelineNode>

      {/* 分支扇出:三条可能的输出 */}
      <div className="relative mt-6 pl-0">
        <div className="mb-3 text-[10px] uppercase tracking-[0.2em] text-zinc-600">
          输出
        </div>
        <div className="space-y-2.5">
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

// 轴线节点:dot 浮在贯穿线上,内容在右侧,无边框无卡片
function TimelineNode({
  title,
  subtitle,
  children,
  dotClass,
  active = false,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  dotClass: string;
  active?: boolean;
}) {
  return (
    <div className="relative pb-8 last:pb-0">
      {/* 节点圆点:ring-4 ring-black 制造浮在轴线上的立体感 */}
      <div
        className={
          "absolute -left-6 top-1 h-3.5 w-3.5 rounded-full ring-4 ring-[#09090b] " +
          dotClass
        }
      />
      {/* 标题行 */}
      <div className="flex items-baseline justify-between gap-2">
        <div className={active ? "font-medium text-zinc-100" : "text-sm text-zinc-300"}>
          {title}
        </div>
        {subtitle && (
          <div className="text-[10px] uppercase tracking-[0.15em] text-zinc-600">
            {subtitle}
          </div>
        )}
      </div>
      {/* 内容区 */}
      <div className="mt-2">{children}</div>
    </div>
  );
}

function VLMSignals({ scene }: { scene: SceneJSON }) {
  const sceneLabel = scene.scene_category ?? scene.scene ?? "—";
  const emotion = Array.isArray(scene.emotion)
    ? scene.emotion.join(" · ")
    : scene.emotion;
  return (
    <div className="space-y-1.5">
      <KV label="场景" value={sceneLabel} />
      <KV label="情绪" value={emotion} />
      <KV
        label="敏感度"
        value={scene.sensitivity ?? "—"}
        valueClass={
          scene.sensitivity === "high"
            ? "font-medium text-rose-300/80"
            : undefined
        }
        suffix={scene.sensitivity === "high" ? " · 触发否决" : undefined}
      />
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
    <div className="space-y-1.5">
      <KV
        label="敏感度"
        value={sensitivity ?? "—"}
        valueClass={sensTriggered ? "font-medium text-rose-300/80" : undefined}
        suffix={sensTriggered ? " ← 否决" : undefined}
      />
      <KV
        label="用户状态"
        value={fatigueTriggered ? "情绪疲劳" : "正常"}
        valueClass={fatigueTriggered ? "font-medium text-amber-300/80" : undefined}
        suffix={fatigueTriggered ? " ← 改写" : undefined}
      />
    </div>
  );
}

// 极简 key-value 行:label 暗灰小字,value 亮白加粗
function KV({
  label,
  value,
  valueClass,
  suffix,
}: {
  label: string;
  value: string;
  valueClass?: string;
  suffix?: string;
}) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="w-14 shrink-0 text-xs text-zinc-500">{label}</span>
      <span className={"text-sm " + (valueClass ?? "text-zinc-200")}>
        {value}
        {suffix && <span className="text-zinc-500">{suffix}</span>}
      </span>
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
        "flex items-start gap-2.5 py-1.5 " +
        (active ? "opacity-100" : "opacity-30")
      }
    >
      <span
        className={
          "mt-1 h-2 w-2 shrink-0 rounded-full " +
          (active ? tint.dot : "bg-zinc-700")
        }
      />
      <div className="min-w-0 flex-1">
        <div
          className={
            "text-sm " +
            (active ? "font-medium text-zinc-100" : "text-zinc-500")
          }
        >
          {BRANCH_LABEL[branch]}
        </div>
        {summary && (
          <div className="mt-0.5 text-xs leading-relaxed text-zinc-500">
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
    if (branch === "show_ad") return "正常:输出原生广告";
    if (branch === "no_ad") return "敏感场景:跳过广告";
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
  return <div className="text-xs text-zinc-600">等待 VLM…</div>;
}
