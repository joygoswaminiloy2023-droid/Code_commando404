"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import clsx from "clsx";

export default function AdminMessagesPage() {
  const [threads, setThreads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/messages?threads=1").then((r) => r.json()).then((d) => {
      setThreads(d);
      setLoading(false);
    });
  }, []);

  return (
    <div>
      <h1 className="font-display text-3xl text-paper mb-1">Messages</h1>
      <p className="text-mute text-sm mb-8">Private threads from your team — only you can see these.</p>

      {loading ? (
        <p className="text-mute text-sm">Loading...</p>
      ) : threads.length === 0 ? (
        <p className="text-mute text-sm">No one's messaged in yet.</p>
      ) : (
        <div className="space-y-2 max-w-2xl">
          {threads.map((t) => (
            <Link
              key={t.user._id}
              href={`/dashboard/admin/messages/${t.user._id}`}
              className="flex items-center gap-3 bg-panel border border-line rounded-xl p-4 hover:border-signal/30 transition-colors"
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-ink text-sm font-medium shrink-0 overflow-hidden"
                style={{ background: t.user.avatarColor }}
              >
                {t.user.avatarUrl ? <img src={t.user.avatarUrl} className="w-full h-full object-cover" alt="" /> : t.user.name[0].toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-paper font-medium">{t.user.name}</span>
                  {t.unread > 0 && (
                    <span className="text-[10px] font-mono bg-coral text-ink rounded-full w-4 h-4 flex items-center justify-center">
                      {t.unread}
                    </span>
                  )}
                </div>
                <p className={clsx("text-sm truncate", t.unread > 0 ? "text-paper" : "text-mute")}>{t.lastMessage.body}</p>
              </div>
              <span className="text-xs text-mute font-mono shrink-0">
                {formatDistanceToNow(new Date(t.lastMessage.createdAt), { addSuffix: true })}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
