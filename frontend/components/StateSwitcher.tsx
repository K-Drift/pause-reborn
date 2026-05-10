"use client";

import { USER_STATES, type UserState } from "@/lib/personas";

interface Props {
  value: UserState;
  onChange: (s: UserState) => void;
}

// 胶囊背景:正常态 warm amber tint,疲劳态 amber tint
export default function StateSwitcher({ value, onChange }: Props) {
  return (
    <div className="flex items-center gap-2">
      <span className="whitespace-nowrap text-xs text-zinc-600">状态</span>
      <div className="inline-flex items-center gap-1">
        {USER_STATES.map((s) => {
          const active = s.id === value;
          const fatigue = s.id === "emotional_fatigue";
          return (
            <button
              key={s.id}
              type="button"
              title={s.hint}
              onClick={() => onChange(s.id)}
              className={
                "cursor-pointer whitespace-nowrap px-3 py-1 text-xs transition-all duration-300 ease-in-out " +
                (active
                  ? fatigue
                    ? "rounded-full bg-amber-900/40 font-medium text-amber-200/90 shadow-sm shadow-black/20"
                    : "rounded-full bg-zinc-800/80 font-medium text-zinc-100 shadow-sm shadow-black/20"
                  : "text-zinc-400 hover:text-zinc-300")
              }
            >
              {s.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
