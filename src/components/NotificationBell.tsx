"use client";

import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";

type Notif = { _id: string; message: string; type: string; read: boolean; createdAt: string };

const POLL_MS = 8000;

export default function NotificationBell({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notif[]>([]);
  const seenIds = useRef<Set<string>>(new Set());
  const firstLoad = useRef(true);

  async function load() {
    const res = await fetch("/api/notifications");
    if (!res.ok) return;
    const data: Notif[] = await res.json();

    if (!firstLoad.current) {
      const fresh = data.filter((n) => !seenIds.current.has(n._id));
      fresh.forEach((n) => {
        if (n.type === "completed") toast.success(n.message, { icon: "✅" });
        else if (n.type === "announcement") toast(`📣 ${n.message}`);
        else toast.success(n.message);
      });
    }
    data.forEach((n) => seenIds.current.add(n._id));
    firstLoad.current = false;
    setItems(data);
  }

  useEffect(() => {
    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const unread = items.filter((i) => !i.read).length;

  async function markRead() {
    await fetch("/api/notifications", { method: "PATCH" });
    setItems((prev) => prev.map((i) => ({ ...i, read: true })));
  }

  return (
    <div className="relative">
      <button
        onClick={() => {
          setOpen((o) => !o);
          if (!open && unread > 0) markRead();
        }}
        className="relative p-2 rounded-lg hover:bg-panel2 transition-colors focus-ring"
        aria-label="Notifications"
      >
        <Bell size={19} className="text-paper" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-coral text-ink text-[10px] font-mono w-4 h-4 rounded-full flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-panel border border-line rounded-xl shadow-glow z-50"
          >
            <div className="p-3 border-b border-line font-mono text-xs uppercase tracking-wide text-mute">
              Notifications
            </div>
            {items.length === 0 && (
              <div className="p-6 text-center text-mute text-sm">Nothing yet.</div>
            )}
            {items.map((n) => (
              <div key={n._id} className="p-3 border-b border-line/60 last:border-0">
                <p className="text-sm text-paper leading-snug">{n.message}</p>
                <p className="text-xs text-mute mt-1 font-mono">
                  {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                </p>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
