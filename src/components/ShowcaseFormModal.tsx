"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export default function ShowcaseFormModal({
  open,
  onClose,
  onSaved
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({ title: "", description: "", liveUrl: "", githubUrl: "" });
  const [image, setImage] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setForm({ title: "", description: "", liveUrl: "", githubUrl: "" });
    setImage(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Give the project a title.");
      return;
    }
    setSubmitting(true);
    try {
      let imageUrl = "";
      if (image) {
        const fd = new FormData();
        fd.append("file", image);
        const uploadRes = await fetch("/api/upload", { method: "POST", body: fd });
        if (uploadRes.ok) imageUrl = (await uploadRes.json()).url;
        else {
          toast.error("Image upload failed — saving without it.");
        }
      }
      const res = await fetch("/api/showcase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, imageUrl })
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Couldn't add that project.");
        return;
      }
      toast.success("Added to the showcase.");
      reset();
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
            className="bg-panel border border-line rounded-xl2 p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-xl text-paper">Add a project</h2>
              <button type="button" onClick={onClose} className="text-mute hover:text-paper"><X size={18} /></button>
            </div>

            <label className="block text-xs font-mono uppercase tracking-wide text-mute mb-2">Title</label>
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full bg-ink border border-line rounded-lg px-4 py-2.5 text-paper mb-4 focus-ring outline-none text-sm"
              placeholder="MediCare Connect"
            />

            <label className="block text-xs font-mono uppercase tracking-wide text-mute mb-2">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full bg-ink border border-line rounded-lg px-4 py-2.5 text-paper mb-4 focus-ring outline-none text-sm resize-none"
              placeholder="What it does, stack used, anything worth knowing."
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wide text-mute mb-2">Live link</label>
                <input
                  value={form.liveUrl}
                  onChange={(e) => setForm({ ...form, liveUrl: e.target.value })}
                  className="w-full bg-ink border border-line rounded-lg px-4 py-2.5 text-paper text-sm focus-ring outline-none"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-xs font-mono uppercase tracking-wide text-mute mb-2">GitHub link</label>
                <input
                  value={form.githubUrl}
                  onChange={(e) => setForm({ ...form, githubUrl: e.target.value })}
                  className="w-full bg-ink border border-line rounded-lg px-4 py-2.5 text-paper text-sm focus-ring outline-none"
                  placeholder="https://github.com/..."
                />
              </div>
            </div>

            <label className="block text-xs font-mono uppercase tracking-wide text-mute mb-2">Cover image</label>
            <label className="flex items-center gap-2 border border-dashed border-line rounded-lg px-4 py-6 text-sm text-mute cursor-pointer hover:border-signal/40 hover:text-signal transition-colors mb-2 justify-center text-center">
              <Upload size={16} />
              {image ? image.name : "Click to choose an image from your PC"}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => setImage(e.target.files?.[0] || null)} />
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-4 bg-signal text-ink font-medium rounded-lg py-3 flex items-center justify-center gap-2 hover:bg-signal2 transition-colors disabled:opacity-60"
            >
              {submitting && <Loader2 size={15} className="animate-spin" />}
              {submitting ? "Saving..." : "Add project"}
            </button>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}