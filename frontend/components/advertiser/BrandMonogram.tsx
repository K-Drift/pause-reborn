"use client";

interface Props {
  brand: string;
  size?: number;
}

// Stage 9.D:品牌字母牌 — 取品牌名 "·" 前的前 2 个字符,渐变背景
// 12 个品牌中 11 个的品牌标识都在 "·" 之前;唯一例外 "单一麦芽 · 长泽十二年"
// 取 "单一" 仍然是有意义的概念缩写(单一麦芽 = single malt)
export default function BrandMonogram({ brand, size = 56 }: Props) {
  const segment = brand.split("·")[0].trim();
  const monogram = (segment.slice(0, 2) || brand.slice(0, 2)) || "·";
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-brand-from to-accent-brand-to font-semibold text-text-primary shadow-lg shadow-accent-brand-from/20"
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {monogram}
    </div>
  );
}
