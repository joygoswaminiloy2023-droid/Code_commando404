"use client";

import { useState } from "react";
import { FileText, Image as ImageIcon, Figma, Link2, File, Pencil, Trash2, Check, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";

const iconFor: Record<string, any> = { pdf: FileText, doc: FileText, image: ImageIcon, figma: Figma, link: Link2, other: File };

export default function ResourceList({
  resources,
  projectId,
  canManage,
  onChanged
}: {
  resources: any[];
  projectId: string;
  canManage: boolean;
  onChanged: () => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  async function saveEdit(id: string) {
    if (!editName.trim()) return;
    const res = await fetch(`/api/projects/${projectId}/resources/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName })
    });
    if (res.ok) {
      toast.success("Renamed.");
      setEditingId(null);
      onChanged();
    } else toast.error("Couldn't rename that.");
  }

  async function remove(id: string) {
    if (!confirm("Remove this from the project? Everyone loses access to it.")) return;
    const res = await fetch(`/api/projects/${projectId}/resources/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Removed.");
      onChanged();
    } else toast.error("Couldn't remove that.");
  }

  if (resources.length === 0) {
    return <p className="text-mute text-sm py-6 text-center">Nothing shared here yet.</p>;
  }

  return (
    <div className="space-y-2">
      {resources.map((r) => {
        const Icon = iconFor[r.fileType] || File;
        const isEditing = editingId === r._id;
        return (
          <div key={r._id} className="flex items-center gap-3 bg-panel2 border border-line rounded-lg px-3 py-2.5">
            <div className="w-8 h-8 rounded-md bg-ink border border-line flex items-center justify-center text-signal shrink-0">
              <Icon size={14} />
            </div>
            {isEditing ? (
              <input
                autoFocus
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="flex-1 bg-ink border border-line rounded px-2 py-1 text-sm text-paper focus-ring outline-none min-w-0"
              />
            ) : (
              <a href={r.url} target="_blank" rel="noreferrer" className="flex-1 min-w-0">
                <div className="text-sm text-paper truncate hover:text-signal transition-colors">{r.name}</div>
                <div className="text-[11px] text-mute font-mono">
                  {r.uploadedBy?.name} · {formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}
                </div>
              </a>
            )}
            <div className="flex items-center gap-1 shrink-0">
              {isEditing ? (
                <>
                  <button type="button" onClick={() => saveEdit(r._id)} className="p-1.5 text-signal hover:bg-signal/10 rounded"><Check size={14} /></button>
                  <button type="button" onClick={() => setEditingId(null)} className="p-1.5 text-mute hover:bg-panel rounded"><X size={14} /></button>
                </>
              ) : canManage ? (
                <>
                  <button type="button" onClick={() => { setEditingId(r._id); setEditName(r.name); }} className="p-1.5 text-mute hover:text-paper hover:bg-panel rounded"><Pencil size={13} /></button>
                  <button type="button" onClick={() => remove(r._id)} className="p-1.5 text-mute hover:text-coral hover:bg-panel rounded"><Trash2 size={13} /></button>
                </>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
