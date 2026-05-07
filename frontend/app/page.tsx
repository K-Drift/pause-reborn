"use client";

import { useCallback, useRef, useState } from "react";
import NavBar from "@/components/NavBar";
import VideoStage, { type VideoStageHandle } from "@/components/VideoStage";
import ComparisonOverlay from "@/components/ComparisonOverlay";
import AIDecisionPanel from "@/components/AIDecisionPanel";
// Stage 8.4:VPP 进阶展示区已下线(与主对比区视觉重复)。组件源码保留,便于将来恢复。
// import VPPShowcase from "@/components/VPPShowcase";
import { analyzeScene, decideAd, generateImage } from "@/lib/api";
import type { Decision, SceneJSON, StageSource } from "@/lib/types";
import {
  DEFAULT_PERSONA_ID,
  DEFAULT_USER_STATE,
  type UserState,
} from "@/lib/personas";
import {
  DEFAULT_SCENE_ID,
  getScene,
  type SceneId,
  type SceneMeta,
} from "@/lib/scenes";

// Stage 8:整页驾驶舱布局 + 三段流水线 + 防竞态。
// 流水线逻辑沿用 Stage 5 的 AbortController + scene 缓存。
// USE_HANDCRAFTED_ADS=true 时三段全部走 public/mock-data/*.json,分支已下沉到 lib/api.ts。
type Phase = "idle" | "loading" | "ready" | "error";

export interface SceneState {
  phase: Phase;
  data?: SceneJSON;
  source?: StageSource;
}
export interface DecisionState {
  phase: Phase;
  data?: Decision;
  source?: StageSource;
}
export interface ImageState {
  phase: Phase;
  image_url?: string | null;
  source?: StageSource;
  _ai_status?: "live" | "fallback";
  _fallback_reason?: string;
  _fallback_stage?: string;
}

const IDLE: Phase = "idle";

export default function Home() {
  const [sceneId, setSceneId] = useState<SceneId>(DEFAULT_SCENE_ID);
  const [paused, setPaused] = useState(false);
  const [personaId, setPersonaId] = useState<string>(DEFAULT_PERSONA_ID);
  const [userState, setUserState] = useState<UserState>(DEFAULT_USER_STATE);
  const [sceneState, setSceneState] = useState<SceneState>({ phase: IDLE });
  const [decisionState, setDecisionState] = useState<DecisionState>({ phase: IDLE });
  const [imageState, setImageState] = useState<ImageState>({ phase: IDLE });

  const stageRef = useRef<VideoStageHandle | null>(null);
  const runIdRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const sceneCacheRef = useRef<Map<string, SceneJSON>>(new Map());

  const launchPipeline = useCallback(
    async (
      scene: SceneMeta,
      personaIdArg: string,
      userStateArg: UserState,
    ) => {
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      const myRun = ++runIdRef.current;
      const stillCurrent = () =>
        myRun === runIdRef.current && !ac.signal.aborted;

      const frameId = scene.backendFrameId;

      // ── Stage 1:VLM 场景理解(命中缓存即跳过) ──
      let sceneJson = sceneCacheRef.current.get(frameId);
      if (sceneJson) {
        setSceneState({ phase: "ready", data: sceneJson, source: "cached" });
        setDecisionState({ phase: "loading" });
        setImageState({ phase: "idle" });
      } else {
        setSceneState({ phase: "loading" });
        setDecisionState({ phase: "idle" });
        setImageState({ phase: "idle" });
        try {
          const r = await analyzeScene({ frame_id: frameId }, ac.signal);
          if (!stillCurrent()) return;
          sceneJson = r.scene;
          // 只缓存真 VLM 成功的结果;mock / mock_fallback 不进缓存,
          // 否则一次降级会把"伪场景"卡死整个 session,后续点击永远跳过 stage1
          if (r.source === "real") {
            sceneCacheRef.current.set(frameId, sceneJson);
          }
          setSceneState({ phase: "ready", data: sceneJson, source: r.source });
        } catch (e) {
          if (!stillCurrent() || isAbort(e)) return;
          console.error("[stage1]", e);
          setSceneState({ phase: "error" });
          return;
        }
      }

      // ── Stage 2:LLM 广告决策 ──
      setDecisionState({ phase: "loading" });
      let decision: Decision;
      try {
        const r = await decideAd(
          {
            frame_id: frameId,
            scene: sceneJson!,
            persona_id: personaIdArg,
            user_state: userStateArg,
          },
          ac.signal,
        );
        if (!stillCurrent()) return;
        decision = r.decision;
        setDecisionState({ phase: "ready", data: decision, source: r.source });
      } catch (e) {
        if (!stillCurrent() || isAbort(e)) return;
        console.error("[stage2]", e);
        setDecisionState({ phase: "error" });
        return;
      }

      if (decision.decision !== "show_ad") {
        if (!stillCurrent()) return;
        setImageState({ phase: "ready", image_url: null, source: "skipped" });
        return;
      }

      // ── Stage 3:图像生成 ──
      setImageState({ phase: "loading" });
      try {
        const r = await generateImage(
          { frame_id: frameId, scene: sceneJson!, decision },
          ac.signal,
        );
        if (!stillCurrent()) return;
        setImageState({
          phase: "ready",
          image_url: r.image_url,
          source: r.source,
          _ai_status: r._ai_status,
          _fallback_reason: r._fallback_reason,
          _fallback_stage: r._fallback_stage,
        });
      } catch (e) {
        if (!stillCurrent() || isAbort(e)) return;
        console.error("[stage3]", e);
        setImageState({ phase: "error" });
      }
    },
    [],
  );

  const onPause = useCallback(() => {
    setPaused(true);
    void launchPipeline(getScene(sceneId), personaId, userState);
  }, [sceneId, personaId, userState, launchPipeline]);

  const onResume = useCallback(() => {
    abortRef.current?.abort();
    runIdRef.current++;
    setPaused(false);
    setSceneState({ phase: IDLE });
    setDecisionState({ phase: IDLE });
    setImageState({ phase: IDLE });
    stageRef.current?.play();
  }, []);

  const onSceneChange = useCallback(
    (id: SceneId) => {
      setSceneId(id);
      // 切换场景:退出对比模式回到播放,重置面板
      abortRef.current?.abort();
      runIdRef.current++;
      setPaused(false);
      setSceneState({ phase: IDLE });
      setDecisionState({ phase: IDLE });
      setImageState({ phase: IDLE });
    },
    [],
  );

  const onPersonaChange = useCallback(
    (id: string) => {
      setPersonaId(id);
      if (paused) void launchPipeline(getScene(sceneId), id, userState);
    },
    [paused, sceneId, userState, launchPipeline],
  );

  const onUserStateChange = useCallback(
    (s: UserState) => {
      setUserState(s);
      if (paused) void launchPipeline(getScene(sceneId), personaId, s);
    },
    [paused, sceneId, personaId, launchPipeline],
  );

  const scene = getScene(sceneId);

  return (
    <>
      <NavBar
        sceneId={sceneId}
        onSceneChange={onSceneChange}
        personaId={personaId}
        onPersonaChange={onPersonaChange}
        userState={userState}
        onUserStateChange={onUserStateChange}
      />

      <main
        className="grid w-full grid-cols-1 gap-6 px-8 py-6 lg:grid-cols-[65%_35%]"
        style={{ minHeight: "calc(100vh - 64px)" }}
      >
        <section className="flex flex-col">
          <VideoStage
            ref={stageRef}
            sceneId={sceneId}
            paused={paused}
            onPause={onPause}
            onResume={onResume}
          >
            <ComparisonOverlay
              scene={scene}
              sceneState={sceneState}
              decisionState={decisionState}
              imageState={imageState}
              onResume={onResume}
            />
          </VideoStage>
        </section>

        <section className="flex flex-col">
          <AIDecisionPanel
            paused={paused}
            sceneState={sceneState}
            decisionState={decisionState}
          />
        </section>
      </main>

      {/* Stage 8.4:VPP 进阶展示区已下线 */}
      {/* <VPPShowcase /> */}

      <footer className="mt-4 border-t border-border-subtle px-8 py-4 text-xs text-text-tertiary">
        Demo · Stage 8 · 仅用于演示,所有品牌、文案、评分均为虚构占位
      </footer>
    </>
  );
}

function isAbort(e: unknown): boolean {
  return (
    (e instanceof DOMException && e.name === "AbortError") ||
    (e instanceof Error && e.name === "AbortError")
  );
}
