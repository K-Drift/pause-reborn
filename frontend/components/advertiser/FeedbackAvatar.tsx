"use client";

interface Props {
  seed: string;
  size?: number;
}

// Stage 9.F:用户反馈头像 — 由 quote 字符串确定性生成
// 1 个汉字 + HSL 色相由哈希驱动,深色背景配亮色文字
const SURNAMES = [
  "李", "王", "张", "刘", "陈",
  "杨", "周", "吴", "赵", "黄",
  "孙", "马", "朱", "胡", "林",
];

function hash32(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h ^ s.charCodeAt(i)) >>> 0) * 16777619 >>> 0;
  }
  return h;
}

export default function FeedbackAvatar({ seed, size = 24 }: Props) {
  const h = hash32(seed);
  const initial = SURNAMES[h % SURNAMES.length];
  // 色相 0-360,饱和度/亮度固定,保持深色调
  const hue = h % 360;
  const bg = `hsl(${hue}, 38%, 22%)`;
  const fg = `hsl(${hue}, 55%, 75%)`;
  return (
    <div
      className="flex shrink-0 select-none items-center justify-center rounded-md font-medium"
      style={{
        width: size,
        height: size,
        background: bg,
        color: fg,
        fontSize: size * 0.55,
      }}
      aria-hidden
    >
      {initial}
    </div>
  );
}
