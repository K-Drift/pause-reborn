import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pause Reborn",
  description: "把腾讯视频暂停广告重塑为感知场景、理解用户、懂得克制的体验系统",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full bg-background-base text-text-primary">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
