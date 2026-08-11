"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Plus, Users, FolderOpen, ListChecks, Settings, Trash2, UserX, UserCheck, ArrowLeft, Trophy } from "lucide-react";
import clsx from "clsx";
import toast from "react-hot-toast";
import TaskCard from "@/components/TaskCard";
import TaskFormModal from "@/components/TaskFormModal";
import GroupFormModal from "@/components/GroupFormModal";
import ResourceModal from "@/components/ResourceModal";
import ResourceList from "@/components/ResourceList";
import ProjectFormModal from "@/components/ProjectFormModal";
import MemberPicker from "@/components/MemberPicker";
import ProjectLeaderboard from "@/components/ProjectLeaderboard";

const TABS = [
  { id: "tasks", label: "Tasks", icon: ListChecks },
  { id: "team", label: "Team & groups", icon: Users },
  { id: "leaderboard", label: "Leaderboard", icon: Trophy },
  { id: "files", label: "Files & links", icon: FolderOpen },
  { id: "settings", label: "Settings", icon: Settings }
];

export default function AdminProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [project, setProject] = useState<any>(null);
  const [allMembers, setAllMembers] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [tab, setTab] = useState("tasks");
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<any>(null);
  const [resourceModalOpen, setResourceModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [pRes, uRes, tRes] = await Promise.all([
      fetch(`/api/projects/${id}`),
      fetch("/api/users"),
      fetch(`/api/tasks?project=${id}`)
    ]);
    if (pRes.ok) setProject(await pRes.json());
    if (uRes.ok) setAllMembers(await uRes.json());
    if (tRes.ok) setTasks(await tRes.json());
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function deleteProject() {
    if (!confirm(`Delete "${project.name}"? All its tasks, files and links go with it.`)) return;
    const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Project deleted.");
      router.push("/dashboard/admin/projects");
    } else toast.error("Couldn't delete the project.");
  }

  async function deleteGroup(groupId: string) {
    if (!confirm("Delete this group?")) return;
    const res = await fetch(`/api/projects/${id}/groups/${groupId}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Group deleted.");
      load();
    } else toast.error("Couldn't delete the group.");
  }

  async function toggleMember(userId: string, add: boolean) {
    const currentIds = project.members.map((m: any) => m._id);
    const nextIds = add ? [...currentIds, userId] : currentIds.filter((x: string) => x !== userId);
    const res = await fetch(`/api/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ members: nextIds })
    });
    if (res.ok) {
      toast.success(add ? "Added to project." : "Removed from project.");
      load();
    } else toast.error("Couldn't update project members.");
  }

  if (loading || !project) {
    return <p className="text-mute text-sm">Loading...</p>;
  }

  const pending = tasks.filter((t) => t.status === "pending");
  const completed = tasks.filter((t) => t.status === "completed");
  const nonMembers = allMembers.filter((m) => !project.members.some((pm: any) => pm._id === m._id));

  return (
    <div>
      <button onClick={() => router.push("/dashboard/admin/projects")} className="flex items-center gap-1.5 text-mute hover:text-paper text-sm mb-4">
        <ArrowLeft size={14} /> All projects
      </button>

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-display text-2xl sm:text-3xl text-paper truncate">{project.name}</h1>
            <span className="text-[10px] font-mono uppercase tracking-wide px-2 py-0.5 rounded border text-signal border-signal/30 shrink-0">
              {project.status}
            </span>
          </div>
          {project.description && <p className="text-mute text-sm mt-1 max-w-2xl">{project.description}</p>}
        </div>
        <button
          onClick={deleteProject}
          className="flex items-center gap-2 text-coral text-sm px-3 py-2 rounded-lg hover:bg-coral/10 transition-colors shrink-0"
        >
          <Trash2 size={14} /> Delete project
        </button>
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
          <div className="flex items-center justify-end mb-4">
            <button
              onClick={() => { setEditingTask(null); setTaskModalOpen(true); }}
              className="bg-signal text-ink font-medium rounded-lg px-4 py-2.5 flex items-center gap-2 hover:bg-signal2 transition-colors text-sm"
            >
              <Plus size={16} /> Assign task
            </button>
          </div>
          <h3 className="font-display text-base text-paper mb-3">Open ({pending.length})</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {pending.map((t) => (
              <TaskCard key={t._id} task={t} canManage onChanged={load} onEdit={(tk) => { setEditingTask(tk); setTaskModalOpen(true); }} />
            ))}
            {pending.length === 0 && <p className="text-mute text-sm">No open tasks.</p>}
          </div>
          <h3 className="font-display text-base text-paper mb-3">Completed ({completed.length})</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {completed.map((t) => (
              <TaskCard key={t._id} task={t} canManage onChanged={load} onEdit={(tk) => { setEditingTask(tk); setTaskModalOpen(true); }} />
            ))}
            {completed.length === 0 && <p className="text-mute text-sm">Nothing finished yet.</p>}
          </div>
        </div>
      )}

      {tab === "team" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-panel border border-line rounded-xl2 p-5">
            <h3 className="font-display text-base text-paper mb-4">Project members ({project.members.length})</h3>
            <div className="space-y-2 mb-5">
              {project.members.map((m: any) => (
                <div key={m._id} className="flex items-center justify-between bg-panel2 border border-line rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-ink text-xs font-medium shrink-0 overflow-hidden" style={{ background: m.avatarColor }}>
                      {m.avatarUrl ? <img src={m.avatarUrl} className="w-full h-full object-cover" alt="" /> : m.name[0].toUpperCase()}
                    </div>
                    <span className="text-sm text-paper truncate">{m.name}</span>
                  </div>
                  <button onClick={() => toggleMember(m._id, false)} className="text-mute hover:text-coral p-1"><UserX size={14} /></button>
                </div>
              ))}
              {project.members.length === 0 && <p className="text-mute text-xs">No members added yet.</p>}
            </div>
            <h4 className="text-xs font-mono uppercase tracking-wide text-mute mb-2">Add from team</h4>
            <div className="max-h-48 overflow-y-auto border border-line rounded-lg divide-y divide-line/60">
              {nonMembers.map((m) => (
                <button key={m._id} onClick={() => toggleMember(m._id, true)} className="w-full flex items-center justify-between px-3 py-2 text-sm text-paper hover:bg-panel2 transition-colors">
                  <span className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-ink text-[10px] font-medium overflow-hidden" style={{ background: m.avatarColor }}>
                      {m.avatarUrl ? <img src={m.avatarUrl} className="w-full h-full object-cover" alt="" /> : m.name[0].toUpperCase()}
                    </div>
                    {m.name}
                  </span>
                  <UserCheck size={14} className="text-mute" />
                </button>
              ))}
              {nonMembers.length === 0 && <p className="text-mute text-xs px-3 py-2">Everyone on the team is already in this project.</p>}
            </div>
          </div>

          <div className="bg-panel border border-line rounded-xl2 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-base text-paper">Groups ({project.groups.length})</h3>
              <button
                onClick={() => { setEditingGroup(null); setGroupModalOpen(true); }}
                className="text-xs bg-signal/10 border border-signal/30 text-signal rounded-lg px-3 py-1.5 flex items-center gap-1.5 hover:bg-signal/20 transition-colors"
              >
                <Plus size={13} /> New group
              </button>
            </div>
            <div className="space-y-2">
              {project.groups.map((g: any) => (
                <div key={g._id} className="bg-panel2 border border-line rounded-lg px-3 py-2.5">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-paper font-medium">{g.name}</span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => { setEditingGroup(g); setGroupModalOpen(true); }} className="text-xs text-mute hover:text-signal">Edit</button>
                      <button onClick={() => deleteGroup(g._id)} className="text-xs text-mute hover:text-coral">Delete</button>
                    </div>
                  </div>
                  <div className="flex -space-x-2">
                    {g.members.map((m: any) => (
                      <div key={m._id} title={m.name} className="w-6 h-6 rounded-full flex items-center justify-center text-ink text-[10px] font-medium border-2 border-panel2 overflow-hidden" style={{ background: m.avatarColor }}>
                        {m.avatarUrl ? <img src={m.avatarUrl} className="w-full h-full object-cover" alt="" /> : m.name[0].toUpperCase()}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {project.groups.length === 0 && <p className="text-mute text-xs">No groups yet — group 2+ members to assign them the same task at once.</p>}
            </div>
          </div>
        </div>
      )}

      {tab === "leaderboard" && <ProjectLeaderboard projectId={id} />}

      {tab === "files" && (
        <div className="bg-panel border border-line rounded-xl2 p-5 max-w-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-base text-paper">Shared files & links</h3>
            <button
              onClick={() => setResourceModalOpen(true)}
              className="text-xs bg-signal/10 border border-signal/30 text-signal rounded-lg px-3 py-1.5 flex items-center gap-1.5 hover:bg-signal/20 transition-colors"
            >
              <Plus size={13} /> Add
            </button>
          </div>
          <ResourceList resources={project.resources} projectId={id} canManage onChanged={load} />
        </div>
      )}

      {tab === "settings" && (
        <div className="bg-panel border border-line rounded-xl2 p-5 max-w-md">
          <h3 className="font-display text-base text-paper mb-4">Project settings</h3>
          <p className="text-mute text-sm mb-4">Rename the project, change its description, status or color.</p>
          <button
            onClick={() => setSettingsModalOpen(true)}
            className="bg-signal text-ink font-medium rounded-lg px-4 py-2.5 text-sm hover:bg-signal2 transition-colors"
          >
            Edit project details
          </button>
        </div>
      )}

      <TaskFormModal
        open={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        project={project}
        task={editingTask}
        onSaved={load}
      />
      <GroupFormModal
        open={groupModalOpen}
        onClose={() => setGroupModalOpen(false)}
        projectId={id}
        members={project.members}
        group={editingGroup}
        onSaved={load}
      />
      <ResourceModal open={resourceModalOpen} onClose={() => setResourceModalOpen(false)} projectId={id} onSaved={load} />
      <ProjectFormModal open={settingsModalOpen} onClose={() => setSettingsModalOpen(false)} members={allMembers} project={project} onSaved={load} />
    </div>
  );
}