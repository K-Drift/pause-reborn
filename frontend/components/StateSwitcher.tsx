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
      <span className="text-xs text-text-tertiary">状态</span>
      <div className="inline-flex items-center gap-1.5">
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
                "cursor-pointer rounded-full px-4 py-1.5 text-xs transition-all duration-300 ease-in-out " +
                (active
                  ? fatigue
                    ? "bg-amber-900/30 text-amber-200/80"
                    : "bg-white/[0.08] text-zinc-100"
                  : "text-zinc-500 hover:bg-white/[0.03] hover:text-zinc-300")
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
