// Stage 4/5:三段独立 endpoint 的客户端封装,带 AbortSignal 防竞态。
// 每段失败时:抛 Error,由调用方决定是否中断后续段。
// 后端已在每段内做 mock 降级,正常流程下 fetch 不应失败(除非主动 abort)。
import type {
  AnalyzeSceneResponse,
  DecideAdRequest,
  DecideAdResponse,
  GenerateImageRequest,
  GenerateImageResponse,
} from "./types";

async function postJSON<T>(
  path: string,
  body: unknown,
  signal?: AbortSignal,
): Promise<T> {
  const r = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  if (!r.ok) {
    throw new Error(`${path} failed: ${r.status}`);
  }
  return (await r.json()) as T;
}

export function analyzeScene(
  req: { frame_id: string },
  signal?: AbortSignal,
) {
  return postJSON<AnalyzeSceneResponse>("/api/analyze-scene", req, signal);
}

export function decideAd(req: DecideAdRequest, signal?: AbortSignal) {
  return postJSON<DecideAdResponse>("/api/decide-ad", req, signal);
}

export function generateImage(req: GenerateImageRequest, signal?: AbortSignal) {
  return postJSON<GenerateImageResponse>("/api/generate-image", req, signal);
}
