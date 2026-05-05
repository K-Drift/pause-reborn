"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { getScene, type SceneId } from "@/lib/scenes";

export interface VideoStageHandle {
  pause(): void;
  play(): void;
}

interface Props {
  sceneId: SceneId;
  paused: boolean;
  onPause: () => void;
  onResume: () => void;
  children?: React.ReactNode; // 暂停时由父组件传入对比覆盖层
}

// Stage 8:左侧主舞台。
// - 未暂停:HTML5 video 自动播放循环静音
// - 暂停:外层接收 children(ComparisonOverlay)做绝对定位完全覆盖
// - 整个舞台可点击切换播放/暂停
const VideoStage = forwardRef<VideoStageHandle, Props>(function VideoStage(
  { sceneId, paused, onPause, onResume, children },
  ref,
) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scene = getScene(sceneId);

  useImperativeHandle(ref, () => ({
    pause: () => videoRef.current?.pause(),
    play: () => {
      const v = videoRef.current;
      if (!v) return;
      void v.play().catch(() => {
        /* autoplay 被浏览器阻止时静默失败,用户点击后会重试 */
      });
    },
  }));

  // 切换 src 后自动重播
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.load();
    if (!paused) {
      void v.play().catch(() => {});
    }
  }, [sceneId, paused]);

  function handleClick() {
    if (paused) {
      onResume();
    } else {
      videoRef.current?.pause();
      onPause();
    }
  }

  return (
    <div
      className="relative aspect-video w-full overflow-hidden rounded-2xl bg-background-card shadow-2xl cursor-pointer select-none"
      onClick={handleClick}
    >
      <video
        ref={videoRef}
        src={scene.video}
        muted
        autoPlay
        loop
        playsInline
        preload="metadata"
        className="h-full w-full object-cover"
      />

      {/* 播放中:中央偏下引导文字 */}
      {!paused && (
        <div className="pointer-events-none absolute inset-x-0 bottom-8 flex justify-center">
          <span className="rounded-full bg-black/40 px-4 py-2 text-sm text-white/60 backdrop-blur-sm">
            把暂停从打断,重塑为延续 · 点击暂停以触发分析
          </span>
        </div>
      )}

      {/* 暂停时:对比覆盖层 */}
      {paused && children}
    </div>
  );
});

export default VideoStage;
