"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Image as ImageIcon, Figma, File, Check, Clock, Pencil, Trash2, Users } from "lucide-react";
import { format, isPast, formatDistanceToNowStrict } from "date-fns";
import clsx from "clsx";
import toast from "react-hot-toast";

const iconFor: Record<string, any> = { pdf: FileText, doc: FileText, image: ImageIcon, figma: Figma, other: File };
const priorityColor: Record<string, string> = { low: "text-mute border-line", medium: "text-amber border-amber/30", high: "text-coral border-coral/30" };

export default function TaskCard({
  task,
  canFinish,
  canManage,
  onChanged,
  onEdit
}: {
  task: any;
  canFinish?: boolean;
  canManage?: boolean;
  onChanged?: () => void;
  onEdit?: (task: any) => void;
}) {
  const [busy, setBusy] = useState(false);
  const overdue = task.status === "pending" && isPast(new Date(task.deadline));

  async function finish() {
    setBusy(true);
    const res = await fetch(`/api/tasks/${task._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "completed" })
    });
    setBusy(false);
    if (res.ok) {
      toast.success("Marked as finished. Admin's been notified.");
      onChanged?.();
    } else {
      toast.error("Couldn't update the task. Try again.");
    }
  }

  async function remove() {
    if (!confirm(`Delete "${task.title}"? This can't be undone.`)) return;
    const res = await fetch(`/api/tasks/${task._id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Task deleted.");
      onChanged?.();
    } else toast.error("Couldn't delete the task.");
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-panel border border-line rounded-xl p-5 hover:border-signal/30 transition-colors flex flex-col"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className={clsx("text-[10px] font-mono uppercase tracking-wide px-2 py-0.5 rounded border", priorityColor[task.priority])}>
              {task.priority}
            </span>
            {task.status === "completed" ? (
              <span className="text-[10px] font-mono uppercase tracking-wide px-2 py-0.5 rounded border text-signal border-signal/30">Done</span>
            ) : overdue ? (
              <span className="text-[10px] font-mono uppercase tracking-wide px-2 py-0.5 rounded border text-coral border-coral/30">Overdue</span>
            ) : null}
            {task.groupName && (
              <span className="text-[10px] font-mono uppercase tracking-wide px-2 py-0.5 rounded border border-line flex items-center gap-1" style={{ color: "#7C9CF5" }}>
                <Users size={10} /> {task.groupName}
              </span>
            )}
          </div>
          <h3 className="font-display text-lg text-paper truncate">{task.title}</h3>
        </div>
        {canManage && (
          <div className="flex items-center gap-1 shrink-0">
            <button type="button" onClick={() => onEdit?.(task)} className="p-1.5 text-mute hover:text-paper hover:bg-panel2 rounded"><Pencil size={14} /></button>
            <button type="button" onClick={remove} className="p-1.5 text-mute hover:text-coral hover:bg-panel2 rounded"><Trash2 size={14} /></button>
          </div>
        )}
      </div>

      {task.description && <p className="text-sm text-mute mt-2 leading-relaxed line-clamp-3">{task.description}</p>}

      <div className="flex items-center gap-2 text-xs text-mute mt-3 font-mono">
        <Clock size={13} />
        {task.status === "completed" ? (
          <span>Finished {task.completedAt ? format(new Date(task.completedAt), "MMM d, HH:mm") : ""}</span>
        ) : (
          <span className={overdue ? "text-coral" : ""}>
            Due {format(new Date(task.deadline), "MMM d, HH:mm")} · {formatDistanceToNowStrict(new Date(task.deadline), { addSuffix: true })}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-line/60 gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="flex -space-x-2 shrink-0">
            {(task.assignees || []).slice(0, 4).map((a: any) => (
              <div
                key={a._id}
                title={a.name}
                className="w-6 h-6 rounded-full flex items-center justify-center text-ink text-[10px] font-medium border-2 border-panel overflow-hidden"
                style={{ background: a.avatarColor || "#E8342B" }}
              >
                {a.avatarUrl ? <img src={a.avatarUrl} className="w-full h-full object-cover" alt="" /> : a.name?.[0]?.toUpperCase()}
              </div>
            ))}
          </div>
          <span className="text-xs text-mute truncate">
            {task.assignees?.length > 1 ? `${task.assignees.length} people` : task.assignees?.[0]?.name}
          </span>
        </div>
        {(task.attachments?.length > 0 || task.figmaLink) && (
          <div className="flex items-center gap-1.5 shrink-0">
            {task.attachments?.map((a: any, i: number) => {
              const Icon = iconFor[a.type] || File;
              return (
                <a key={i} href={a.url} target="_blank" rel="noreferrer" title={a.name}
                   className="w-7 h-7 rounded-md bg-panel2 border border-line flex items-center justify-center text-mute hover:text-signal hover:border-signal/30 transition-colors">
                  <Icon size={13} />
                </a>
              );
            })}
            {task.figmaLink && (
              <a href={task.figmaLink} target="_blank" rel="noreferrer" title="Figma file"
                 className="w-7 h-7 rounded-md bg-panel2 border border-line flex items-center justify-center text-mute hover:text-signal hover:border-signal/30 transition-colors">
                <Figma size={13} />
              </a>
            )}
          </div>
        )}
      </div>

      {canFinish && task.status === "pending" && (
        <button
          onClick={finish}
          disabled={busy}
          className="w-full mt-4 bg-signal/10 border border-signal/30 text-signal rounded-lg py-2.5 text-sm font-medium flex items-center justify-center gap-2 hover:bg-signal/20 transition-colors disabled:opacity-50"
        >
          <Check size={15} />
          {busy ? "Updating..." : "Finish work"}
        </button>
      )}
    </motion.div>
  );
}
