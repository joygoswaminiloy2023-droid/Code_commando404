"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus } from "lucide-react";
import ProjectFormModal from "@/components/ProjectFormModal";
import ProjectCard from "@/components/ProjectCard";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [pRes, uRes] = await Promise.all([fetch("/api/projects"), fetch("/api/users")]);
    if (pRes.ok) setProjects(await pRes.json());
    if (uRes.ok) setMembers(await uRes.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl text-paper">Projects</h1>
          <p className="text-mute text-sm mt-1">Every project, its team, and its status.</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="bg-signal text-ink font-medium rounded-lg px-4 py-2.5 flex items-center justify-center gap-2 hover:bg-signal2 transition-colors text-sm"
        >
          <Plus size={16} />
          New project
        </button>
      </div>

      {loading ? (
        <p className="text-mute text-sm">Loading...</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => (
            <ProjectCard key={p._id} project={p} href={`/dashboard/admin/projects/${p._id}`} />
          ))}
          {projects.length === 0 && <p className="text-mute text-sm">No projects yet — create your first one.</p>}
        </div>
      )}

      <ProjectFormModal open={modalOpen} onClose={() => setModalOpen(false)} members={members} onSaved={load} />
    </div>
  );
}
