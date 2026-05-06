"use client";

import { USER_STATES, type UserState } from "@/lib/personas";

interface Props {
  value: UserState;
  onChange: (s: UserState) => void;
}

// 同 PersonaSwitcher 的胶囊+ ::after underline 套路。正常态绿色,疲劳态琥珀。
export default function StateSwitcher({ value, onChange }: Props) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-text-tertiary">状态</span>
      <div className="inline-flex items-center gap-1">
        {USER_STATES.map((s) => {
          const active = s.id === value;
          const fatigue = s.id === "emotional_fatigue";
          const underlineColor = fatigue
            ? "after:bg-accent-warning"
            : "after:bg-accent-success";
          return (
            <button
              key={s.id}
              type="button"
              title={s.hint}
              onClick={() => onChange(s.id)}
              className={
                "relative cursor-pointer rounded-md px-3 py-1.5 text-xs transition-all duration-200 " +
                (active
                  ? `bg-background-elevated text-text-primary after:absolute after:bottom-[-2px] after:left-[10%] after:right-[10%] after:h-0.5 after:content-[''] ${underlineColor}`
                  : "text-text-tertiary hover:bg-background-elevated/50 hover:text-text-secondary")
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
