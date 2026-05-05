import type { NextConfig } from "next";

const BACKEND = process.env.BACKEND_URL || "http://127.0.0.1:8000";

const nextConfig: NextConfig = {
  // 把后端的静态生成图目录透传到同源,/generated/<file>.png 直接可用
  async rewrites() {
    return [
      { source: "/generated/:path*", destination: `${BACKEND}/generated/:path*` },
    ];
  },
};

export default nextConfig;
