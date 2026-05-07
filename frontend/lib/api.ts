// Stage 4/5:三段独立 endpoint 的客户端封装,带 AbortSignal 防竞态。
// Vercel 部署:USE_HANDCRAFTED_ADS=true 时三段全部走本地 mock-data,不发任何 /api/* 请求。
import type {
  AnalyzeSceneResponse,
  Decision,
  DecideAdRequest,
  DecideAdResponse,
  GenerateImageRequest,
  GenerateImageResponse,
  SceneJSON,
} from "./types";

const USE_HANDCRAFTED_ADS =
  process.env.NEXT_PUBLIC_USE_HANDCRAFTED_ADS === "true";

// frame_id ↔ public/mock-data/<key>.json 的映射,与 scenes.ts 的 backendFrameId 对齐
const FRAME_ID_TO_MOCK_KEY: Record<string, string> = {
  urban_night_bar: "frame-bar",
  palace_ancient: "frame-ancient",
  late_night_solo: "frame-late-night",
  hospital_sensitive: "frame-sensitive",
};

// frame_id ↔ public/mock-ad-images 路径
const FRAME_ID_TO_MOCK_AD: Record<string, string | null> = {
  urban_night_bar: "/mock-ad-images/mock-ad-bar.png",
  palace_ancient: "/mock-ad-images/mock-ad-ancient.png",
  late_night_solo: "/mock-ad-images/mock-ad-late-night.png",
  hospital_sensitive: "/mock-ad-images/mock-ad-sensitive.png",
};

interface MockBundle {
  scene: SceneJSON;
  decisions: Record<string, Decision>;
}

const mockCache = new Map<string, Promise<MockBundle>>();

function loadMock(frameId: string): Promise<MockBundle> {
  const key = FRAME_ID_TO_MOCK_KEY[frameId];
  if (!key) return Promise.reject(new Error(`no mock for ${frameId}`));
  let p = mockCache.get(key);
  if (!p) {
    p = fetch(`/mock-data/${key}.json`).then((r) => {
      if (!r.ok) throw new Error(`/mock-data/${key}.json ${r.status}`);
      return r.json() as Promise<MockBundle>;
    });
    mockCache.set(key, p);
  }
  return p;
}

function rand(min: number, max: number): number {
  return Math.floor(min + Math.random() * (max - min));
}

// 模拟真 API 耗时;支持 AbortSignal,resume / 切场景时正确中断
function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("aborted", "AbortError"));
      return;
    }
    const t = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(t);
      reject(new DOMException("aborted", "AbortError"));
    });
  });
}

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

export async function analyzeScene(
  req: { frame_id: string },
  signal?: AbortSignal,
): Promise<AnalyzeSceneResponse> {
  if (USE_HANDCRAFTED_ADS) {
    const bundle = await loadMock(req.frame_id);
    await delay(rand(8000, 12000), signal);
    return {
      stage: "scene",
      source: "mock",
      scene: bundle.scene,
      elapsed_ms: 0,
    };
  }
  return postJSON<AnalyzeSceneResponse>("/api/analyze-scene", req, signal);
}

export async function decideAd(
  req: DecideAdRequest,
  signal?: AbortSignal,
): Promise<DecideAdResponse> {
  if (USE_HANDCRAFTED_ADS) {
    const bundle = await loadMock(req.frame_id);
    const personaId = req.persona_id ?? "urban_male_35";
    const userState = req.user_state ?? "normal";
    const key = `${personaId}_${userState}`;
    const decision =
      bundle.decisions[key] ?? bundle.decisions["urban_male_35_normal"];
    await delay(rand(5000, 10000), signal);
    return {
      stage: "decision",
      source: "mock",
      decision,
      elapsed_ms: 0,
    };
  }
  return postJSON<DecideAdResponse>("/api/decide-ad", req, signal);
}

export async function generateImage(
  req: GenerateImageRequest,
  signal?: AbortSignal,
): Promise<GenerateImageResponse> {
  if (USE_HANDCRAFTED_ADS) {
    await delay(rand(3000, 5000), signal);
    return {
      stage: "image",
      source: "mock",
      image_url: FRAME_ID_TO_MOCK_AD[req.frame_id] ?? null,
      elapsed_ms: 0,
    };
  }
  return postJSON<GenerateImageResponse>("/api/generate-image", req, signal);
}
