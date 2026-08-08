"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, CheckCircle2 } from "lucide-react";

type Event = { _id: string; kind: "assigned" | "completed"; taskTitle: string; assigneeName: string };

const POLL_MS = 8000;

export default function ActivityTicker({ userId }: { userId?: string }) {
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/activity");
      if (res.ok) setEvents(await res.json());
    }
    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, []);

  if (events.length === 0) {
    return (
      <div className="flex items-center gap-2 text-mute text-sm py-6 justify-center">
        <span className="w-1.5 h-1.5 rounded-full bg-signal animate-pulse" />
        Watching for activity — assignments and finishes will appear here.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <AnimatePresence initial={false}>
        {events.map((e) => (
          <motion.div
            key={e._id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2.5 text-sm px-3 py-2 rounded-lg bg-panel2 border border-line"
          >
            {e.kind === "completed" ? (
              <CheckCircle2 size={14} className="text-signal shrink-0" />
            ) : (
              <ArrowRight size={14} className="text-amber shrink-0" />
            )}
            <span className="text-paper">{e.assigneeName}</span>
            <span className="text-mute">{e.kind === "completed" ? "finished" : "was assigned"}</span>
            <span className="text-paper truncate">"{e.taskTitle}"</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}