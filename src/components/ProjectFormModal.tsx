"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import toast from "react-hot-toast";
import MemberPicker from "@/components/MemberPicker";

export default function ProjectFormModal({
  open,
  onClose,
  members,
  project,
  onSaved
}: {
  open: boolean;
  onClose: () => void;
  members: any[];
  project?: any;
  onSaved: () => void;
}) {
  const isEdit = !!project;
  const [form, setForm] = useState({ name: "", description: "", status: "active", color: "#E8342B", whatsappLink: "" });
  const [selected, setSelected] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({
        name: project?.name || "",
        description: project?.description || "",
        status: project?.status || "active",
        color: project?.color || "#E8342B",
        whatsappLink: project?.whatsappLink || ""
      });
      setSelected((project?.members || []).map((m: any) => m._id || m));
    }
  }, [open, project]);

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Give the project a name.");
      return;
    }
    setSubmitting(true);
    try {
      const url = isEdit ? `/api/projects/${project._id}` : "/api/projects";
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, members: selected })
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Could not save the project.");
        return;
      }
      toast.success(isEdit ? "Project updated." : "Project created.");
      onSaved();
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  const colors = ["#E8342B", "#F5B95B", "#FF7A45", "#7C9CF5", "#E17CF5"];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.form
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSubmit}
            className="bg-panel border border-line rounded-xl2 p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-xl text-paper">{isEdit ? "Edit project" : "New project"}</h2>
              <button type="button" onClick={onClose} className="text-mute hover:text-paper"><X size={18} /></button>
            </div>

            <label className="block text-xs font-mono uppercase tracking-wide text-mute mb-2">Project name</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full bg-ink border border-line rounded-lg px-4 py-2.5 text-paper mb-4 focus-ring outline-none text-sm"
              placeholder="Client website revamp"
            />

            <label className="block text-xs font-mono uppercase tracking-wide text-mute mb-2">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full bg-ink border border-line rounded-lg px-4 py-2.5 text-paper mb-4 focus-ring outline-none text-sm resize-none"
              placeholder="What this project is about."
            />

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wide text-mute mb-2">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full bg-ink border border-line rounded-lg px-3 py-2.5 text-paper text-sm focus-ring outline-none"
                >
                  <option value="planning">Planning</option>
                  <option value="active">Active</option>
                  <option value="on-hold">On hold</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-mono uppercase tracking-wide text-mute mb-2">Color tag</label>
                <div className="flex items-center gap-2 h-[42px]">
                  {colors.map((c) => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setForm({ ...form, color: c })}
                      className="w-6 h-6 rounded-full border-2 transition-transform"
                      style={{ background: c, borderColor: form.color === c ? "#EAF0F6" : "transparent", transform: form.color === c ? "scale(1.15)" : "scale(1)" }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <label className="block text-xs font-mono uppercase tracking-wide text-mute mb-2">
              WhatsApp group link <span className="normal-case text-mute/70">(optional)</span>
            </label>
            <input
              value={form.whatsappLink}
              onChange={(e) => setForm({ ...form, whatsappLink: e.target.value })}
              className="w-full bg-ink border border-line rounded-lg px-4 py-2.5 text-paper mb-4 focus-ring outline-none text-sm"
              placeholder="https://chat.whatsapp.com/..."
            />

            <label className="block text-xs font-mono uppercase tracking-wide text-mute mb-2">
              Project members ({selected.length} selected)
            </label>
            <MemberPicker members={members} selected={selected} onToggle={toggle} emptyLabel="Add team members first from the Team page." />

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-5 bg-signal text-ink font-medium rounded-lg py-3 hover:bg-signal2 transition-colors disabled:opacity-60 text-sm"
            >
              {submitting ? "Saving..." : isEdit ? "Save changes" : "Create project"}
            </button>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
