"use client";

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
    <header className="sticky top-0 z-50 h-16 border-b border-border-subtle bg-background-base/80 backdrop-blur-md">
      <div className="flex h-full items-center justify-between px-8">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold leading-none bg-gradient-to-r from-accent-brand-from to-accent-brand-to bg-clip-text text-transparent">
            Pause Reborn
          </h1>
          <span className="text-xs text-text-tertiary">
            腾讯视频暂停体验重塑系统
          </span>
        </div>

        <div className="flex items-center gap-4">
          <SceneSwitcher value={sceneId} onChange={onSceneChange} />
          <div className="h-6 w-px bg-border-subtle" />
          <PersonaSwitcher value={personaId} onChange={onPersonaChange} />
          <div className="h-6 w-px bg-border-subtle" />
          <StateSwitcher value={userState} onChange={onUserStateChange} />
        </div>
      </div>
    </header>
  );
}
