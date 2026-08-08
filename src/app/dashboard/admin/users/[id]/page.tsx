"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import TaskCard from "@/components/TaskCard";
import clsx from "clsx";

export default function MemberProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/users/${id}`).then((r) => r.json()).then(setData);
  }, [id]);

  if (!data) return <p className="text-mute text-sm">Loading...</p>;
  const { user, tasks, stats } = data;

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-ink text-xl font-medium overflow-hidden shrink-0"
          style={{ background: user.avatarColor }}
        >
          {user.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full object-cover" alt="" /> : user.name[0].toUpperCase()}
        </div>
        <div className="min-w-0">
          <h1 className="font-display text-2xl text-paper truncate">{user.name}</h1>
          <p className="text-mute text-sm truncate">{user.title} · {user.email}</p>
          {user.isBlocked && (
            <span className="inline-block mt-1 text-[10px] font-mono uppercase tracking-wide px-2 py-0.5 rounded border text-coral border-coral/30">
              Blocked
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
        <Stat label="Total" value={stats.total} />
        <Stat label="Completed" value={stats.completed} accent="text-signal" />
        <Stat label="Pending" value={stats.pending} accent="text-amber" />
        <Stat label="On time" value={stats.onTime} accent="text-signal" />
        <Stat label="Late" value={stats.late} accent="text-coral" />
      </div>

      <h2 className="font-display text-lg text-paper mb-4">Task history</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tasks.map((t: any) => (
          <div key={t._id}>
            {t.project && (
              <Link href={`/dashboard/admin/projects/${t.project._id}`} className="text-[11px] text-mute hover:text-signal font-mono uppercase tracking-wide mb-1 inline-block">
                {t.project.name}
              </Link>
            )}
            <TaskCard task={{ ...t, assignees: t.assignees?.length ? t.assignees : [user] }} />
          </div>
        ))}
        {tasks.length === 0 && <p className="text-mute text-sm">No tasks assigned to them yet.</p>}
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="bg-panel border border-line rounded-xl2 p-4">
      <div className={clsx("font-display text-2xl", accent || "text-paper")}>{value}</div>
      <div className="text-mute text-xs mt-1 font-mono uppercase tracking-wide">{label}</div>
    </div>
  );
}
