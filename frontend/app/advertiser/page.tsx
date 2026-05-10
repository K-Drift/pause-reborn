"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BRANDS,
  DEFAULT_BRAND_ID,
  getBrandDashboard,
} from "@/lib/mock-dashboard";
import BrandPicker from "@/components/advertiser/BrandPicker";
import BrandMonogram from "@/components/advertiser/BrandMonogram";
import KPIRow from "@/components/advertiser/KPIRow";
import SceneFitHistogram from "@/components/advertiser/SceneFitHistogram";
import RASTrendLine from "@/components/advertiser/RASTrendLine";
import FeedbackList from "@/components/advertiser/FeedbackList";
import BrandFitNarrative from "@/components/advertiser/BrandFitNarrative";

// Stage 9.C:品牌主 Dashboard
// Stage 9.D:视觉精修 — 加 monogram hero,章节用 01/02/03/04 节奏标号,渐变分隔线
export default function AdvertiserPage() {
  const [brandId, setBrandId] = useState<string>(DEFAULT_BRAND_ID);
  const data = getBrandDashboard(brandId);
  const brandMeta = BRANDS.find((b) => b.id === brandId) ?? BRANDS[0];

  return (
    <>
      {/* 顶部条:Pause Reborn 品牌 + 反链回主体验 */}
      <header className="sticky top-0 z-50 h-16 border-b border-white/[0.06] bg-background-base/80 backdrop-blur-md">
        <div className="flex h-full items-center justify-between px-8">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold leading-none text-white/90">
              Pause Reborn
            </h1>
            <span className="text-xs text-text-tertiary">
              腾讯视频暂停体验重塑系统
            </span>
          </div>
          <Link
            href="/"
            className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3.5 py-1.5 text-xs text-text-secondary transition-colors hover:bg-white/[0.08] hover:text-text-primary"
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

        {/* 品牌 hero:monogram + 品牌名 + 品类 pill;BrandPicker 移到右侧 */}
        <div className="mt-3 flex flex-col gap-5 pb-7 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <BrandMonogram brand={brandMeta.brand} />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-serif text-3xl font-medium leading-tight text-text-primary">
                  {brandMeta.brand}
                </h2>
                <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-0.5 text-[11px] text-text-secondary">
                  {brandMeta.category}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-[11px] text-text-tertiary">
                <span className="inline-block h-1 w-1 rounded-full bg-accent-success/50" />
                数据样本:近 30 天 · Demo 演示用 · 全部为模拟数据
              </div>
            </div>
          </div>
          <BrandPicker value={brandId} onChange={setBrandId} />
        </div>

        {/* 渐变细线分隔 */}
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

        {/* 01 投放表现 */}
        <div className="mt-8">
          <SectionHeader index="01" title="投放表现" />
          <div className="mt-4">
            <KPIRow data={data} />
          </div>
        </div>

        {/* 02 场景画像 */}
        <div className="mt-12">
          <SectionHeader index="02" title="场景画像" />
          <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <SceneFitHistogram data={data} />
            <RASTrendLine data={data} />
          </div>
        </div>

        {/* 03 用户反馈 */}
        <div className="mt-12">
          <SectionHeader index="03" title="用户反馈" />
          <div className="mt-4">
            <FeedbackList data={data} />
          </div>
        </div>

        {/* 04 AI 投放分析 */}
        <div className="mt-12">
          <SectionHeader index="04" title="AI 投放分析" />
          <div className="mt-4">
            <BrandFitNarrative data={data} />
          </div>
        </div>

        <div className="mt-12 border-t border-white/[0.06] pt-4 text-xs text-text-tertiary">
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

function SectionHeader({ index, title }: { index: string; title: string }) {
  return (
    <div className="flex items-baseline gap-3 border-b border-white/[0.06] pb-3">
      <span className="font-mono text-xs tabular-nums text-text-tertiary">
        / {index}
      </span>
      <span className="text-sm font-medium text-text-primary">{title}</span>
    </div>
  );
}
