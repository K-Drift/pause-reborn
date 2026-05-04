"use client";

import { useEffect, useState } from "react";

const STEPS = [
  "解析画面色调与灯光…",
  "识别场景与情绪基调…",
  "匹配品牌调性与广告库…",
  "撰写情境化文案…",
  "选择声线与生成原生卡片…",
];

// 假装的"思考过程"动画。Stage 2 接真 API 后,后端会真返,这里改为按真实
// 进度推进文字(可基于 SSE,或简单按 fetch 返回时间均分)。
export default function LoadingShimmer() {
  const [stepIdx, setStepIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setStepIdx((i) => Math.min(i + 1, STEPS.length - 1));
    }, 700);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-zinc-900/85 backdrop-blur">
      <div className="flex gap-1.5">
        <span className="h-2 w-2 animate-pulse rounded-full bg-zinc-300 [animation-delay:0ms]" />
        <span className="h-2 w-2 animate-pulse rounded-full bg-zinc-400 [animation-delay:200ms]" />
        <span className="h-2 w-2 animate-pulse rounded-full bg-zinc-500 [animation-delay:400ms]" />
      </div>
      <div className="text-sm font-medium text-zinc-200">AI 正在分析画面…</div>
      <ul className="space-y-1 text-xs text-zinc-400">
        {STEPS.slice(0, stepIdx + 1).map((s, i) => (
          <li key={i} className={i === stepIdx ? "text-zinc-200" : "text-zinc-500"}>
            {i === stepIdx ? "▸ " : "✓ "}
            {s}
          </li>
        ))}
      </ul>
    </div>
  );
}
