"use client";

import { useEffect, useState } from "react";
import type { SceneJSON, ShowAdDecision } from "@/lib/types";
import type { SceneState, DecisionState } from "@/app/page";
import RASBadge from "@/components/RASBadge";

interface Props {
  paused: boolean;
  sceneState: SceneState;
  decisionState: DecisionState;
}

// Stage 8:右侧 AI 决策面板。
// Stage 9.E:在顶部 DecisionTag 之后挂载 RAS 克制广告分徽章
// - 顶部 DECISION CONSOLE 标题 + RAS 徽章
// - 区块 1:场景理解 - stage1 ready 后淡入
// - 区块 2-5:决策细节 - stage2 ready 后 staggered 淡入
// - 特殊状态:content_switch / no_ad / restraint 显示对应顶部标签 + 隐藏部分区块
export default function AIDecisionPanel({
  paused,
  sceneState,
  decisionState,
}: Props) {
  const sceneReady = sceneState.phase === "ready" && !!sceneState.data;
  const decisionReady = decisionState.phase === "ready" && !!decisionState.data;
  const idle = !paused && sceneState.phase === "idle";

  const decision = decisionReady ? decisionState.data! : null;
  const isContentSwitch = decision?.decision === "content_switch";
  const isSilent =
    decision?.decision === "no_ad" || decision?.decision === "restraint";
  // 后端 stage2 LLM 调用失败、已降级到 mock 时,decision 上会带 _ai_status="fallback"
  const isFallback =
    decision !== null &&
    "_ai_status" in decision &&
    decision._ai_status === "fallback";

  return (
    <aside className="flex h-full flex-col overflow-y-auto rounded-2xl bg-background-card p-6">
      {/* 顶部标题区 */}
      <div className="mb-6 border-b border-border-subtle pb-4">
        <div className="text-xs uppercase tracking-widest text-text-tertiary">
          DECISION CONSOLE
        </div>
        <div className="mt-1 text-lg font-medium text-text-primary">
          AI 思考过程
        </div>
      </div>

      {/* 降级提示:LLM 不可达时露出,告知用户当前为预设示例 */}
      {isFallback && (
        <div className="mb-3 inline-block rounded-md border border-amber-800/30 bg-amber-950/30 px-3 py-1.5 text-xs tracking-wide text-amber-300/70">
          · AI 决策服务暂时不可达 · 当前为预设示例
        </div>
      )}

      {idle && (
        <div className="text-xs text-text-tertiary">
          点击左侧视频暂停,这里会展示 VLM 输出、决策依据与契合度评分。
        </div>
      )}

      {/* 特殊状态顶部标签条 */}
      {decisionReady && isContentSwitch && (
        <DecisionTag>决策类型:陪伴模式 · 不展示广告</DecisionTag>
      )}
      {decisionReady && isSilent && (
        <DecisionTag>决策类型:克制模式 · 此刻不打扰</DecisionTag>
      )}

      {/* Stage 9.E:RAS 克制广告分(决策就绪后展示) */}
      {decisionReady && decision && <RASBadge decision={decision} />}

      <div className="space-y-6">
        {/* 区块 1:场景理解 */}
        {paused && (
          <Section title="场景理解(VLM)">
            {sceneReady ? (
              <FadeIn>
                <SceneFields scene={sceneState.data!} />
                <CollapsibleJSON data={sceneState.data!} />
              </FadeIn>
            ) : (
              <FieldSkeleton lines={4} />
            )}
          </Section>
        )}

        {/* 静默模式:区块 2-5 全部隐藏 */}
        {!isSilent && paused && (
          <DecisionBlocks
            sceneState={sceneState}
            sceneReady={sceneReady}
            decisionReady={decisionReady}
            decision={decision}
            isContentSwitch={isContentSwitch}
          />
        )}
      </div>
    </aside>
  );
}

function DecisionBlocks({
  sceneState,
  sceneReady,
  decisionReady,
  decision,
  isContentSwitch,
}: {
  sceneState: SceneState;
  sceneReady: boolean;
  decisionReady: boolean;
  decision: DecisionState["data"] | null;
  isContentSwitch: boolean;
}) {
  // Stage 8.5:植入位置 — 优先 LLM 输出的 selected_surface(若 stage2 真返回了),
  // 否则降级到 VLM empty_surfaces[0]
  const surfaceLabel =
    (decision &&
      decision.decision === "show_ad" &&
      decision.selected_surface) ||
    sceneState.data?.empty_surfaces?.[0] ||
    "—";
  // stage1 还没完:不显示决策块
  if (!sceneReady) return null;

  // stage1 完成,stage2 还没完:三个骨架屏占位
  if (!decisionReady || !decision) {
    return (
      <>
        <Section title={isContentSwitch ? "推荐内容" : "选中品牌"}>
          <FieldSkeleton lines={2} />
        </Section>
        <Section title={isContentSwitch ? "推荐理由" : "文案 & 声线"}>
          <FieldSkeleton lines={3} />
        </Section>
        {!isContentSwitch && (
          <Section title="契合度评分">
            <FieldSkeleton lines={4} />
          </Section>
        )}
        <Section title="决策理由">
          <FieldSkeleton lines={3} />
        </Section>
      </>
    );
  }

  if (decision.decision === "content_switch") {
    return (
      <>
        <FadeIn delayMs={0}>
          <Section title="推荐内容">
            <div className="text-base font-medium text-text-primary">
              {decision.suggested_content}
            </div>
          </Section>
        </FadeIn>
        <FadeIn delayMs={100}>
          <Section title="推荐理由">
            <div className="rounded-lg bg-background-elevated p-4 text-sm leading-relaxed text-text-secondary">
              {decision.reason}
            </div>
          </Section>
        </FadeIn>
      </>
    );
  }

  if (decision.decision === "show_ad") {
    return (
      <>
        <FadeIn delayMs={0}>
          <Section title="选中品牌">
            <div className="text-base font-medium text-text-primary">
              {decision.selected_brand}
            </div>
            {decision.alternative_brands.length > 0 && (
              <div className="mt-2 text-xs text-text-tertiary">
                备选 · {decision.alternative_brands.join(" · ")}
              </div>
            )}
          </Section>
        </FadeIn>
        <FadeIn delayMs={100}>
          <Section title="文案 & 声线">
            <div className="border-l-2 border-accent-brand-from pl-3 italic font-medium text-base text-text-primary">
              "{decision.ad_copy}"
            </div>
            <div className="mt-2 text-xs text-text-tertiary">
              声线 · {decision.voice_preset}
            </div>
          </Section>
        </FadeIn>
        <FadeIn delayMs={150}>
          <Section title="植入位置">
            <div className="text-sm text-text-primary">{surfaceLabel}</div>
            <div className="mt-1 text-xs text-text-tertiary">
              AI 在画面里挑选了这个位置叠加产品,而非弹窗强插
            </div>
          </Section>
        </FadeIn>
        <FadeIn delayMs={200}>
          <Section title="契合度评分">
            <ScoresView ad={decision} />
          </Section>
        </FadeIn>
        <FadeIn delayMs={300}>
          <Section title="决策理由">
            <div className="rounded-lg bg-background-elevated p-4 text-sm leading-relaxed text-text-secondary">
              {decision.reasoning}
            </div>
          </Section>
        </FadeIn>
      </>
    );
  }

  return null;
}

function SceneFields({ scene }: { scene: SceneJSON }) {
  const emotion = Array.isArray(scene.emotion)
    ? scene.emotion.join(" · ")
    : scene.emotion;
  const surfaces =
    scene.empty_surfaces?.length > 0 ? scene.empty_surfaces.join(" · ") : "—";
  // 新版 VLM 用 scene_category,旧 mock 用 scene;两边任取其一
  const sceneLabel = scene.scene_category ?? scene.scene ?? "—";
  return (
    <div>
      {/* 第一组:画面观察 - 让评委一眼看到 VLM 真的看见了画面里的具体内容 */}
      <div className="grid grid-cols-[80px_1fr] gap-y-2">
        {scene.concrete_description && (
          <>
            <div className="text-sm text-text-tertiary">画面</div>
            {/* 画面字段强调:用 text-text-primary,其他字段用 text-text-secondary */}
            <div className="text-sm text-text-primary">
              {scene.concrete_description}
            </div>
          </>
        )}
        {scene.main_action && (
          <>
            <div className="text-sm text-text-tertiary">动作</div>
            <div className="text-sm text-text-secondary">
              {scene.main_action}
            </div>
          </>
        )}
        {scene.person_count !== undefined && scene.person_count !== "" && (
          <>
            <div className="text-sm text-text-tertiary">人数</div>
            <div className="text-sm text-text-secondary">
              {String(scene.person_count)}
            </div>
          </>
        )}
      </div>

      {/* 分隔线 + 第二组:场景标签 - 用于品牌匹配的归类 */}
      <div className="mt-3 grid grid-cols-[80px_1fr] gap-y-2 border-t border-border-subtle pt-3">
        <div className="text-sm text-text-tertiary">场景</div>
        <div className="text-sm text-text-secondary">{sceneLabel}</div>
        <div className="text-sm text-text-tertiary">情绪</div>
        <div className="text-sm text-text-secondary">{emotion}</div>
        <div className="text-sm text-text-tertiary">色调</div>
        <div className="text-sm text-text-secondary">{scene.color_tone}</div>
        <div className="text-sm text-text-tertiary">可植入</div>
        <div className="text-sm text-text-secondary">{surfaces}</div>
      </div>
    </div>
  );
}

function ScoresView({ ad }: { ad: ShowAdDecision }) {
  // 用户心境干扰度:string → 反向数值映射(low=90, medium=60, high=25),数值越高条越满
  const disturbanceMap: Record<string, number> = { low: 90, medium: 60, high: 25 };
  const disturbValue = disturbanceMap[ad.scores.user_disturbance] ?? 60;

  // predicted_attention_lift 是 "+39%" 这类字符串,直接拼后缀展示
  const liftLabel = ad.scores.predicted_attention_lift;

  return (
    <div className="space-y-3">
      <ScoreRow
        label="场景情绪契合度"
        value={String(ad.scores.scene_emotion_fit)}
        pct={ad.scores.scene_emotion_fit}
      />
      <ScoreRow
        label="品牌调性匹配度"
        value={String(ad.scores.brand_tone_match)}
        pct={ad.scores.brand_tone_match}
      />
      <ScoreRow
        label="用户心境干扰度"
        value={ad.scores.user_disturbance}
        pct={disturbValue}
      />
      <div className="flex items-center justify-between">
        <div className="text-xs text-text-tertiary">预测注意力捕获率</div>
        <div className="text-xs font-mono text-accent-success">
          {liftLabel} vs 传统弹窗
        </div>
      </div>
    </div>
  );
}

function ScoreRow({
  label,
  value,
  pct,
}: {
  label: string;
  value: string;
  pct: number;
}) {
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="text-xs text-text-tertiary">{label}</div>
        <div className="text-xs font-mono text-text-primary">{value}</div>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-background-elevated">
        <div
          className="h-full rounded-full bg-accent-success transition-[width] duration-700 ease-out"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="text-xs uppercase tracking-wider text-text-tertiary">
        {title}
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function DecisionTag({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 inline-block rounded-full border border-amber-700/30 bg-amber-950/40 px-3 py-1.5 text-xs text-amber-200">
      {children}
    </div>
  );
}

function FieldSkeleton({ lines = 3 }: { lines?: number }) {
  const widths = ["70%", "85%", "60%", "90%"];
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-3 animate-pulse rounded bg-background-elevated"
          style={{ width: widths[i % widths.length] }}
        />
      ))}
    </div>
  );
}

function CollapsibleJSON({ data }: { data: unknown }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-xs text-text-tertiary transition-colors duration-200 hover:text-text-secondary"
      >
        {open ? "▾" : "▸"} 完整 SceneJSON
      </button>
      {open && (
        <pre className="mt-2 max-h-60 overflow-auto rounded-lg bg-background-elevated p-3 font-mono text-xs leading-relaxed text-text-secondary">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}

function FadeIn({
  children,
  delayMs = 0,
}: {
  children: React.ReactNode;
  delayMs?: number;
}) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (delayMs <= 0) {
      const id = requestAnimationFrame(() => setShown(true));
      return () => cancelAnimationFrame(id);
    }
    const id = setTimeout(() => setShown(true), delayMs);
    return () => clearTimeout(id);
  }, [delayMs]);
  return (
    <div
      className={
        "transition-opacity duration-500 " + (shown ? "opacity-100" : "opacity-0")
      }
    >
      {children}
    </div>
  );
}
