"use client";

import Link from "next/link";
import clsx from "clsx";

export default function FreeBusyList({ members }: { members: any[] }) {
  return (
    <div className="space-y-2">
      {members.map((m) => (
        <Link
          key={m._id}
          href={`/dashboard/admin/users/${m._id}`}
          className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-panel2 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-ink text-xs font-medium overflow-hidden shrink-0"
              style={{ background: m.avatarColor }}
            >
              {m.avatarUrl ? <img src={m.avatarUrl} className="w-full h-full object-cover" alt="" /> : m.name[0].toUpperCase()}
            </div>
            <div>
              <div className="text-sm text-paper group-hover:text-signal transition-colors">{m.name}</div>
              <div className="text-xs text-mute">{m.title}</div>
            </div>
          </div>
          <span
            className={clsx(
              "text-[10px] font-mono uppercase tracking-wide px-2 py-1 rounded-full border flex items-center gap-1.5",
              m.status === "available" ? "text-signal border-signal/30" : "text-amber border-amber/30"
            )}
          >
            <span className={clsx("w-1.5 h-1.5 rounded-full", m.status === "available" ? "bg-signal" : "bg-amber")} />
            {m.status === "available" ? "Free" : "Busy"}
          </span>
        </Link>
      ))}
      {members.length === 0 && <p className="text-mute text-sm py-4 text-center">No team members yet.</p>}
    </div>
  );
}