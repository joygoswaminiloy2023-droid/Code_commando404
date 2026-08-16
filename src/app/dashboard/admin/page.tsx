"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Plus, ArrowRight } from "lucide-react";
import ProjectFormModal from "@/components/ProjectFormModal";
import ProjectCard from "@/components/ProjectCard";
import AnalyticsChart from "@/components/AnalyticsChart";
import FreeBusyList from "@/components/FreeBusyList";
import AnnouncementFeed from "@/components/AnnouncementFeed";
import ActivityTicker from "@/components/ActivityTicker";

export default function AdminOverview() {
  const { data: session } = useSession();
  const [tasks, setTasks] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [tRes, uRes, pRes] = await Promise.all([fetch("/api/tasks"), fetch("/api/users"), fetch("/api/projects")]);
    if (tRes.ok) setTasks(await tRes.json());
    if (uRes.ok) setMembers(await uRes.json());
    if (pRes.ok) setProjects(await pRes.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const pending = tasks.filter((t) => t.status === "pending");
  const overdue = pending.filter((t) => new Date(t.deadline) < new Date());
  const completedToday = tasks.filter(
    (t) => t.status === "completed" && t.completedAt && new Date(t.completedAt).toDateString() === new Date().toDateString()
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl text-paper">Overview</h1>
          <p className="text-mute text-sm mt-1">Everything moving across every project, live.</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="bg-signal text-ink font-medium rounded-lg px-4 py-2.5 flex items-center justify-center gap-2 hover:bg-signal2 transition-colors text-sm"
        >
          <Plus size={16} />
          New project
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Open tasks" value={pending.length} accent="text-paper" />
        <StatCard label="Overdue" value={overdue.length} accent="text-coral" />
        <StatCard label="Finished today" value={completedToday.length} accent="text-signal" />
        <StatCard label="Projects" value={projects.length} accent="text-paper" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-panel border border-line rounded-xl2 p-6">
          <h2 className="font-display text-lg text-paper mb-4">Completion by member</h2>
          <AnalyticsChart tasks={tasks} />
        </div>
        <div className="bg-panel border border-line rounded-xl2 p-6">
          <h2 className="font-display text-lg text-paper mb-4">Who's free</h2>
          <FreeBusyList members={members} />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-panel border border-line rounded-xl2 p-6">
          <h2 className="font-display text-lg text-paper mb-4">Live activity</h2>
          <ActivityTicker userId={(session?.user as any)?.id} />
        </div>
        <div className="lg:col-span-2 bg-panel border border-line rounded-xl2 p-6">
          <h2 className="font-display text-lg text-paper mb-4">Announcements</h2>
          <AnnouncementFeed canPost userId={(session?.user as any)?.id} />
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg text-paper">Projects</h2>
        <Link href="/dashboard/admin/projects" className="text-xs text-signal hover:underline flex items-center gap-1">
          View all <ArrowRight size={12} />
        </Link>
      </div>
      {loading ? (
        <p className="text-mute text-sm">Loading...</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.slice(0, 6).map((p) => (
            <ProjectCard key={p._id} project={p} href={`/dashboard/admin/projects/${p._id}`} />
          ))}
          {projects.length === 0 && <p className="text-mute text-sm">No projects yet — create the first one.</p>}
        </div>
      )}

      <ProjectFormModal open={modalOpen} onClose={() => setModalOpen(false)} members={members} onSaved={load} />
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="bg-panel border border-line rounded-xl2 p-5">
      <div className={`font-display text-3xl font-mono-num ${accent}`}>{value}</div>
      <div className="text-mute text-xs mt-1 font-mono uppercase tracking-wide">{label}</div>
    </div>
  );
}
