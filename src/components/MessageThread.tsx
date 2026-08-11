"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";

export default function MessageThread({
  meId,
  fetchUrl,
  postUrl,
  extraPostBody,
  emptyLabel,
  otherPartyLabel
}: {
  meId: string;
  fetchUrl: string;
  postUrl: string;
  extraPostBody?: Record<string, any>;
  emptyLabel: string;
  otherPartyLabel: (senderId: string) => string;
}) {
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function load() {
    const res = await fetch(fetchUrl);
    if (res.ok) setMessages(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 10000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchUrl]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    const res = await fetch(postUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: text, ...extraPostBody })
    });
    setSending(false);
    if (res.ok) {
      setText("");
      load();
    } else {
      const data = await res.json().catch(() => null);
      toast.error(data?.error || "Couldn't send that message.");
    }
  }

  if (loading) return <p className="text-mute text-sm">Loading...</p>;

  return (
    <div className="flex flex-col h-[70vh] bg-panel border border-line rounded-xl2 overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && <p className="text-mute text-sm text-center py-10">{emptyLabel}</p>}
        {messages.map((m) => {
          const mine = m.sender._id === meId;
          return (
            <div key={m._id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] rounded-xl px-4 py-2.5 ${mine ? "bg-signal/15 border border-signal/30" : "bg-panel2 border border-line"}`}>
                {!mine && <div className="text-[11px] text-mute font-mono mb-1">{otherPartyLabel(m.sender._id)}</div>}
                <p className="text-sm text-paper whitespace-pre-wrap break-words">{m.body}</p>
                <div className="text-[10px] text-mute font-mono mt-1">{format(new Date(m.createdAt), "MMM d, HH:mm")}</div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={send} className="flex items-center gap-2 p-3 border-t border-line">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-ink border border-line rounded-lg px-4 py-2.5 text-sm text-paper focus-ring outline-none"
        />
        <button
          type="submit"
          disabled={sending}
          className="bg-signal text-ink rounded-lg px-4 py-2.5 hover:bg-signal2 transition-colors disabled:opacity-50"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}