"use client";

import Image from "next/image";
import type { Decision, SceneJSON } from "@/lib/types";
import type { FrameMeta } from "@/lib/frames";

interface Props {
  frame: FrameMeta;
  scene: SceneJSON;
  decision: Decision;
}

// Stage 1:用 CSS 叠层模拟"AI 原生广告"。Stage 2c 接真图像 API 后,这里改为
// 直接渲染 decision.generated_image。

export default function AIRender({ frame, scene, decision }: Props) {
  if (decision.decision === "no_ad") {
    return <NoAdView reason={decision.reason} />;
  }
  if (decision.decision === "content_switch") {
    return (
      <ContentSwitchView
        frame={frame}
        suggested={decision.suggested_content}
        reason={decision.reason}
      />
    );
  }
  // show_ad
  const tone = pickTone(scene);
  return (
    <div className="relative w-full h-full">
      <Image
        src={frame.src}
        alt={frame.label}
        fill
        unoptimized
        className="object-cover"
      />
      {/* 色调叠层:与场景同呼吸 */}
      <div className={`absolute inset-0 ${tone.gradient} pointer-events-none`} />
      {/* 原生广告卡(右下角,占约 40% 宽) */}
      <div className="absolute bottom-6 right-6 max-w-[42%] rounded-md bg-black/55 backdrop-blur-md ring-1 ring-white/10 p-5 shadow-2xl">
        <div className={`text-[10px] uppercase tracking-[0.3em] ${tone.accent}`}>
          {decision.selected_brand}
        </div>
        <div
          className="mt-3 font-serif leading-snug text-zinc-50"
          style={{ fontSize: "clamp(15px, 1.6vw, 22px)" }}
        >
          {decision.ad_copy}
        </div>
        <div className="mt-4 flex items-center justify-between text-[11px] text-zinc-400">
          <span>声线 · {decision.voice_preset}</span>
          <button className="rounded-full border border-zinc-500 px-3 py-1 text-zinc-200 hover:border-zinc-300">
            了解更多
          </button>
        </div>
      </div>
    </div>
  );
}

function NoAdView({ reason }: { reason: string }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-black px-8 text-center">
      <div className="text-xs uppercase tracking-[0.4em] text-zinc-600">
        Restraint Mode
      </div>
      <div className="mt-6 max-w-md font-serif text-2xl leading-relaxed text-zinc-300">
        此刻不必被打扰。
      </div>
      <div className="mt-3 text-xs text-zinc-600">点击任意处恢复播放</div>
      <div className="absolute bottom-4 left-4 right-4 text-[10px] text-zinc-700">
        {reason}
      </div>
    </div>
  );
}

function ContentSwitchView({
  frame,
  suggested,
  reason,
}: {
  frame: FrameMeta;
  suggested: string;
  reason: string;
}) {
  return (
    <div className="relative h-full w-full">
      <Image
        src={frame.src}
        alt={frame.label}
        fill
        unoptimized
        className="object-cover opacity-30"
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 px-8 text-center">
        <div className="text-xs uppercase tracking-[0.3em] text-zinc-400">
          Companion Mode
        </div>
        <div className="mt-5 font-serif text-xl leading-relaxed text-zinc-100">
          今晚换个心情。
        </div>
        <div className="mt-2 text-zinc-400">下一集为你切换到 「{suggested}」</div>
        <div className="mt-4 text-[11px] text-zinc-500 max-w-md">{reason}</div>
      </div>
    </div>
  );
}

// 简易调色:按 SceneJSON.color_tone 关键字粗判,Stage 2c 接真图像后此函数可弃用
function pickTone(scene: SceneJSON): { gradient: string; accent: string } {
  const t = scene.color_tone || "";
  if (t.includes("暖") || t.includes("黄") || t.includes("橙")) {
    return {
      gradient: "bg-gradient-to-tr from-amber-900/35 via-transparent to-transparent",
      accent: "text-amber-200",
    };
  }
  if (t.includes("冷") && t.includes("蓝")) {
    return {
      gradient: "bg-gradient-to-tr from-slate-900/45 via-transparent to-transparent",
      accent: "text-slate-200",
    };
  }
  if (t.includes("粉")) {
    return {
      gradient: "bg-gradient-to-tr from-rose-900/30 via-transparent to-transparent",
      accent: "text-rose-200",
    };
  }
  if (t.includes("紫") || t.includes("夜")) {
    return {
      gradient: "bg-gradient-to-tr from-indigo-900/40 via-transparent to-transparent",
      accent: "text-indigo-200",
    };
  }
  return {
    gradient: "bg-gradient-to-tr from-zinc-900/35 via-transparent to-transparent",
    accent: "text-zinc-200",
  };
}
