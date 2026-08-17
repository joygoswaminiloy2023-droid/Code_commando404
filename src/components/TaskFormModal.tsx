"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, Loader2, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import clsx from "clsx";
import DatePicker from "react-datepicker";
import MemberPicker from "@/components/MemberPicker";

export default function TaskFormModal({
  open,
  onClose,
  project,
  task,
  onSaved
}: {
  open: boolean;
  onClose: () => void;
  project: any;
  task?: any;
  onSaved: () => void;
}) {
  const isEdit = !!task;
  const [mode, setMode] = useState<"individuals" | "group">("individuals");
  const [selected, setSelected] = useState<string[]>([]);
  const [groupId, setGroupId] = useState("");
  // deadline is now a real Date object (or null), not a text string —
  // this is what lets us drop the naive-string timezone problem entirely.
  const [form, setForm] = useState<{
    title: string;
    description: string;
    deadline: Date | null;
    priority: string;
    figmaLink: string;
  }>({ title: "", description: "", deadline: null, priority: "medium", figmaLink: "" });
  const [existingAttachments, setExistingAttachments] = useState<any[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (task) {
      setForm({
        title: task.title || "",
        description: task.description || "",
        // task.deadline is a stored UTC ISO string — new Date(...) parses
        // it into an absolute instant, which the browser then always
        // displays/edits in the viewer's own local time. No manual
        // timezone math needed on this end.
        deadline: task.deadline ? new Date(task.deadline) : null,
        priority: task.priority || "medium",
        figmaLink: task.figmaLink || ""
      });
      setExistingAttachments(task.attachments || []);
      setNewFiles([]);
      if (task.groupName) {
        setMode("group");
        const g = (project?.groups || []).find((gr: any) => gr.name === task.groupName);
        setGroupId(g?._id || "");
      } else {
        setMode("individuals");
      }
      setSelected((task.assignees || []).map((a: any) => a._id || a));
    } else {
      setForm({ title: "", description: "", deadline: null, priority: "medium", figmaLink: "" });
      setExistingAttachments([]);
      setNewFiles([]);
      setSelected([]);
      setGroupId("");
      setMode("individuals");
    }
  }, [open, task, project]);

  function toggleMember(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.deadline) {
      toast.error("Pick a deadline.");
      return;
    }

    let assignees: string[] = [];
    let groupName = "";
    if (mode === "group") {
      const g = (project?.groups || []).find((gr: any) => gr._id === groupId);
      if (!g) {
        toast.error("Pick a group.");
        return;
      }
      assignees = g.members.map((m: any) => m._id || m);
      groupName = g.name;
    } else {
      assignees = selected;
      if (assignees.length === 0) {
        toast.error("Pick at least one person.");
        return;
      }
    }

    setSubmitting(true);
    try {
      const uploaded = [];
      for (const file of newFiles) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        if (res.ok) uploaded.push(await res.json());
      }
      const attachments = [...existingAttachments, ...uploaded];

      // form.deadline is a real Date, produced by react-datepicker from
      // the user's clicks — it's already anchored to the browser's local
      // timezone internally. .toISOString() turns it into an unambiguous
      // UTC instant before it leaves the client, so the server (running
      // in UTC) never has to guess an offset.
      const payload = {
        ...form,
        deadline: form.deadline.toISOString(),
        project: project?._id,
        assignees,
        groupName,
        attachments
      };
      const url = isEdit ? `/api/tasks/${task._id}` : "/api/tasks";
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Could not save the task.");
        return;
      }
      toast.success(isEdit ? "Task updated." : "Task assigned — they'll see it instantly.");
      onSaved();
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  const groups = project?.groups || [];
  const members = project?.members || [];

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
              <h2 className="font-display text-xl text-paper">{isEdit ? "Edit task" : "Assign a task"}</h2>
              <button type="button" onClick={onClose} className="text-mute hover:text-paper"><X size={18} /></button>
            </div>

            <label className="block text-xs font-mono uppercase tracking-wide text-mute mb-2">Title</label>
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full bg-ink border border-line rounded-lg px-4 py-2.5 text-paper mb-4 focus-ring outline-none text-sm"
              placeholder="Redesign the pricing page"
            />

            <label className="block text-xs font-mono uppercase tracking-wide text-mute mb-2">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full bg-ink border border-line rounded-lg px-4 py-2.5 text-paper mb-4 focus-ring outline-none text-sm resize-none"
              placeholder="What needs to happen and any context they'll need."
            />

            <div className="flex gap-2 mb-3 bg-ink border border-line rounded-lg p-1">
              <button type="button" onClick={() => setMode("individuals")}
                className={clsx("flex-1 py-2 rounded-md text-xs font-mono uppercase tracking-wide transition-colors", mode === "individuals" ? "bg-signal text-ink" : "text-mute hover:text-paper")}>
                Person / people
              </button>
              <button type="button" onClick={() => setMode("group")}
                className={clsx("flex-1 py-2 rounded-md text-xs font-mono uppercase tracking-wide transition-colors", mode === "group" ? "bg-signal text-ink" : "text-mute hover:text-paper")}>
                Team group
              </button>
            </div>

            {mode === "individuals" ? (
              <div className="mb-4">
                <label className="block text-xs font-mono uppercase tracking-wide text-mute mb-2">
                  Assign to ({selected.length} selected)
                </label>
                <MemberPicker members={members} selected={selected} onToggle={toggleMember} emptyLabel="Add members to this project first." />
              </div>
            ) : (
              <div className="mb-4">
                <label className="block text-xs font-mono uppercase tracking-wide text-mute mb-2">Group</label>
                {groups.length === 0 ? (
                  <p className="text-mute text-xs py-2">No groups yet — create one from the Team &amp; Groups tab first.</p>
                ) : (
                  <select
                    value={groupId}
                    onChange={(e) => setGroupId(e.target.value)}
                    className="w-full bg-ink border border-line rounded-lg px-3 py-2.5 text-paper text-sm focus-ring outline-none"
                  >
                    <option value="">Select group</option>
                    {groups.map((g: any) => (
                      <option key={g._id} value={g._id}>{g.name} ({g.members.length})</option>
                    ))}
                  </select>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wide text-mute mb-2">Deadline</label>
                <DatePicker
                  selected={form.deadline}
                  onChange={(date) => setForm({ ...form, deadline: date })}
                  showTimeSelect
                  timeIntervals={5}
                  dateFormat="MMM d, yyyy h:mm aa"
                  placeholderText="Select date & time"
                  calendarClassName="meeting-datepicker"
                  popperClassName="meeting-datepicker-popper"
                  // readOnly on the input blocks the keyboard entirely —
                  // the only way to set a value is by clicking a day/time
                  // in the popup calendar.
                  customInput={
                    <input readOnly className="deadline-input-trigger" />
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-mono uppercase tracking-wide text-mute mb-2">Priority</label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  className="w-full bg-ink border border-line rounded-lg px-3 py-2.5 text-paper text-sm focus-ring outline-none"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <label className="block text-xs font-mono uppercase tracking-wide text-mute mb-2">Figma link (optional)</label>
            <input
              value={form.figmaLink}
              onChange={(e) => setForm({ ...form, figmaLink: e.target.value })}
              className="w-full bg-ink border border-line rounded-lg px-4 py-2.5 text-paper mb-4 focus-ring outline-none text-sm"
              placeholder="https://figma.com/file/..."
            />

            {existingAttachments.length > 0 && (
              <div className="mb-3 space-y-1.5">
                <label className="block text-xs font-mono uppercase tracking-wide text-mute mb-1">Current files</label>
                {existingAttachments.map((a, i) => (
                  <div key={i} className="flex items-center justify-between bg-ink border border-line rounded-lg px-3 py-2 text-sm text-paper">
                    <span className="truncate">{a.name}</span>
                    <button type="button" onClick={() => setExistingAttachments((prev) => prev.filter((_, idx) => idx !== i))} className="text-mute hover:text-coral">
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <label className="block text-xs font-mono uppercase tracking-wide text-mute mb-2">
              Attach files (PDF, DOC, images)
            </label>
            <label className="flex items-center gap-2 border border-dashed border-line rounded-lg px-4 py-3 text-sm text-mute cursor-pointer hover:border-signal/40 hover:text-signal transition-colors mb-2">
              <Upload size={15} />
              {newFiles.length > 0 ? `${newFiles.length} new file(s) selected` : "Click to choose files"}
              <input
                type="file"
                multiple
                className="hidden"
                onChange={(e) => setNewFiles(Array.from(e.target.files || []))}
              />
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-4 bg-signal text-ink font-medium rounded-lg py-3 flex items-center justify-center gap-2 hover:bg-signal2 transition-colors disabled:opacity-60"
            >
              {submitting && <Loader2 size={15} className="animate-spin" />}
              {submitting ? "Saving..." : isEdit ? "Save changes" : "Assign task"}
            </button>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}