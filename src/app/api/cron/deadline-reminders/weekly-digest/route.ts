import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Task from "@/models/Task";
import Meeting from "@/models/Meeting";
import User from "@/models/User";
import Project from "@/models/Project";
import Notification from "@/models/Notification";
import { sendPushToUsers } from "@/lib/push";
import { sendWeeklyDigestEmail } from "@/lib/email";
import { generateProjectSummary, type ProjectStats } from "@/lib/ai";
import { waitUntil } from "@vercel/functions";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const now = new Date();
  const in7d = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const appUrl = process.env.NEXTAUTH_URL || "https://your-app.vercel.app";

  const users = await User.find({}).select("_id name email role").lean();
  const projects = await Project.find({}).select("_id name members").lean();


  const projectSummaries = new Map<string, { name: string; summary: string }>();

  for (const p of projects as any[]) {
    const projectId = p._id.toString();

    const openTasks = await Task.find({ project: projectId, status: "pending" })
      .populate("assignees", "name")
      .select("deadline assignees")
      .lean();

    const completedLastWeek = await Task.countDocuments({
      project: projectId,
      status: "completed",
      completedAt: { $gte: last7d, $lte: now }
    });

    if (openTasks.length === 0 && completedLastWeek === 0) {
      continue; 
    }

    const overdueCount = openTasks.filter((t: any) => new Date(t.deadline) < now).length;
    const dueThisWeekCount = openTasks.filter(
      (t: any) => new Date(t.deadline) >= now && new Date(t.deadline) <= in7d
    ).length;

    const loadMap = new Map<string, { name: string; openCount: number; overdueCount: number }>();
    for (const t of openTasks as any[]) {
      const isOverdue = new Date(t.deadline) < now;
      for (const a of t.assignees || []) {
        const key = a._id.toString();
        const entry = loadMap.get(key) || { name: a.name, openCount: 0, overdueCount: 0 };
        entry.openCount++;
        if (isOverdue) entry.overdueCount++;
        loadMap.set(key, entry);
      }
    }

    const stats: ProjectStats = {
      projectName: p.name,
      totalOpenCount: openTasks.length,
      overdueCount,
      dueThisWeekCount,
      completedLastWeekCount: completedLastWeek,
      loadByAssignee: Array.from(loadMap.values()).sort((a, b) => b.openCount - a.openCount)
    };

    const summary = await generateProjectSummary(stats);
    projectSummaries.set(projectId, { name: p.name, summary });
  }

  // --- Per-user digest: personal overdue/due-this-week/meetings, plus the
  // AI status paragraph for every project they're a member of that has one.
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

    const userProjectSummaries = (projects as any[])
      .filter((p) => p.members?.some((m: any) => m.toString() === userId))
      .map((p) => projectSummaries.get(p._id.toString()))
      .filter((s): s is { name: string; summary: string } => !!s);

    if (
      overdue.length === 0 &&
      dueThisWeek.length === 0 &&
      meetingsThisWeek.length === 0 &&
      userProjectSummaries.length === 0
    ) {
      continue; // nothing to report — don't nag an empty inbox
    }

    const parts: string[] = [];
    if (overdue.length) parts.push(`${overdue.length} overdue`);
    if (dueThisWeek.length) parts.push(`${dueThisWeek.length} due this week`);
    if (meetingsThisWeek.length) parts.push(`${meetingsThisWeek.length} meeting${meetingsThisWeek.length > 1 ? "s" : ""} this week`);

    let message = parts.length > 0 ? `Weekly digest: ${parts.join(", ")}.` : "Weekly digest.";
    if (userProjectSummaries.length > 0) {
      // Keep the in-app notification compact — up to 2 project lines.
      const lines = userProjectSummaries.slice(0, 2).map((s) => s.summary);
      message += ` ${lines.join(" ")}`;
    }

    await Notification.create({ recipient: userId, message, type: "deadline" });

    waitUntil(sendPushToUsers([userId], { title: "Your weekly digest", body: message, url: "/dashboard/calendar" }));

    waitUntil(
      sendWeeklyDigestEmail({
        to: u.email,
        name: u.name,
        overdue: overdue.map((t: any) => ({ title: t.title, date: t.deadline })),
        dueThisWeek: dueThisWeek.map((t: any) => ({ title: t.title, date: t.deadline })),
        meetingsThisWeek: meetingsThisWeek.map((m: any) => ({ title: m.title, date: m.scheduledAt })),
        projectSummaries: userProjectSummaries,
        appUrl: `${appUrl}/dashboard/calendar`
      })
    );

    digestsSent++;
    emailsSent++;
  }

  return NextResponse.json({ ok: true, digestsSent, emailsSent, projectsSummarized: projectSummaries.size });
}