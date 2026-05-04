"use client";

import Image from "next/image";
import type { AnalyzeResponse } from "@/lib/types";
import type { FrameMeta } from "@/lib/frames";
import AIRender from "./AIRender";
import LoadingShimmer from "./LoadingShimmer";

interface Props {
  paused: boolean;
  loading: boolean;
  frame: FrameMeta | null;
  result: AnalyzeResponse | null;
}

export default function ComparisonPanel({ paused, loading, frame, result }: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Side
        label="现状 · 腾讯视频暂停广告"
        sublabel="花花绿绿,与剧情无关"
        active={paused}
      >
        {!paused || !frame ? (
          <EmptyState text="暂停时刻 → 看看你眼前会被怎样打扰" />
        ) : (
          <Image
            src={frame.currentAd}
            alt="现状广告"
            fill
            unoptimized
            className="object-cover"
          />
        )}
      </Side>

      <Side
        label="AI 改造后 · Pause Reborn"
        sublabel="色调一致,旁白克制,融入画面"
        active={paused}
        accent
      >
        {!paused || !frame ? (
          <EmptyState text="暂停时刻 → 看看它本可以是什么样" subtle />
        ) : loading || !result ? (
          <>
            <Image
              src={frame.src}
              alt={frame.label}
              fill
              unoptimized
              className="object-cover opacity-50"
            />
            <LoadingShimmer />
          </>
        ) : (
          <AIRender frame={frame} scene={result.scene} decision={result.decision} />
        )}
      </Side>
    </div>
  );
}

function Side({
  label,
  sublabel,
  active,
  accent,
  children,
}: {
  label: string;
  sublabel: string;
  active: boolean;
  accent?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <span
          className={`text-xs uppercase tracking-[0.3em] ${
            accent ? "text-emerald-400" : "text-zinc-400"
          }`}
        >
          {label}
        </span>
        <span className="text-[11px] text-zinc-500">{sublabel}</span>
      </div>
      <div
        className={`relative aspect-video w-full overflow-hidden rounded-lg bg-black ring-1 transition-colors ${
          active
            ? accent
              ? "ring-emerald-700/60"
              : "ring-zinc-700"
            : "ring-zinc-800/60"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

function EmptyState({ text, subtle }: { text: string; subtle?: boolean }) {
  return (
    <div
      className={`flex h-full w-full items-center justify-center px-6 text-center text-sm ${
        subtle ? "text-zinc-600" : "text-zinc-500"
      }`}
    >
      {text}
    </div>
  );
}
