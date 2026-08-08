"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { UserPlus, Ban, CheckCircle2 } from "lucide-react";
import AddMemberModal from "@/components/AddMemberModal";
import toast from "react-hot-toast";
import clsx from "clsx";

export default function TeamPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/users");
    if (res.ok) setMembers(await res.json());
  }, []);

  useEffect(() => { load(); }, [load]);

  async function toggleBlock(id: string, currentlyBlocked: boolean, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const res = await fetch(`/api/users/${id}/block`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blocked: !currentlyBlocked })
    });
    if (res.ok) {
      toast.success(currentlyBlocked ? "Member unblocked." : "Member blocked.");
      load();
    } else {
      const d = await res.json();
      toast.error(d.error || "Couldn't update that member.");
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl text-paper">Team</h1>
          <p className="text-mute text-sm mt-1">Every member and their live status.</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="bg-signal text-ink font-medium rounded-lg px-4 py-2.5 flex items-center justify-center gap-2 hover:bg-signal2 transition-colors text-sm"
        >
          <UserPlus size={16} />
          Add member
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {members.map((m) => (
          <Link
            key={m._id}
            href={`/dashboard/admin/users/${m._id}`}
            className={clsx(
              "bg-panel border rounded-xl2 p-5 hover:border-signal/30 transition-colors block",
              m.isBlocked ? "border-coral/30" : "border-line"
            )}
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center text-ink font-medium overflow-hidden shrink-0"
                style={{ background: m.avatarColor }}
              >
                {m.avatarUrl ? <img src={m.avatarUrl} className="w-full h-full object-cover" alt="" /> : m.name[0].toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="text-paper font-medium truncate">{m.name}</div>
                <div className="text-xs text-mute truncate">{m.title}</div>
              </div>
            </div>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span
                className={clsx(
                  "text-[10px] font-mono uppercase tracking-wide px-2 py-1 rounded-full border inline-flex items-center gap-1.5",
                  m.isBlocked ? "text-coral border-coral/30" : m.status === "available" ? "text-signal border-signal/30" : "text-amber border-amber/30"
                )}
              >
                <span className={clsx("w-1.5 h-1.5 rounded-full", m.isBlocked ? "bg-coral" : m.status === "available" ? "bg-signal" : "bg-amber")} />
                {m.isBlocked ? "Blocked" : m.status === "available" ? "Free" : "Busy"}
              </span>
              <button
                onClick={(e) => toggleBlock(m._id, m.isBlocked, e)}
                className={clsx(
                  "text-xs flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-colors",
                  m.isBlocked ? "text-signal border-signal/30 hover:bg-signal/10" : "text-coral border-coral/30 hover:bg-coral/10"
                )}
              >
                {m.isBlocked ? <CheckCircle2 size={12} /> : <Ban size={12} />}
                {m.isBlocked ? "Unblock" : "Block"}
              </button>
            </div>
          </Link>
        ))}
        {members.length === 0 && <p className="text-mute text-sm">No members yet — add your first one.</p>}
      </div>

      <AddMemberModal open={modalOpen} onClose={() => setModalOpen(false)} onCreated={load} />
    </div>
  );
}
