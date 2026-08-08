"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import toast from "react-hot-toast";
import MemberPicker from "@/components/MemberPicker";

export default function GroupFormModal({
  open,
  onClose,
  projectId,
  members,
  group,
  onSaved
}: {
  open: boolean;
  onClose: () => void;
  projectId: string;
  members: any[];
  group?: any;
  onSaved: () => void;
}) {
  const isEdit = !!group;
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setName(group?.name || "");
      setSelected((group?.members || []).map((m: any) => m._id || m));
    }
  }, [open, group]);

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || selected.length < 2) {
      toast.error("A group needs a name and at least 2 members.");
      return;
    }
    setSubmitting(true);
    try {
      const url = isEdit
        ? `/api/projects/${projectId}/groups/${group._id}`
        : `/api/projects/${projectId}/groups`;
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, members: selected })
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Could not save the group.");
        return;
      }
      toast.success(isEdit ? "Group updated." : "Group created.");
      onSaved();
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.form
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSubmit}
            className="bg-panel border border-line rounded-xl2 p-6 w-full max-w-sm"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-xl text-paper">{isEdit ? "Edit group" : "New group"}</h2>
              <button type="button" onClick={onClose} className="text-mute hover:text-paper"><X size={18} /></button>
            </div>

            <label className="block text-xs font-mono uppercase tracking-wide text-mute mb-2">Group name</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Frontend squad"
              className="w-full bg-ink border border-line rounded-lg px-4 py-2.5 text-paper mb-4 focus-ring outline-none text-sm"
            />

            <label className="block text-xs font-mono uppercase tracking-wide text-mute mb-2">
              Members ({selected.length} selected, min. 2)
            </label>
            <MemberPicker members={members} selected={selected} onToggle={toggle} emptyLabel="Add members to the project first." />

            <button
              disabled={submitting}
              className="w-full mt-5 bg-signal text-ink font-medium rounded-lg py-2.5 hover:bg-signal2 transition-colors disabled:opacity-60 text-sm"
            >
              {submitting ? "Saving..." : isEdit ? "Save group" : "Create group"}
            </button>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
