import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Task from "@/models/Task";
import Meeting from "@/models/Meeting";
import User from "@/models/User";        
import Project from "@/models/Project"; 
import Notification from "@/models/Notification";
import mongoose from "mongoose"; 
import { sendPushToUsers } from "@/lib/push";
import { waitUntil } from "@vercel/functions";

// Runs the reminder sweep: task deadlines (one stage, ~48h out) and meeting
// reminders (three stages: 48h / 24h / 1h out). Safe to call as often as
// you like — every check is driven by a "sent" flag on the record, not by
// timing, so calling this daily (Vercel's free-tier cron limit) reliably
// catches the 48h/24h windows, but the 1h-before meeting reminder only
// fires on time if something pings this endpoint every ~15 minutes — see
// the deployment notes for wiring up a free external scheduler for that.
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

   console.log("Registered models:", Object.keys(mongoose.models));

      void User;
   void Project;

  await connectDB();
  const now = new Date();
  const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);

  // --- Task deadlines ---
  const tasks = await Task.find({
    status: "pending",
    reminderSent: { $ne: true },
    deadline: { $gt: now, $lte: in48h }
  })
    .populate("assignees", "name")
    .lean();

  let tasksNotified = 0;
  for (const t of tasks as any[]) {
    const message = `"${t.title}" is due ${new Date(t.deadline).toLocaleString()} — about 2 days left.`;
    const assigneeIds = t.assignees.map((a: any) => a._id.toString());

    await Notification.insertMany(
      assigneeIds.map((id: string) => ({ recipient: id, message, type: "deadline", taskId: t._id }))
    );
    await waitUntil(sendPushToUsers(assigneeIds, { title: "Deadline approaching", body: message, url: "/dashboard" }));
    await Task.findByIdAndUpdate(t._id, { reminderSent: true });
    tasksNotified++;
  }

  // --- Meeting reminders: 48h / 24h / 1h before ---
  const stages: { hours: number; field: "remind48hSent" | "remind24hSent" | "remind1hSent"; label: string }[] = [
    { hours: 48, field: "remind48hSent", label: "in about 2 days" },
    { hours: 24, field: "remind24hSent", label: "in about 1 day" },
    { hours: 1, field: "remind1hSent", label: "in about 1 hour" }
  ];

  let meetingsNotified = 0;
  for (const stage of stages) {
    const windowEnd = new Date(now.getTime() + stage.hours * 60 * 60 * 1000);
    const meetings = await Meeting.find({
      [stage.field]: { $ne: true },
      scheduledAt: { $gt: now, $lte: windowEnd }
    })
      .populate("attendees", "name")
      .populate("project", "name")
      .lean();

    for (const m of meetings as any[]) {
      const when = new Date(m.scheduledAt).toLocaleString();
      const message = `"${m.title}" (${m.project?.name}) is happening ${stage.label} — ${when}.`;
      const attendeeIds = m.attendees.map((a: any) => a._id.toString());
      // The admin who scheduled it gets reminded too, alongside every attendee.
      const recipients = Array.from(new Set([...attendeeIds, m.scheduledBy.toString()]));

      await Notification.insertMany(
        recipients.map((id: string) => ({ recipient: id, message, type: "meeting" }))
      );
      await waitUntil(sendPushToUsers(recipients, { title: "Meeting reminder", body: message, url: "/dashboard" }));
      await Meeting.findByIdAndUpdate(m._id, { [stage.field]: true });
      meetingsNotified++;
    }
  }

  return NextResponse.json({ ok: true, taskRemindersSent: tasksNotified, meetingRemindersSent: meetingsNotified });
}
