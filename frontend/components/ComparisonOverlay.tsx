"use client";

import { useEffect, useState } from "react";
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

// Stage 8.5:左右各 50%,共用同一帧静帧底图。
// 左侧:画面中央叠一张腾讯弹窗广告(红边、阴影、5 字小红点)。
// 右侧:加载态用模糊脉动 + 文字提示;完成态把整张底图换成 mockAdImage 融入版,
//       底部叠一行 ad_copy 文字浮在画面里。
export default function ComparisonOverlay({
  scene,
  sceneState,
  decisionState,
  imageState,
  onResume,
}: Props) {
  return (
    <div
      className="absolute inset-0 z-10 cursor-default bg-background-base/95 p-4 backdrop-blur-sm"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onResume();
        }}
        className="absolute right-4 top-4 z-20 inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-xs text-zinc-400 backdrop-blur-sm transition-all duration-300 ease-in-out hover:-translate-y-0.5 hover:bg-white/[0.06] hover:text-zinc-200"
      >
        <svg width="11" height="11" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path d="M5 4l-3 4 3 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M2 8h11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
        恢复播放
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

// 通用框架:header(自由 ReactNode) + 16:9 容器(子节点自由放层)
// Stage 9.F:把 title/subtitle/titleClass 三件套替换为单一 header slot,允许 BEFORE/AFTER 各自的 pill 排版
function SideShell({
  header,
  children,
  belowOverlay,
}: {
  header: React.ReactNode;
  children: React.ReactNode;
  belowOverlay?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col">
      <div className="mb-2">{header}</div>
      <div className="relative w-full aspect-video overflow-hidden rounded-lg bg-background-card">
        {children}
      </div>
      {belowOverlay}
    </div>
  );
}

function CurrentSide({ scene }: { scene: SceneMeta }) {
  return (
    <SideShell
      header={
        <>
          <div className="inline-flex items-center gap-2">
            <span className="rounded-full border border-amber-700/40 bg-amber-950/30 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.25em] text-amber-300/80">
              BEFORE
            </span>
            <span className="text-xs text-text-tertiary">
              现状 · 腾讯视频暂停广告
            </span>
          </div>
          <div className="mt-1 text-sm italic text-text-tertiary/80">
            花花绿绿,与剧情无关
          </div>
        </>
      }
    >
      {/* BEFORE 帧轻微降饱和、暗化,做出"被打断"的视觉钝感 */}
      <Image
        src={scene.pauseFrame}
        alt="原始静帧"
        fill
        priority
        unoptimized
        className="object-cover saturate-75 brightness-95"
      />
      {/* 整体压暗,模拟视频被弹窗打断的感觉 */}
      <div className="pointer-events-none absolute inset-0 bg-black/30" />
      {/* 中央叠加腾讯真实暂停广告 — 60% 宽,红边 + 强阴影 */}
      <div className="absolute left-1/2 top-1/2 w-[60%] -translate-x-1/2 -translate-y-1/2">
        <div
          className="overflow-hidden rounded-md shadow-2xl shadow-black/60"
          style={{ border: "1px solid rgba(255, 255, 255, 0.08)" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={scene.currentAd}
            alt="腾讯视频弹窗广告"
            className="block h-auto w-full object-contain"
          />
        </div>
      </div>
    </SideShell>
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
  const decision =
    decisionState.phase === "ready" ? decisionState.data ?? null : null;
  // 融入版图源:优先 imageState.image_url(stage3 真结果或 handcrafted mock 路径),
  // 否则降级到场景预设的 mockAdImage(real API 模式 + stage3 失败的兜底)
  const fusedSrc = imageState.image_url ?? scene.mockAdImage ?? null;

  // 加载条件:决策还没出 OR (是 show_ad 但图像段还没好)
  const isLoading =
    !decision ||
    (decision.decision === "show_ad" && imageState.phase !== "ready");

  return (
    <SideShell
      header={
        <>
          <div className="inline-flex items-center gap-2">
            <span className="rounded-full border border-white/[0.10] bg-white/[0.05] px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.25em] text-text-secondary">
              AFTER
            </span>
            <span className="text-xs text-text-secondary">
              AI 改造后 · PAUSE REBORN
            </span>
          </div>
          <div className="mt-1 text-sm italic text-text-secondary">
            融入画面,克制旁白
          </div>
        </>
      }
      belowOverlay={
        imageState._ai_status === "fallback" ? (
          <div className="mt-2 inline-block self-start rounded-md border border-amber-800/30 bg-amber-950/30 px-3 py-1.5 text-xs tracking-wide text-amber-300/70">
            · 图像服务暂时不可达 · 当前为预设示例
          </div>
        ) : null
      }
    >
      {/* 底层:始终是原始静帧 */}
      <Image
        src={scene.pauseFrame}
        alt="AI 改造对照底图"
        fill
        priority
        unoptimized
        className="object-cover"
      />

      {/* 加载态:模糊脉动 dim + 三段加载文案 */}
      {isLoading && (
        <RebornLoadingLayer
          sceneReady={sceneState.phase === "ready"}
          decisionReady={decision !== null}
        />
      )}

      {/* show_ad 完成 + 有融入版图:整张图淡入 + 微缩,覆盖底图。
          文案不再叠在画面上(克制旁白),改由右侧 Decision Console 呈现。 */}
      {decision &&
        decision.decision === "show_ad" &&
        imageState.phase === "ready" &&
        fusedSrc && (
          <FusedImageLayer src={fusedSrc} alt={decision.selected_brand} />
        )}

      {/* show_ad 完成 + 没图:兜底提示 */}
      {decision &&
        decision.decision === "show_ad" &&
        imageState.phase === "ready" &&
        !fusedSrc && (
          <CenteredOverlay>
            <FadeInUp>
              <NotGeneratedNotice />
            </FadeInUp>
          </CenteredOverlay>
        )}

      {/* 克制 / 静默:与左侧腾讯广告对齐(60% 宽)的深蓝海报 */}
      {decision &&
        (decision.decision === "restraint" ||
          decision.decision === "no_ad") && (
          <SilentPoster />
        )}

      {/* 陪伴:暖金海报作为居中弹窗,尺寸与左侧腾讯广告对齐(60% 宽) */}
      {decision && decision.decision === "content_switch" && (
        <ContentSwitchPoster />
      )}
    </SideShell>
  );
}

// 加载层:模糊脉动 dim + 三段加载文案(随 sceneReady / decisionReady 切换)
function RebornLoadingLayer({
  sceneReady,
  decisionReady,
}: {
  sceneReady: boolean;
  decisionReady: boolean;
}) {
  const text = !sceneReady
    ? "正在阅读这一帧的情绪…"
    : !decisionReady
      ? "正在为你寻找合适的品牌…"
      : "正在让产品自然融入画面…";
  return (
    <>
      <div className="pointer-events-none absolute inset-0 animate-pulse bg-black/45" />
      <CenteredOverlay>
        <LoadingPill text={text} showSpinner />
      </CenteredOverlay>
    </>
  );
}

// 完成态融入版整图:opacity 0→1 + scale 1.02→1,800ms ease-out
function FusedImageLayer({ src, alt }: { src: string; alt: string }) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return (
    <Image
      src={src}
      alt={alt}
      fill
      priority
      unoptimized
      className={
        "object-cover transition-all duration-[800ms] ease-out " +
        (shown ? "scale-100 opacity-100" : "scale-[1.02] opacity-0")
      }
    />
  );
}

// 底部 12% 居中的 ad_copy 文字 — 图切完后再延 200ms fade-up
function CenteredOverlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      {children}
    </div>
  );
}


// 陪伴海报:绝对定位居中,60% 宽,与左侧腾讯广告同尺寸;
// 圆角阴影 + 600ms 淡入,图本身自带文案,无需额外叠字。
function ContentSwitchPoster() {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return (
    <div
      className={
        "absolute left-1/2 top-1/2 w-[60%] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-md shadow-2xl shadow-black/60 transition-opacity duration-[600ms] ease-out " +
        (shown ? "opacity-100" : "opacity-0")
      }
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/content-switch-cozy.png"
        alt="今晚换个心情:温暖治愈纪录片或轻松陪伴综艺"
        className="block h-auto w-full object-contain"
      />
    </div>
  );
}

// 静默海报:绝对定位居中,60% 宽,与左侧腾讯广告同尺寸。
// 半透明深蓝 + backdrop-blur,让底层病房画面透出来,避免硬色块的突兀感;
// 衬线大字配宽字距,800ms 淡入。文案细节交给右侧 Decision Console。
function SilentPoster() {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return (
    <div
      className={
        "absolute left-1/2 top-1/2 flex aspect-video w-[60%] -translate-x-1/2 -translate-y-1/2 items-center justify-center overflow-hidden rounded-xl border border-white/5 shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-2xl transition-opacity duration-[800ms] ease-out " +
        (shown ? "opacity-100" : "opacity-0")
      }
      style={{
        // 中心略亮、边缘更深的径向渐变 — 比纯色块柔和
        backgroundImage:
          "radial-gradient(ellipse at center, rgba(28,46,78,0.72) 0%, rgba(12,24,48,0.78) 70%, rgba(8,16,34,0.82) 100%)",
      }}
    >
      <div
        className="text-2xl text-slate-100/85 antialiased subpixel-antialiased md:text-3xl"
        style={{
          fontFamily:
            '"Noto Serif SC", "Source Han Serif SC", "Songti SC", "STSong", serif',
          fontWeight: 300,
          letterSpacing: "0.6em",
          paddingLeft: "0.6em", // 抵消末字 letter-spacing 造成的右偏,让整体真正居中
          textShadow: "0 1px 12px rgba(0,0,0,0.35)", // 柔化边缘,避免色边
        }}
      >
        此刻静默
      </div>
    </div>
  );
}

function NotGeneratedNotice() {
  return (
    <div className="max-w-[60%] rounded-md border border-border-subtle bg-black/75 p-4 text-center shadow-[0_20px_60px_rgba(0,0,0,0.6)] backdrop-blur-md">
      <div className="text-sm font-medium text-text-primary">
        融入版图未生成
      </div>
      <div className="mt-1 text-[11px] text-text-tertiary">
        当前场景缺少 mockAdImage,且 stage3 未返回有效图片
      </div>
    </div>
  );
}

// 加载胶囊:深色半透明圆角胶囊 + 文字 + 旋转 SVG
function LoadingPill({
  text,
  showSpinner = false,
}: {
  text: string;
  showSpinner?: boolean;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-black/60 px-5 py-2 backdrop-blur-md">
      {showSpinner && (
        <svg
          className="h-3 w-3 animate-spin text-text-secondary"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          focusable="false"
        >
          <circle
            cx="12"
            cy="12"
            r="9"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="40 60"
          />
        </svg>
      )}
      <span className="text-sm tracking-wide text-text-secondary">{text}</span>
    </div>
  );
}

// 卡片入场:opacity 0→1 + translateY 20px→0,600ms ease-out
function FadeInUp({ children }: { children: React.ReactNode }) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return (
    <div
      className={
        "transition-all duration-[600ms] ease-out " +
        (shown ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0")
      }
    >
      {children}
    </div>
  );
}
