// 代理到后端 FastAPI,避免浏览器 CORS。
import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_URL || "http://127.0.0.1:8000";

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const r = await fetch(`${BACKEND}/api/analyze-scene`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
    const text = await r.text();
    return new NextResponse(text, {
      status: r.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return NextResponse.json(
      { error: "backend unreachable", detail: String(err) },
      { status: 502 },
    );
  }
}
