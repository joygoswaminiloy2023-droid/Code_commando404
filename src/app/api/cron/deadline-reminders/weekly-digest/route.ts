import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Task from "@/models/Task";
import Meeting from "@/models/Meeting";
import User from "@/models/User";
import Notification from "@/models/Notification";
import { sendPushToUsers } from "@/lib/push";
import { waitUntil } from "@vercel/functions";

// Runs once a week (wire this to cron-job.org, e.g. Monday 8:00 AM Asia/Dhaka,
// crontab: 0 8 * * 1). For every member, summarizes: tasks overdue, tasks due
// this week, and meetings this week — delivered as one push notification +
// one in-app Notification per person, instead of a wall of individual pings.
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const now = new Date();
  const in7d = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const users = await User.find({ role: "member" }).select("_id name").lean();

  let digestsSent = 0;

  for (const u of users as any[]) {
    const userId = u._id.toString();

    const overdue = await Task.find({
      assignees: userId,
      status: "pending",
      deadline: { $lt: now }
    }).select("title deadline").lean();

    const dueThisWeek = await Task.find({
      assignees: userId,
      status: "pending",
      deadline: { $gte: now, $lte: in7d }
    }).select("title deadline").lean();

    const meetingsThisWeek = await Meeting.find({
      attendees: userId,
      scheduledAt: { $gte: now, $lte: in7d }
    }).select("title scheduledAt").lean();

    if (overdue.length === 0 && dueThisWeek.length === 0 && meetingsThisWeek.length === 0) {
      continue; // nothing to report — don't nag an empty inbox
    }

    const parts: string[] = [];
    if (overdue.length) parts.push(`${overdue.length} overdue`);
    if (dueThisWeek.length) parts.push(`${dueThisWeek.length} due this week`);
    if (meetingsThisWeek.length) parts.push(`${meetingsThisWeek.length} meeting${meetingsThisWeek.length > 1 ? "s" : ""} this week`);

    const message = `Weekly digest: ${parts.join(", ")}.`;

    await Notification.create({ recipient: userId, message, type: "deadline" });
    waitUntil(sendPushToUsers([userId], { title: "Your weekly digest", body: message, url: "/dashboard/calendar" }));
    digestsSent++;
  }

  return NextResponse.json({ ok: true, digestsSent });
}