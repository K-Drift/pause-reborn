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
      <span className="whitespace-nowrap text-xs text-text-tertiary">状态</span>
      <div className="inline-flex items-center gap-4">
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
                "cursor-pointer whitespace-nowrap text-xs transition-all duration-300 ease-in-out " +
                (active
                  ? fatigue
                    ? "text-amber-200/80 drop-shadow-sm"
                    : "text-zinc-100 drop-shadow-sm"
                  : "text-zinc-500 hover:text-zinc-300")
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
