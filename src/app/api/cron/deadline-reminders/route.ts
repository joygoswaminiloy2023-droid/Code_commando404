import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Task from "@/models/Task";
import Meeting from "@/models/Meeting";
import User from "@/models/User";
import Project from "@/models/Project";
import Notification from "@/models/Notification";
import { sendPushToUsers } from "@/lib/push";
import { waitUntil } from "@vercel/functions";
import { formatInTimeZone } from "date-fns-tz";

const APP_TIMEZONE = "Asia/Dhaka";

// Kept as no-op references so the bundler doesn't tree-shake these imports
// away — Task/Meeting .populate() needs both schemas registered even though
// neither is called directly by name in this file.
void User;
void Project;

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const now = new Date();

  const stages: { hours: number; field: "remind48hSent" | "remind24hSent" | "remind1hSent"; label: string }[] = [
    { hours: 48, field: "remind48hSent", label: "about 2 days" },
    { hours: 24, field: "remind24hSent", label: "about 1 day" },
    { hours: 1, field: "remind1hSent", label: "about 1 hour" }
  ];

  let tasksNotified = 0;
  for (const stage of stages) {
    const windowEnd = new Date(now.getTime() + stage.hours * 60 * 60 * 1000);
    const tasks = await Task.find({
      status: "pending",
      [stage.field]: { $ne: true },
      deadline: { $gt: now, $lte: windowEnd }
    })
      .populate("assignees", "name")
      .lean();

    for (const t of tasks as any[]) {
      const deadlineLabel = formatInTimeZone(new Date(t.deadline), APP_TIMEZONE, "MMM d, yyyy, h:mm a");
      const message = `"${t.title}" is due ${deadlineLabel} — ${stage.label} left.`;
      const assigneeIds = t.assignees.map((a: any) => a._id.toString());

      await Notification.insertMany(
        assigneeIds.map((id: string) => ({ recipient: id, message, type: "deadline", taskId: t._id }))
      );
      waitUntil(sendPushToUsers(assigneeIds, { title: "Deadline approaching", body: message, url: "/dashboard" }));
      await Task.findByIdAndUpdate(t._id, { [stage.field]: true });
      tasksNotified++;
    }
  }

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
      const when = formatInTimeZone(new Date(m.scheduledAt), APP_TIMEZONE, "MMM d, yyyy, h:mm a");
      const message = `"${m.title}" (${m.project?.name}) is happening in ${stage.label} — ${when}.`;
      const attendeeIds = m.attendees.map((a: any) => a._id.toString());
      const recipients = Array.from(new Set([...attendeeIds, m.scheduledBy.toString()]));

      await Notification.insertMany(
        recipients.map((id: string) => ({ recipient: id, message, type: "meeting" }))
      );
      waitUntil(sendPushToUsers(recipients, { title: "Meeting reminder", body: message, url: "/dashboard" }));
      await Meeting.findByIdAndUpdate(m._id, { [stage.field]: true });
      meetingsNotified++;
    }
  }

  return NextResponse.json({ ok: true, taskRemindersSent: tasksNotified, meetingRemindersSent: meetingsNotified });
}