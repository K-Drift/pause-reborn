"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { FRAMES, type FrameMeta } from "@/lib/frames";

interface Props {
  paused: boolean;
  onTogglePause: (frame: FrameMeta) => void;
  onResume: () => void;
}

// 伪视频播放器:在缺少真 mp4 时,用 5 张暂停帧 SVG 自动轮播模拟"剧集"。
// Stage 2 起若用户提供真视频,本组件可改为 <video> 标签,frame_id 通过
// currentTime 区段映射(SPEC §1.7 "vendor 暂停" 风险对策)。
export default function VideoPlayer({ paused, onTogglePause, onResume }: Props) {
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0); // 0-1 当前帧进度
  const tickRef = useRef<number | null>(null);
  const startedAtRef = useRef<number>(performance.now());

  const current = FRAMES[index];

  // 主循环:用 rAF 推进进度;暂停时冻结。
  useEffect(() => {
    if (paused) return;
    let raf = 0;
    const step = (now: number) => {
      const elapsed = now - startedAtRef.current;
      const p = Math.min(1, elapsed / current.durationMs);
      setProgress(p);
      if (p >= 1) {
        startedAtRef.current = now;
        setIndex((i) => (i + 1) % FRAMES.length);
        setProgress(0);
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    tickRef.current = raf;
    return () => cancelAnimationFrame(raf);
  }, [paused, current.durationMs]);

  // 切到新帧时重置时间锚
  useEffect(() => {
    startedAtRef.current = performance.now();
  }, [index]);

  function handleClick() {
    if (paused) {
      onResume();
      // 恢复时重置时间锚,避免一段虚假快进
      startedAtRef.current = performance.now() - progress * current.durationMs;
    } else {
      onTogglePause(current);
    }
  }

  function jumpTo(i: number) {
    setIndex(i);
    setProgress(0);
    startedAtRef.current = performance.now();
    if (paused) onResume();
  }

  return (
    <div className="w-full">
      <div
        className="relative w-full aspect-video bg-black rounded-lg overflow-hidden cursor-pointer select-none ring-1 ring-zinc-800"
        onClick={handleClick}
      >
        <Image
          src={current.src}
          alt={current.label}
          fill
          priority
          unoptimized
          className="object-cover"
        />
        {/* 暂停遮罩 */}
        {paused && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
            <div className="rounded-full bg-white/90 p-5 shadow-2xl">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="black">
                <polygon points="6,4 20,12 6,20" />
              </svg>
            </div>
          </div>
        )}
        {/* 播放中右下角的小暂停图标提示 */}
        {!paused && (
          <div className="absolute bottom-3 right-3 rounded-md bg-black/50 px-2 py-1 text-xs text-zinc-200">
            点击暂停
          </div>
        )}
        {/* 进度条 */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
          <div
            className="h-full bg-zinc-300 transition-[width] duration-75"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>

      {/* 帧索引器(便于 Demo 跳转) */}
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        <span className="text-zinc-500">跳到:</span>
        {FRAMES.map((f, i) => (
          <button
            key={f.id}
            onClick={() => jumpTo(i)}
            className={`rounded-md border px-2 py-1 transition-colors ${
              i === index
                ? "border-zinc-300 bg-zinc-200 text-zinc-900"
                : "border-zinc-700 text-zinc-400 hover:border-zinc-500"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );
}
