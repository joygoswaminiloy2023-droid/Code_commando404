"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Plus, Trash2, Pencil, Clock, NotebookPen, Check, Loader2 } from "lucide-react";
import { format, isPast } from "date-fns";
import toast from "react-hot-toast";
import MeetingFormModal from "@/components/MeetingFormModal";

function NotesField({ meeting, onSaved }: { meeting: any; onSaved: (updated: any) => void }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(meeting.notes || "");
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleChange(v: string) {
    setValue(v);
    setStatus("saving");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const res = await fetch(`/api/meetings/${meeting._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: v })
      });
      if (res.ok) {
        setStatus("saved");
        onSaved(await res.json());
      } else {
        toast.error("Couldn't save that note.");
      }
    }, 700);
  }

  return (
    <div className="mt-3 pt-3 border-t border-line/60">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 text-xs text-mute hover:text-signal transition-colors"
      >
        <NotebookPen size={12} />
        {open ? "Hide notes" : meeting.notes ? "View/edit notes" : "Add notes"}
        {status === "saving" && <Loader2 size={11} className="animate-spin ml-1" />}
        {status === "saved" && !open && <Check size={11} className="text-signal ml-1" />}
      </button>
      {open && (
        <textarea
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Meeting topic, agenda details, decisions made..."
          rows={4}
          className="w-full mt-2 bg-ink border border-line rounded-lg px-3 py-2.5 text-paper text-sm focus-ring outline-none resize-y"
        />
      )}
    </div>
  );
}

export default function MeetingList({
  projectId,
  members,
  canManage
}: {
  projectId: string;
  members: any[];
  canManage: boolean;
}) {
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/meetings?project=${projectId}`);
    if (res.ok) setMeetings(await res.json());
    setLoading(false);
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  function patchLocal(updated: any) {
    setMeetings((prev) => prev.map((m) => (m._id === updated._id ? updated : m)));
  }

  async function remove(id: string) {
    if (!confirm("Cancel this meeting? Attendees won't be reminded further.")) return;
    const res = await fetch(`/api/meetings/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Meeting cancelled.");
      load();
    } else toast.error("Couldn't cancel that meeting.");
  }

  if (loading) return <p className="text-mute text-sm">Loading...</p>;

  const upcoming = meetings.filter((m) => !isPast(new Date(m.scheduledAt)));
  const past = meetings.filter((m) => isPast(new Date(m.scheduledAt)));

  return (
    <div className="max-w-2xl">
      {canManage && (
        <div className="flex justify-end mb-4">
          <button
            onClick={() => { setEditing(null); setModalOpen(true); }}
            className="bg-signal text-ink font-medium rounded-lg px-4 py-2.5 flex items-center gap-2 hover:bg-signal2 transition-colors text-sm"
          >
            <Plus size={16} /> Schedule meeting
          </button>
        </div>
      )}

      <h3 className="font-display text-base text-paper mb-3">Upcoming ({upcoming.length})</h3>
      <div className="space-y-2 mb-8">
        {upcoming.map((m) => (
          <div key={m._id} className="bg-panel border border-line rounded-xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h4 className="font-display text-base text-paper truncate">{m.title}</h4>
                {m.topic && <p className="text-sm text-mute mt-0.5">{m.topic}</p>}
                <div className="flex items-center gap-1.5 text-xs text-mute font-mono mt-2">
                  <Clock size={12} /> {format(new Date(m.scheduledAt), "MMM d, yyyy · HH:mm")}
                </div>
                <div className="flex -space-x-2 mt-2">
                  {m.attendees.map((a: any) => (
                    <div key={a._id} title={a.name} className="w-6 h-6 rounded-full flex items-center justify-center text-ink text-[10px] font-medium border-2 border-panel overflow-hidden" style={{ background: a.avatarColor }}>
                      {a.avatarUrl ? <img src={a.avatarUrl} className="w-full h-full object-cover" alt="" /> : a.name[0].toUpperCase()}
                    </div>
                  ))}
                </div>
              </div>
              {canManage && (
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => { setEditing(m); setModalOpen(true); }} className="p-1.5 text-mute hover:text-paper hover:bg-panel2 rounded"><Pencil size={14} /></button>
                  <button onClick={() => remove(m._id)} className="p-1.5 text-mute hover:text-coral hover:bg-panel2 rounded"><Trash2 size={14} /></button>
                </div>
              )}
            </div>
            <NotesField meeting={m} onSaved={patchLocal} />
          </div>
        ))}
        {upcoming.length === 0 && <p className="text-mute text-sm">No meetings scheduled.</p>}
      </div>

      {past.length > 0 && (
        <>
          <h3 className="font-display text-base text-paper mb-3">Past ({past.length})</h3>
          <div className="space-y-2">
            {past.map((m) => (
              <div key={m._id} className="bg-panel border border-line rounded-xl p-4 opacity-80">
                <h4 className="font-display text-sm text-paper">{m.title}</h4>
                <div className="text-xs text-mute font-mono mt-1">{format(new Date(m.scheduledAt), "MMM d, yyyy · HH:mm")}</div>
                <NotesField meeting={m} onSaved={patchLocal} />
              </div>
            ))}
          </div>
        </>
      )}

      <MeetingFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        projectId={projectId}
        members={members}
        meeting={editing}
        onSaved={load}
      />
    </div>
  );
}