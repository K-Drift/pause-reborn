"use client";

import { useCallback, useState } from "react";
import VideoPlayer from "@/components/VideoPlayer";
import ComparisonPanel from "@/components/ComparisonPanel";
import DebugPanel from "@/components/DebugPanel";
import { analyzePause } from "@/lib/api";
import type { AnalyzeResponse } from "@/lib/types";
import type { FrameMeta } from "@/lib/frames";

// 视觉最小思考时长(SPEC §1.3.1 要求 3-5s 加载动画)
const MIN_THINK_MS = 3200;

export default function Home() {
  const [paused, setPaused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [frame, setFrame] = useState<FrameMeta | null>(null);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onTogglePause = useCallback((f: FrameMeta) => {
    setPaused(true);
    setFrame(f);
    setLoading(true);
    setResult(null);
    setError(null);

    const startedAt = Date.now();
    analyzePause({ frame_id: f.id })
      .then(async (r) => {
        const remain = Math.max(0, MIN_THINK_MS - (Date.now() - startedAt));
        if (remain > 0) await new Promise((res) => setTimeout(res, remain));
        setResult(r);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const onResume = useCallback(() => {
    setPaused(false);
    setLoading(false);
    setResult(null);
    setError(null);
    setFrame(null);
  }, []);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-6 py-8">
      <Header />

      <section>
        <h2 className="mb-3 text-xs uppercase tracking-[0.3em] text-zinc-500">
          模拟播放器 · 点击暂停以触发分析
        </h2>
        <VideoPlayer
          paused={paused}
          onTogglePause={onTogglePause}
          onResume={onResume}
        />
      </section>

      <section>
        <h2 className="mb-3 text-xs uppercase tracking-[0.3em] text-zinc-500">
          对比 · 现状 vs AI 改造
        </h2>
        <ComparisonPanel
          paused={paused}
          loading={loading}
          frame={frame}
          result={result}
        />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-[1fr_minmax(280px,360px)] gap-6">
        <div className="text-xs text-zinc-600 leading-relaxed">
          {error && (
            <div className="rounded border border-rose-800/60 bg-rose-950/40 p-3 text-rose-300">
              {error}
            </div>
          )}
          {!error && (
            <>
              <p className="text-zinc-400">
                这是 Stage 1 的"主场景静态版":播放器与对比面板由 5 张占位暂停帧
                + Mock 决策 JSON 驱动。Stage 2 起,后端的 Mock 将逐段被真 AI 调用替换。
              </p>
              <p className="mt-2">
                决策面板中的 SceneJSON、品牌、声线、4 项评分均出自
                <code className="mx-1 rounded bg-zinc-900 px-1 text-zinc-300">
                  backend/data/mock_responses/{"{frame_id}"}.json
                </code>
                ,严格对齐 SPEC §1.8.1 / §1.8.2 输出结构。
              </p>
            </>
          )}
        </div>
        <DebugPanel loading={loading} result={result} />
      </section>

      <Footer />
    </main>
  );
}

function Header() {
  return (
    <header className="border-b border-zinc-800 pb-6">
      <p className="text-xs uppercase tracking-[0.4em] text-zinc-600">
        Stage 1 · Mock-driven main scene
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-50">
        Pause Reborn
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-zinc-400">
        把腾讯视频的暂停广告,从打断观影的弹窗,重塑为感知场景、理解用户、懂得克制的体验系统。
      </p>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t border-zinc-900 pt-4 text-[11px] text-zinc-700">
      Demo · Stage 1 · 仅用于演示,所有品牌、文案、评分均为虚构占位
    </footer>
  );
}
