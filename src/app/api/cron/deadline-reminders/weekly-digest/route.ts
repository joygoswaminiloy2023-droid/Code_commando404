import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Task from "@/models/Task";
import Meeting from "@/models/Meeting";
import User from "@/models/User";
import Notification from "@/models/Notification";
import { sendPushToUsers } from "@/lib/push";
import { sendWeeklyDigestEmail } from "@/lib/email";
import { waitUntil } from "@vercel/functions";


export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const now = new Date();
  const in7d = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const appUrl = process.env.NEXTAUTH_URL || "https://your-app.vercel.app";

 const users = await User.find({}).select("_id name email role").lean();

  let digestsSent = 0;
  let emailsSent = 0;

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

    waitUntil(
      sendWeeklyDigestEmail({
        to: u.email,
        name: u.name,
        overdue: overdue.map((t: any) => ({ title: t.title, date: t.deadline })),
        dueThisWeek: dueThisWeek.map((t: any) => ({ title: t.title, date: t.deadline })),
        meetingsThisWeek: meetingsThisWeek.map((m: any) => ({ title: m.title, date: m.scheduledAt })),
        appUrl: `${appUrl}/dashboard/calendar`
      })
    );

    digestsSent++;
    emailsSent++;
  }

  return NextResponse.json({ ok: true, digestsSent, emailsSent });
}