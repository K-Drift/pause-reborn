"use client";

import Link from "next/link";
import SceneSwitcher from "./SceneSwitcher";
import PersonaSwitcher from "./PersonaSwitcher";
import StateSwitcher from "./StateSwitcher";
import type { SceneId } from "@/lib/scenes";
import type { UserState } from "@/lib/personas";

interface Props {
  sceneId: SceneId;
  onSceneChange: (id: SceneId) => void;
  personaId: string;
  onPersonaChange: (id: string) => void;
  userState: UserState;
  onUserStateChange: (s: UserState) => void;
}

export default function NavBar({
  sceneId,
  onSceneChange,
  personaId,
  onPersonaChange,
  userState,
  onUserStateChange,
}: Props) {
  return (
    <header className="sticky top-0 z-50 h-16 border-b border-white/[0.06] bg-background-base/80 backdrop-blur-md">
      <div className="flex h-full items-center justify-between px-8">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold leading-none text-white/90">
            Pause Reborn
          </h1>
          <span className="text-xs text-text-tertiary">
            腾讯视频暂停体验重塑系统
          </span>
        </div>

        <div className="flex items-center gap-10">
          <SceneSwitcher value={sceneId} onChange={onSceneChange} />
          <div className="h-5 w-px bg-white/10" />
          <PersonaSwitcher value={personaId} onChange={onPersonaChange} />
          <div className="h-5 w-px bg-white/10" />
          <StateSwitcher value={userState} onChange={onUserStateChange} />
          <div className="h-5 w-px bg-white/10" />
          {/* Stage 9.C:跳转到品牌主 Dashboard(B 端视角) */}
          <Link
            href="/advertiser"
            className="rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-1.5 text-xs text-zinc-400 transition-all duration-300 ease-in-out hover:bg-white/[0.06] hover:text-zinc-200"
          >
            品牌主视角 →
          </Link>
        </div>
      </div>
    </header>
  );
}
