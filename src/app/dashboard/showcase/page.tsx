"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Plus, ExternalLink, Github, Trash2, ImageOff } from "lucide-react";
import toast from "react-hot-toast";
import ShowcaseFormModal from "@/components/ShowcaseFormModal";

export default function ShowcasePage() {
  const { data: session } = useSession();
  const me = session?.user as any;
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/showcase");
    if (res.ok) setProjects(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function remove(id: string) {
    if (!confirm("Remove this from the showcase?")) return;
    const res = await fetch(`/api/showcase/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Removed.");
      load();
    } else toast.error("Couldn't remove that.");
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl text-paper">Showcase</h1>
          <p className="text-mute text-sm mt-1">Projects the team has actually shipped.</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="bg-signal text-ink font-medium rounded-lg px-4 py-2.5 flex items-center justify-center gap-2 hover:bg-signal2 transition-colors text-sm"
        >
          <Plus size={16} />
          Add project
        </button>
      </div>

      {loading ? (
        <p className="text-mute text-sm">Loading...</p>
      ) : projects.length === 0 ? (
        <p className="text-mute text-sm">Nothing here yet — add the first shipped project.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((p) => {
            const canManage = me && (me.role === "admin" || p.addedBy?._id === me.id);
            return (
              <div key={p._id} className="bg-panel border border-line rounded-xl2 overflow-hidden flex flex-col">
                <div className="aspect-video bg-panel2 flex items-center justify-center">
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.title} className="w-full h-full object-cover" />
                  ) : (
                    <ImageOff size={22} className="text-mute" />
                  )}
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="font-display text-lg text-paper mb-1">{p.title}</h3>
                  {p.description && <p className="text-sm text-mute leading-relaxed mb-3 line-clamp-3">{p.description}</p>}
                  <div className="flex items-center justify-between mt-auto pt-3 border-t border-line/60">
                    <div className="flex items-center gap-2">
                      {p.liveUrl && (
                        <a href={p.liveUrl} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-md bg-panel2 border border-line flex items-center justify-center text-mute hover:text-signal hover:border-signal/30 transition-colors">
                          <ExternalLink size={13} />
                        </a>
                      )}
                      {p.githubUrl && (
                        <a href={p.githubUrl} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-md bg-panel2 border border-line flex items-center justify-center text-mute hover:text-signal hover:border-signal/30 transition-colors">
                          <Github size={13} />
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-mute font-mono truncate max-w-[100px]">{p.addedBy?.name}</span>
                      {canManage && (
                        <button onClick={() => remove(p._id)} className="text-mute hover:text-coral p-1">
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ShowcaseFormModal open={modalOpen} onClose={() => setModalOpen(false)} onSaved={load} />
    </div>
  );
}
