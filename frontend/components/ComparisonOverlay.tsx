"use client";

import Image from "next/image";
import type { SceneState, DecisionState, ImageState } from "@/app/page";
import type { SceneMeta } from "@/lib/scenes";

interface Props {
  scene: SceneMeta;
  sceneState: SceneState;
  decisionState: DecisionState;
  imageState: ImageState;
  onResume: () => void;
}

// Stage 8:暂停后完全覆盖 VideoStage,左右各占 50%。
// - 左侧"现状":腾讯视频原暂停广告截图
// - 右侧"AI 改造后":依据决策类型渲染广告图 / 内容推荐卡 / 画面静默卡
export default function ComparisonOverlay({
  scene,
  sceneState,
  decisionState,
  imageState,
  onResume,
}: Props) {
  return (
    <div
      className="absolute inset-0 z-10 cursor-default bg-background-base p-4"
      onClick={(e) => e.stopPropagation()}
    >
      {/* 顶部右上角:恢复播放按钮 */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onResume();
        }}
        className="absolute right-4 top-4 z-20 text-xs text-text-tertiary transition-colors duration-200 hover:text-text-primary"
      >
        ← 恢复播放
      </button>

      <div className="grid h-full grid-cols-2 gap-4">
        <CurrentSide scene={scene} />
        <RebornSide
          scene={scene}
          sceneState={sceneState}
          decisionState={decisionState}
          imageState={imageState}
        />
      </div>
    </div>
  );
}

function CurrentSide({ scene }: { scene: SceneMeta }) {
  return (
    <div className="flex flex-col">
      <div className="mb-2">
        <div className="text-xs uppercase tracking-wider text-text-tertiary">
          现状 · 腾讯视频暂停广告
        </div>
        <div className="mt-0.5 text-xs text-text-tertiary">
          花花绿绿,与剧情无关
        </div>
      </div>
      <div className="relative flex-1 overflow-hidden rounded-xl bg-background-card">
        <Image
          src={scene.currentAd}
          alt="现状广告"
          fill
          priority
          unoptimized
          className="object-contain"
        />
      </div>
    </div>
  );
}

function RebornSide({
  scene,
  sceneState,
  decisionState,
  imageState,
}: {
  scene: SceneMeta;
  sceneState: SceneState;
  decisionState: DecisionState;
  imageState: ImageState;
}) {
  return (
    <div className="flex flex-col">
      <div className="mb-2">
        <div className="text-xs uppercase tracking-wider text-accent-success">
          AI 改造后 · PAUSE REBORN
        </div>
        <div className="mt-0.5 text-xs text-text-tertiary">
          色调一致,旁白克制,融入画面
        </div>
      </div>
      <div className="relative flex-1 overflow-hidden rounded-xl bg-background-card">
        <RebornContent
          scene={scene}
          sceneState={sceneState}
          decisionState={decisionState}
          imageState={imageState}
        />
      </div>
    </div>
  );
}

function RebornContent({
  scene,
  sceneState,
  decisionState,
  imageState,
}: {
  scene: SceneMeta;
  sceneState: SceneState;
  decisionState: DecisionState;
  imageState: ImageState;
}) {
  // 场景未到 / 决策未到:整体骨架屏
  if (sceneState.phase !== "ready" || decisionState.phase !== "ready") {
    return <RebornSkeleton />;
  }

  const decision = decisionState.data!;

  // 克制模式(前端短路 restraint OR 后端 no_ad)
  if (decision.decision === "restraint" || decision.decision === "no_ad") {
    return <SilentCard />;
  }

  // 陪伴模式
  if (decision.decision === "content_switch") {
    return (
      <ContentSwitchCard
        suggested={decision.suggested_content}
        reason={decision.reason}
      />
    );
  }

  // show_ad:等图像段
  if (imageState.phase !== "ready") {
    return <RebornSkeleton />;
  }
  if (imageState.image_url) {
    return (
      <div className="relative h-full w-full">
        <Image
          src={imageState.image_url}
          alt={decision.selected_brand}
          fill
          unoptimized
          className="object-contain"
        />
      </div>
    );
  }
  // 图像段无 url 兜底:用暂停帧 + 文案叠加
  return (
    <div className="relative h-full w-full">
      <Image
        src={scene.pauseFrame}
        alt={scene.label}
        fill
        unoptimized
        className="object-cover opacity-80"
      />
      <div className="absolute inset-x-6 bottom-6 rounded-lg bg-black/55 p-4 backdrop-blur-md">
        <div className="text-xs uppercase tracking-wider text-text-secondary">
          {decision.selected_brand}
        </div>
        <div className="mt-2 font-serif text-base text-text-primary">
          {decision.ad_copy}
        </div>
      </div>
    </div>
  );
}

function ContentSwitchCard({
  suggested,
  reason,
}: {
  suggested: string;
  reason: string;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center bg-gradient-to-br from-amber-950/40 to-orange-950/40 p-8 text-center border border-amber-700/30 rounded-xl">
      <div className="text-4xl">🌙</div>
      <div className="mt-4 text-lg text-text-primary">
        今晚看了很久,换个心情?
      </div>
      <div className="mt-3 text-base text-amber-200">{suggested}</div>
      <div className="mt-2 max-w-sm text-sm text-text-secondary">{reason}</div>
      <button
        type="button"
        onClick={(e) => e.stopPropagation()}
        className="mt-6 rounded-full bg-amber-600 px-6 py-2 text-sm text-white transition-colors duration-200 hover:bg-amber-500"
      >
        切换观看
      </button>
    </div>
  );
}

function SilentCard() {
  return (
    <div className="flex h-full flex-col items-center justify-center bg-background-base border border-border-subtle rounded-xl px-8 text-center">
      <div className="text-2xl font-medium text-text-primary">
        此刻,让画面静默。
      </div>
      <div className="mt-3 text-sm text-text-tertiary">
        检测到沉重情绪场景,AI 选择不打扰。
      </div>
    </div>
  );
}

function RebornSkeleton() {
  return (
    <div className="flex h-full flex-col justify-end gap-3 p-6">
      <div className="h-2 w-[70%] animate-pulse rounded bg-background-elevated" />
      <div className="h-2 w-[85%] animate-pulse rounded bg-background-elevated" />
      <div className="h-2 w-[60%] animate-pulse rounded bg-background-elevated" />
      <div className="h-2 w-[90%] animate-pulse rounded bg-background-elevated" />
    </div>
  );
}
