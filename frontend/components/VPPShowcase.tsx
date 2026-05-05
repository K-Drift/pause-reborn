"use client";

import Image from "next/image";

// Stage 8:Layer 3 VPP 进阶能力展示。两组 before/after 对比图垂直排列。
const CASES = [
  {
    label: "案例 1 · 现代家居场景",
    beforeSrc: "/vpp-cases/case1-before.png",
    afterSrc: "/vpp-cases/case1-after.png",
    beforeDesc: "传统画面",
    afterDesc: "桌上自然出现品牌产品",
  },
  {
    label: "案例 2 · 街景空白墙面",
    beforeSrc: "/vpp-cases/case2-before.png",
    afterSrc: "/vpp-cases/case2-after.png",
    beforeDesc: "原始空白墙面",
    afterDesc: "融入剧情风格的招牌植入",
  },
];

export default function VPPShowcase() {
  return (
    <section className="mt-16 px-8 mx-auto max-w-7xl">
      <h2 className="text-2xl font-semibold text-text-primary">
        进阶能力 · VPP 场景内植入
      </h2>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-text-secondary">
        以下展示由 Nano Banana Pro / GPT-Image-2 对真实剧集帧的离线植入实验。
        生产环境中此类素材将在剧集上线前预生成,用户暂停时通过 CDN 毫秒级调取。
        不同尺寸反映了 AI 针对每一帧的定制化优化。
      </p>

      <div className="mt-12 flex flex-col gap-12">
        {CASES.map((c, i) => (
          <CaseRow key={i} {...c} />
        ))}
      </div>
    </section>
  );
}

function CaseRow({
  label,
  beforeSrc,
  afterSrc,
  beforeDesc,
  afterDesc,
}: {
  label: string;
  beforeSrc: string;
  afterSrc: string;
  beforeDesc: string;
  afterDesc: string;
}) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-text-tertiary">
        {label}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-6">
        <CaseImage
          src={beforeSrc}
          alt="改造前"
          tag="改造前"
          tagClass="text-text-tertiary"
          desc={beforeDesc}
        />
        <CaseImage
          src={afterSrc}
          alt="AI 植入后"
          tag="AI 植入后"
          tagClass="text-accent-success"
          desc={afterDesc}
        />
      </div>
    </div>
  );
}

function CaseImage({
  src,
  alt,
  tag,
  tagClass,
  desc,
}: {
  src: string;
  alt: string;
  tag: string;
  tagClass: string;
  desc: string;
}) {
  return (
    <div>
      <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-xl bg-background-card">
        <Image src={src} alt={alt} fill unoptimized className="object-contain" />
      </div>
      <div className={"mt-2 text-xs " + tagClass}>{tag}</div>
      <div className="mt-1 text-xs text-text-tertiary">{desc}</div>
    </div>
  );
}
