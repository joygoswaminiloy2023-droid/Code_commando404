"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, Link2, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import clsx from "clsx";

function typeFromName(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  if (ext === "pdf") return "pdf";
  if (["doc", "docx"].includes(ext)) return "doc";
  if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)) return "image";
  return "other";
}

export default function ResourceModal({
  open,
  onClose,
  projectId,
  onSaved
}: {
  open: boolean;
  onClose: () => void;
  projectId: string;
  onSaved: () => void;
}) {
  const [mode, setMode] = useState<"file" | "link">("file");
  const [file, setFile] = useState<File | null>(null);
  const [linkForm, setLinkForm] = useState({ name: "", url: "" });
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setFile(null);
    setLinkForm({ name: "", url: "" });
    setMode("file");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (mode === "file") {
        if (!file) {
          toast.error("Choose a file from your PC first.");
          return;
        }
        const fd = new FormData();
        fd.append("file", file);
        const uploadRes = await fetch("/api/upload", { method: "POST", body: fd });
        if (!uploadRes.ok) {
          toast.error("Upload failed.");
          return;
        }
        const uploaded = await uploadRes.json();
        const res = await fetch(`/api/projects/${projectId}/resources`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kind: "file", name: uploaded.name, url: uploaded.url, fileType: uploaded.type })
        });
        if (!res.ok) {
          const d = await res.json();
          toast.error(d.error || "Could not save the file.");
          return;
        }
        toast.success("File uploaded — visible to the whole project now.");
      } else {
        if (!linkForm.name.trim() || !linkForm.url.trim()) {
          toast.error("Give the link a name and a URL.");
          return;
        }
        const fileType = linkForm.url.includes("figma.com") ? "figma" : "link";
        const res = await fetch(`/api/projects/${projectId}/resources`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kind: "link", name: linkForm.name, url: linkForm.url, fileType })
        });
        if (!res.ok) {
          const d = await res.json();
          toast.error(d.error || "Could not save the link.");
          return;
        }
        toast.success("Link added — visible to the whole project now.");
      }
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
            className="bg-panel border border-line rounded-xl2 p-6 w-full max-w-sm"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-xl text-paper">Add to project</h2>
              <button type="button" onClick={onClose} className="text-mute hover:text-paper"><X size={18} /></button>
            </div>

            <div className="flex gap-2 mb-5 bg-ink border border-line rounded-lg p-1">
              <button type="button" onClick={() => setMode("file")}
                className={clsx("flex-1 py-2 rounded-md text-xs font-mono uppercase tracking-wide transition-colors", mode === "file" ? "bg-signal text-ink" : "text-mute hover:text-paper")}>
                Upload file
              </button>
              <button type="button" onClick={() => setMode("link")}
                className={clsx("flex-1 py-2 rounded-md text-xs font-mono uppercase tracking-wide transition-colors", mode === "link" ? "bg-signal text-ink" : "text-mute hover:text-paper")}>
                Add link
              </button>
            </div>

            {mode === "file" ? (
              <label className="flex items-center gap-2 border border-dashed border-line rounded-lg px-4 py-6 text-sm text-mute cursor-pointer hover:border-signal/40 hover:text-signal transition-colors justify-center text-center">
                <Upload size={16} />
                {file ? file.name : "Click to choose a PDF, DOC, or image from your PC"}
                <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              </label>
            ) : (
              <>
                <label className="block text-xs font-mono uppercase tracking-wide text-mute mb-2">Link title</label>
                <input
                  value={linkForm.name}
                  onChange={(e) => setLinkForm({ ...linkForm, name: e.target.value })}
                  placeholder="Figma design file"
                  className="w-full bg-ink border border-line rounded-lg px-4 py-2.5 text-paper mb-4 focus-ring outline-none text-sm"
                />
                <label className="block text-xs font-mono uppercase tracking-wide text-mute mb-2">URL</label>
                <div className="relative">
                  <Link2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-mute" />
                  <input
                    value={linkForm.url}
                    onChange={(e) => setLinkForm({ ...linkForm, url: e.target.value })}
                    placeholder="https://figma.com/file/..."
                    className="w-full bg-ink border border-line rounded-lg pl-9 pr-4 py-2.5 text-paper mb-4 focus-ring outline-none text-sm"
                  />
                </div>
              </>
            )}

            <button
              disabled={submitting}
              className="w-full mt-2 bg-signal text-ink font-medium rounded-lg py-2.5 flex items-center justify-center gap-2 hover:bg-signal2 transition-colors disabled:opacity-60 text-sm"
            >
              {submitting && <Loader2 size={14} className="animate-spin" />}
              {submitting ? "Saving..." : "Add to project"}
            </button>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
