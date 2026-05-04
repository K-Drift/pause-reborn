import type { AnalyzeRequest, AnalyzeResponse } from "./types";

export async function analyzePause(req: AnalyzeRequest): Promise<AnalyzeResponse> {
  const r = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!r.ok) {
    throw new Error(`/api/analyze failed: ${r.status}`);
  }
  return (await r.json()) as AnalyzeResponse;
}
