"use client";

import { useEffect, useState } from "react";
import { Trophy } from "lucide-react";
import clsx from "clsx";

const rankColors = ["#F5B95B", "#C7CDD6", "#B87A4A"]; // gold, silver, bronze

export default function ProjectLeaderboard({ projectId }: { projectId: string }) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/projects/${projectId}/leaderboard`).then((r) => r.json()).then((d) => {
      setRows(d);
      setLoading(false);
    });
  }, [projectId]);

  if (loading) return <p className="text-mute text-sm">Loading...</p>;

  return (
    <div className="bg-panel border border-line rounded-xl2 overflow-hidden max-w-2xl">
      {rows.map((row, i) => (
        <div
          key={row.user._id}
          className={clsx("flex items-center gap-4 px-5 py-3.5", i !== rows.length - 1 && "border-b border-line/60")}
        >
          <div className="w-7 flex items-center justify-center shrink-0">
            {i < 3 ? (
              <Trophy size={16} style={{ color: rankColors[i] }} />
            ) : (
              <span className="text-mute text-sm font-mono">{i + 1}</span>
            )}
          </div>
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-ink text-xs font-medium shrink-0 overflow-hidden"
            style={{ background: row.user.avatarColor }}
          >
            {row.user.avatarUrl ? <img src={row.user.avatarUrl} className="w-full h-full object-cover" alt="" /> : row.user.name[0].toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm text-paper truncate">{row.user.name}</div>
            <div className="text-xs text-mute">{row.user.title}</div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-paper font-display text-lg">{row.completed}</div>
            <div className="text-[10px] text-mute font-mono uppercase tracking-wide">
              {row.completed > 0 ? `${Math.round(row.onTimeRate * 100)}% on time` : "tasks done"}
            </div>
          </div>
        </div>
      ))}
      {rows.length === 0 && <p className="text-mute text-sm p-5 text-center">No members in this project yet.</p>}
    </div>
  );
}
