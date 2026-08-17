"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, format, isSameMonth, isSameDay, isToday, isPast,
  addMonths, subMonths
} from "date-fns";
import { ChevronLeft, ChevronRight, Video, Flag } from "lucide-react";
import clsx from "clsx";

type CalEvent = {
  id: string;
  kind: "task" | "meeting";
  title: string;
  date: string;
  status?: string;
  priority?: string;
  projectName: string;
  projectColor: string;
  href: string;
};

const priorityColor: Record<string, string> = {
  high: "#FF7A45",
  medium: "#F5B95B",
  low: "#8A8D93"
};

export default function CalendarPage() {
  const { data: session } = useSession();
  const [cursor, setCursor] = useState(new Date());
  const [tasks, setTasks] = useState<CalEvent[]>([]);
  const [meetings, setMeetings] = useState<CalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/calendar?year=${cursor.getFullYear()}&month=${cursor.getMonth() + 1}`)
      .then((r) => r.json())
      .then((data) => {
        setTasks(data.tasks || []);
        setMeetings(data.meetings || []);
        setLoading(false);
      });
  }, [cursor]);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor));
    const end = endOfWeek(endOfMonth(cursor));
    return eachDayOfInterval({ start, end });
  }, [cursor]);

  const allEvents = useMemo(() => [...tasks, ...meetings], [tasks, meetings]);

  function eventsFor(day: Date) {
    return allEvents.filter((e) => isSameDay(new Date(e.date), day));
  }

  const selectedEvents = selectedDay ? eventsFor(selectedDay) : [];

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="font-display text-3xl text-paper">Calendar</h1>
      </div>
      <p className="text-mute text-sm mb-8">Every deadline and meeting across your projects, at a glance.</p>

      <div className="bg-panel border border-line rounded-xl2 p-5 mb-6">
        <div className="flex items-center justify-between mb-5">
          <button
            onClick={() => setCursor((c) => subMonths(c, 1))}
            className="w-8 h-8 rounded-lg bg-panel2 border border-line flex items-center justify-center text-mute hover:text-paper transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="font-display text-lg text-paper">{format(cursor, "MMMM yyyy")}</div>
          <button
            onClick={() => setCursor((c) => addMonths(c, 1))}
            className="w-8 h-8 rounded-lg bg-panel2 border border-line flex items-center justify-center text-mute hover:text-paper transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-1">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="text-center text-[10px] font-mono uppercase tracking-wide text-mute py-1">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const dayEvents = eventsFor(day).sort(
              (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
            );
            const inMonth = isSameMonth(day, cursor);
            const overdue = dayEvents.some(
              (e) => e.kind === "task" && e.status === "pending" && isPast(new Date(e.date)) && !isToday(new Date(e.date))
            );
            const visibleEvents = dayEvents.slice(0, 3);
            const extraCount = dayEvents.length - visibleEvents.length;

            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDay(day)}
                className={clsx(
                  "min-h-[92px] rounded-lg border p-1.5 text-left flex flex-col gap-1 transition-colors",
                  inMonth ? "bg-ink border-line" : "bg-panel border-line/40 opacity-40",
                  isToday(day) && "border-signal/60",
                  selectedDay && isSameDay(selectedDay, day) && "ring-1 ring-signal"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className={clsx("text-xs font-mono", isToday(day) ? "text-signal" : "text-paper")}>
                    {format(day, "d")}
                  </span>
                  {overdue && <Flag size={10} className="text-coral shrink-0" />}
                </div>

                <div className="flex flex-col gap-0.5 overflow-hidden">
                  {visibleEvents.map((e) => {
                    const color = e.kind === "meeting" ? "#F5B95B" : priorityColor[e.priority || "medium"];
                    return (
                      <div
                        key={e.id}
                        title={`${e.title} · ${format(new Date(e.date), "h:mm a")}`}
                        className="flex items-center gap-1 text-[10px] leading-tight rounded px-1 py-0.5 truncate"
                        style={{ backgroundColor: `${color}22`, color }}
                      >
                        <span className="font-mono shrink-0">
                          {format(new Date(e.date), "h:mma").toLowerCase()}
                        </span>
                        <span className="truncate">{e.title}</span>
                      </div>
                    );
                  })}
                  {extraCount > 0 && (
                    <span className="text-[10px] text-mute px-1">+{extraCount} more</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {loading && <p className="text-mute text-xs mt-3">Loading...</p>}
      </div>

      <div className="flex items-center gap-4 mb-6 text-xs text-mute">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-coral" /> High priority</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber" /> Medium / Meeting</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-mute" /> Low priority</span>
      </div>

      {selectedDay && (
        <div className="bg-panel border border-line rounded-xl2 p-6">
          <h2 className="font-display text-lg text-paper mb-4">{format(selectedDay, "EEEE, MMM d")}</h2>
          {selectedEvents.length === 0 && <p className="text-mute text-sm">Nothing scheduled this day.</p>}
          <div className="space-y-2">
            {selectedEvents.map((e) => (
              <Link
                key={e.id}
                href={e.href}
                className="flex items-center gap-3 bg-ink border border-line rounded-lg px-4 py-3 hover:border-signal/40 transition-colors"
              >
                {e.kind === "meeting" ? (
                  <Video size={15} className="text-amber shrink-0" />
                ) : (
                  <Flag size={15} className="shrink-0" style={{ color: priorityColor[e.priority || "medium"] }} />
                )}
                <div className="min-w-0">
                  <div className="text-sm text-paper truncate">{e.title}</div>
                  <div className="text-[11px] text-mute font-mono">
                    {e.projectName} · {format(new Date(e.date), "h:mm a")}
                    {e.kind === "task" && e.status === "completed" && " · Completed"}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}