"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Megaphone, Send } from "lucide-react";
import toast from "react-hot-toast";

const POLL_MS = 15000;

export default function AnnouncementFeed({ canPost, userId }: { canPost: boolean; userId?: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  async function load() {
    const res = await fetch("/api/announcements");
    if (res.ok) setItems(await res.json());
  }

  useEffect(() => {
    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, []);

  async function post(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    setSending(true);
    const res = await fetch("/api/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message })
    });
    setSending(false);
    if (res.ok) {
      setMessage("");
      toast.success("Announcement posted.");
      load();
    } else {
      toast.error("Couldn't post that.");
    }
  }

  return (
    <div>
      {canPost && (
        <form onSubmit={post} className="flex gap-2 mb-4">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Announce something to the whole team..."
            className="flex-1 bg-ink border border-line rounded-lg px-4 py-2.5 text-sm text-paper focus-ring outline-none"
          />
          <button
            type="submit"
            disabled={sending}
            className="bg-signal/10 border border-signal/30 text-signal rounded-lg px-4 hover:bg-signal/20 transition-colors disabled:opacity-50"
          >
            <Send size={15} />
          </button>
        </form>
      )}
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {items.map((a) => (
          <div key={a._id} className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-panel2 border border-line flex items-center justify-center shrink-0 mt-0.5">
              <Megaphone size={12} className="text-amber" />
            </div>
            <div>
              <p className="text-sm text-paper leading-snug">{a.message}</p>
              <p className="text-xs text-mute font-mono mt-0.5">
                {a.postedBy?.name} · {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}
              </p>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-mute text-sm py-4 text-center">No announcements yet.</p>}
      </div>
    </div>
  );
}
