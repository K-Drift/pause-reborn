"use client";

import { USER_STATES, type UserState } from "@/lib/personas";

interface Props {
  value: UserState;
  onChange: (s: UserState) => void;
}

// Stage 8:情绪正常 → emerald,情绪疲劳 → amber。
export default function StateSwitcher({ value, onChange }: Props) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-text-tertiary">状态</span>
      <div className="flex items-center gap-1.5">
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
                "rounded-full px-3 py-1 text-xs transition-all duration-200 " +
                (active
                  ? fatigue
                    ? "bg-accent-warning text-white"
                    : "bg-accent-success text-white"
                  : "border border-border-default text-text-secondary hover:text-text-primary")
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
