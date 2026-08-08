"use client";

import clsx from "clsx";
import { Check } from "lucide-react";

export default function MemberPicker({
  members,
  selected,
  onToggle,
  emptyLabel = "No members to pick from."
}: {
  members: any[];
  selected: string[];
  onToggle: (id: string) => void;
  emptyLabel?: string;
}) {
  if (members.length === 0) {
    return <p className="text-mute text-xs py-2">{emptyLabel}</p>;
  }
  return (
    <div className="max-h-48 overflow-y-auto border border-line rounded-lg divide-y divide-line/60">
      {members.map((m) => {
        const id = m._id || m.id;
        const active = selected.includes(id);
        return (
          <button
            type="button"
            key={id}
            onClick={() => onToggle(id)}
            className={clsx(
              "w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors text-left",
              active ? "bg-signal/10 text-signal" : "text-paper hover:bg-panel2"
            )}
          >
            <div
              className={clsx(
                "w-4 h-4 rounded border flex items-center justify-center shrink-0",
                active ? "bg-signal border-signal" : "border-line"
              )}
            >
              {active && <Check size={11} className="text-ink" />}
            </div>
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-ink text-[10px] font-medium shrink-0"
              style={{ background: m.avatarColor || "#5EF1C0" }}
            >
              {m.avatarUrl ? (
                <img src={m.avatarUrl} className="w-6 h-6 rounded-full object-cover" alt="" />
              ) : (
                m.name?.[0]?.toUpperCase()
              )}
            </div>
            <span className="truncate">{m.name}</span>
          </button>
        );
      })}
    </div>
  );
}
