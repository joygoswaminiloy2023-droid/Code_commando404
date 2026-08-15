"use client";

import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Check, Loader2 } from "lucide-react";

export default function NotesPage() {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch("/api/notes").then((r) => r.json()).then((d) => {
      setContent(d.content || "");
      setLoading(false);
    });
  }, []);

  function handleChange(value: string) {
    setContent(value);
    setStatus("saving");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const res = await fetch("/api/notes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: value })
      });
      if (res.ok) setStatus("saved");
      else toast.error("Couldn't save your note just now.");
    }, 800);
  }

  if (loading) return <p className="text-mute text-sm">Loading...</p>;

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-1">
        <h1 className="font-display text-3xl text-paper">Notes</h1>
        <span className="text-xs text-mute font-mono flex items-center gap-1.5">
          {status === "saving" && <><Loader2 size={12} className="animate-spin" /> Saving...</>}
          {status === "saved" && <><Check size={12} className="text-signal" /> Saved</>}
        </span>
      </div>
      <p className="text-mute text-sm mb-6">Your own scratchpad — jot down anything about your tasks. Only you can see this.</p>
      <textarea
        value={content}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Track progress, jot reminders, paste snippets — whatever helps."
        className="w-full min-h-[60vh] bg-panel border border-line rounded-xl2 p-5 text-paper text-sm leading-relaxed focus-ring outline-none resize-y"
      />
    </div>
  );
}
