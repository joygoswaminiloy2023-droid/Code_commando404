"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Calendar } from "lucide-react";
import toast from "react-hot-toast";
import DatePicker from "react-datepicker";
import MemberPicker from "@/components/MemberPicker";

export default function MeetingFormModal({
  open,
  onClose,
  projectId,
  members,
  meeting,
  onSaved
}: {
  open: boolean;
  onClose: () => void;
  projectId: string;
  members: any[];
  meeting?: any;
  onSaved: () => void;
}) {
  const isEdit = !!meeting;
  const [form, setForm] = useState({ title: "", topic: "" });
  const [scheduledAt, setScheduledAt] = useState<Date | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm({
      title: meeting?.title || "",
      topic: meeting?.topic || ""
    });
    setScheduledAt(meeting?.scheduledAt ? new Date(meeting.scheduledAt) : null);
    setSelected(meeting ? (meeting.attendees || []).map((a: any) => a._id || a) : members.map((m) => m._id));
  }, [open, meeting, members]);

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !scheduledAt || selected.length === 0) {
      toast.error("Title, date/time, and at least one attendee are required.");
      return;
    }
    setSubmitting(true);
    try {
      const url = isEdit ? `/api/meetings/${meeting._id}` : "/api/meetings";
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          scheduledAt: scheduledAt.toISOString(),
          project: projectId,
          attendees: selected
        })
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Could not save the meeting.");
        return;
      }
      toast.success(isEdit ? "Meeting updated." : "Meeting scheduled — attendees notified.");
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
              <h2 className="font-display text-xl text-paper">{isEdit ? "Edit meeting" : "Schedule a meeting"}</h2>
              <button type="button" onClick={onClose} className="text-mute hover:text-paper"><X size={18} /></button>
            </div>

            <label className="block text-xs font-mono uppercase tracking-wide text-mute mb-2">Title</label>
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full bg-ink border border-line rounded-lg px-4 py-2.5 text-paper mb-4 focus-ring outline-none text-sm"
              placeholder="Sprint planning"
            />

            <label className="block text-xs font-mono uppercase tracking-wide text-mute mb-2">Topic / agenda</label>
            <textarea
              value={form.topic}
              onChange={(e) => setForm({ ...form, topic: e.target.value })}
              rows={3}
              className="w-full bg-ink border border-line rounded-lg px-4 py-2.5 text-paper mb-4 focus-ring outline-none text-sm resize-none"
              placeholder="What's on the agenda."
            />

            <label className="block text-xs font-mono uppercase tracking-wide text-mute mb-2">Date & time</label>
            <div className="relative mb-4">
              <DatePicker
                selected={scheduledAt}
                onChange={(date) => setScheduledAt(date)}
                showTimeSelect
                timeIntervals={15}
                timeFormat="h:mm aa"
                dateFormat="MMM d, yyyy — h:mm aa"
                minDate={new Date()}
                placeholderText="Select date & time"
                className="w-full bg-ink border border-line rounded-lg pl-10 pr-3 py-2.5 text-paper text-sm focus-ring outline-none cursor-pointer"
                calendarClassName="meeting-datepicker"
                popperPlacement="bottom-start"
                autoComplete="off"
              />
              <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-mute pointer-events-none" />
            </div>

            <label className="block text-xs font-mono uppercase tracking-wide text-mute mb-2">
              Attendees ({selected.length} selected) — they'll get reminders 2 days, 1 day and 1 hour before
            </label>
            <MemberPicker members={members} selected={selected} onToggle={toggle} emptyLabel="Add project members first." />

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-5 bg-signal text-ink font-medium rounded-lg py-3 flex items-center justify-center gap-2 hover:bg-signal2 transition-colors disabled:opacity-60 text-sm"
            >
              {submitting && <Loader2 size={15} className="animate-spin" />}
              {submitting ? "Saving..." : isEdit ? "Save changes" : "Schedule meeting"}
            </button>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}