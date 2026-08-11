"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, Users, FolderOpen, ListChecks, Trophy } from "lucide-react";
import clsx from "clsx";
import TaskCard from "@/components/TaskCard";
import ResourceList from "@/components/ResourceList";
import ProjectLeaderboard from "@/components/ProjectLeaderboard";

const POLL_MS = 20000;

const TABS = [
  { id: "tasks", label: "My tasks", icon: ListChecks },
  { id: "leaderboard", label: "Leaderboard", icon: Trophy },
  { id: "files", label: "Files & links", icon: FolderOpen },
  { id: "team", label: "Team", icon: Users }
];

export default function MemberProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id;
  const [project, setProject] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [tab, setTab] = useState("tasks");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [pRes, tRes] = await Promise.all([fetch(`/api/projects/${id}`), fetch(`/api/tasks?project=${id}`)]);
    if (pRes.ok) setProject(await pRes.json());
    if (tRes.ok) setTasks(await tRes.json());
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
    const timer = setInterval(load, POLL_MS);
    return () => clearInterval(timer);
  }, [load]);

  if (loading || !project) return <p className="text-mute text-sm">Loading...</p>;

  const pending = tasks.filter((t) => t.status === "pending");
  const completed = tasks.filter((t) => t.status === "completed");

  return (
    <div>
      <button onClick={() => router.push("/dashboard/user")} className="flex items-center gap-1.5 text-mute hover:text-paper text-sm mb-4">
        <ArrowLeft size={14} /> All projects
      </button>

      <div className="mb-6">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="font-display text-2xl sm:text-3xl text-paper">{project.name}</h1>
          <span className="text-[10px] font-mono uppercase tracking-wide px-2 py-0.5 rounded border text-signal border-signal/30">
            {project.status}
          </span>
        </div>
        {project.description && <p className="text-mute text-sm mt-1 max-w-2xl">{project.description}</p>}
      </div>

      <div className="flex gap-1 mb-6 border-b border-line overflow-x-auto">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={clsx(
                "flex items-center gap-2 px-4 py-2.5 text-sm whitespace-nowrap border-b-2 -mb-px transition-colors",
                tab === t.id ? "border-signal text-signal" : "border-transparent text-mute hover:text-paper"
              )}
            >
              <Icon size={14} /> {t.label}
            </button>
          );
        })}
      </div>

      {tab === "tasks" && (
        <div>
          <div className="bg-panel border border-line rounded-xl2 p-4 mb-6 flex items-center justify-between max-w-md">
            <div>
              <div className="text-sm text-paper font-medium">Your progress here</div>
              <div className="text-xs text-mute">{completed.length} of {tasks.length} tasks done</div>
            </div>
            <div className="w-12 h-12 rounded-full border-2 border-signal/30 flex items-center justify-center font-display text-signal text-sm">
              {tasks.length > 0 ? Math.round((completed.length / tasks.length) * 100) : 0}%
            </div>
          </div>
          <h3 className="font-display text-base text-paper mb-3">Open ({pending.length})</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {pending.map((t) => (
              <TaskCard key={t._id} task={t} canFinish onChanged={load} />
            ))}
            {pending.length === 0 && <p className="text-mute text-sm">Nothing open right now — you're all caught up.</p>}
          </div>
          <h3 className="font-display text-base text-paper mb-3">Finished ({completed.length})</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {completed.map((t) => (
              <TaskCard key={t._id} task={t} />
            ))}
            {completed.length === 0 && <p className="text-mute text-sm">Nothing finished yet.</p>}
          </div>
        </div>
      )}

      {tab === "leaderboard" && <ProjectLeaderboard projectId={id} />}

      {tab === "files" && (
        <div className="bg-panel border border-line rounded-xl2 p-5 max-w-2xl">
          <ResourceList resources={project.resources} projectId={id} canManage={false} onChanged={load} />
        </div>
      )}

      {tab === "team" && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-3xl">
          {project.members.map((m: any) => (
            <div key={m._id} className="flex items-center gap-3 bg-panel border border-line rounded-xl p-4">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-ink text-xs font-medium shrink-0 overflow-hidden" style={{ background: m.avatarColor }}>
                {m.avatarUrl ? <img src={m.avatarUrl} className="w-full h-full object-cover" alt="" /> : m.name[0].toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="text-sm text-paper truncate">{m.name}</div>
                <div className="text-xs text-mute truncate">{m.title}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}