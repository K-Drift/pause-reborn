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
    <header className="sticky top-0 z-50 w-full flex items-center justify-between h-16 px-6 overflow-hidden bg-[#0A0A0B]">
      {/* 左侧:Logo + 系统名 — 强制不压缩 */}
      <div className="flex items-center gap-4 shrink-0">
        <h1 className="text-xl font-bold text-white whitespace-nowrap">
          Pause Reborn
        </h1>
        <span className="text-[11px] text-zinc-600 whitespace-nowrap">
          腾讯视频暂停体验重塑系统
        </span>
      </div>

      {/* 中间:筛选组 — 弹性空间 + 居中 */}
      <div className="flex-1 flex items-center justify-center gap-8 min-w-0">
        <SceneSwitcher value={sceneId} onChange={onSceneChange} />
        <PersonaSwitcher value={personaId} onChange={onPersonaChange} />
        <StateSwitcher value={userState} onChange={onUserStateChange} />
      </div>

      {/* 右侧:品牌主视角按钮 — 最高优先级,绝不折行 */}
      <Link
        href="/advertiser"
        className="shrink-0 flex items-center gap-2 whitespace-nowrap rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-1.5 text-xs text-zinc-400 transition-all duration-300 ease-in-out hover:bg-white/[0.06] hover:text-zinc-200"
      >
        品牌主视角 →
      </Link>
    </header>
  );
}
