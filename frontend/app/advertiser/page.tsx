"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BRANDS,
  DEFAULT_BRAND_ID,
  getBrandDashboard,
} from "@/lib/mock-dashboard";
import BrandPicker from "@/components/advertiser/BrandPicker";
import KPIRow from "@/components/advertiser/KPIRow";
import SceneFitHistogram from "@/components/advertiser/SceneFitHistogram";
import RASTrendLine from "@/components/advertiser/RASTrendLine";
import FeedbackList from "@/components/advertiser/FeedbackList";
import BrandFitNarrative from "@/components/advertiser/BrandFitNarrative";

// Stage 9.C:品牌主 Dashboard
// B 端 SaaS mock 页面,延用 dark 主题,仅以 "B 端 · 品牌主控台" 眉头标签做轻区分
// 全部数据来自 lib/mock-dashboard.ts(确定性 LCG,同品牌每次刷新一致)
export default function AdvertiserPage() {
  const [brandId, setBrandId] = useState<string>(DEFAULT_BRAND_ID);
  const data = getBrandDashboard(brandId);
  const brandMeta = BRANDS.find((b) => b.id === brandId) ?? BRANDS[0];

  return (
    <>
      {/* 顶部条:Pause Reborn 品牌 + 反链回主体验 */}
      <header className="sticky top-0 z-50 h-16 border-b border-border-subtle bg-background-base/80 backdrop-blur-md">
        <div className="flex h-full items-center justify-between px-8">
          <div className="flex items-center gap-3">
            <h1 className="bg-gradient-to-r from-accent-brand-from to-accent-brand-to bg-clip-text text-3xl font-bold leading-none text-transparent">
              Pause Reborn
            </h1>
            <span className="text-xs text-text-tertiary">
              腾讯视频暂停体验重塑系统
            </span>
          </div>
          <Link
            href="/"
            className="rounded-md border border-border-default bg-background-elevated px-3 py-1.5 text-xs text-text-secondary transition-colors hover:border-accent-brand-from hover:text-text-primary"
          >
            ← 主体验
          </Link>
        </div>
      </header>

      <main
        className="mx-auto w-full max-w-6xl px-8 py-8"
        style={{ minHeight: "calc(100vh - 64px)" }}
      >
        {/* 眉头 */}
        <div className="text-[11px] uppercase tracking-[0.3em] text-text-tertiary">
          B 端 · 品牌主控台
        </div>

        {/* 品牌选择 + 品牌名 hero */}
        <div className="mt-3 flex flex-col gap-4 border-b border-border-subtle pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <BrandPicker value={brandId} onChange={setBrandId} />
            <div className="mt-4 flex items-baseline gap-3">
              <h2 className="text-3xl font-medium text-text-primary">
                {brandMeta.brand}
              </h2>
              <span className="text-sm text-text-tertiary">
                · {brandMeta.category}
              </span>
            </div>
          </div>
          <div className="text-xs text-text-tertiary md:text-right">
            数据样本:近 30 天 / Demo 演示用 · 全部为模拟数据
          </div>
        </div>

        {/* KPI 行 */}
        <div className="mt-6">
          <KPIRow data={data} />
        </div>

        {/* 双列:直方图 + 趋势线 */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <SceneFitHistogram data={data} />
          <RASTrendLine data={data} />
        </div>

        {/* 用户反馈 */}
        <div className="mt-6">
          <FeedbackList data={data} />
        </div>

        {/* AI 解释段落 */}
        <div className="mt-6">
          <BrandFitNarrative data={data} />
        </div>

        <div className="mt-10 border-t border-border-subtle pt-4 text-xs text-text-tertiary">
          演示数据 · 不代表真实投放表现 · RAS 公式见{" "}
          <a
            href="https://github.com/K-Drift/pause-reborn/blob/main/docs/RAS.md"
            target="_blank"
            rel="noreferrer"
            className="text-text-secondary underline-offset-2 hover:underline"
          >
            docs/RAS.md
          </a>
        </div>
      </main>
    </>
  );
}
