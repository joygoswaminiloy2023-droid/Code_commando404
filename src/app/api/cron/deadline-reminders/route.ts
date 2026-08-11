import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Task from "@/models/Task";
import Notification from "@/models/Notification";
import { sendPushToUsers } from "@/lib/push";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const now = new Date();
  const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);

  const tasks = await Task.find({
    status: "pending",
    reminderSent: { $ne: true },
    deadline: { $gt: now, $lte: in48h }
  })
    .populate("assignees", "name")
    .lean();

  let notified = 0;
  for (const t of tasks as any[]) {
    const message = `"${t.title}" is due ${new Date(t.deadline).toLocaleString()} — about 2 days left.`;
    const assigneeIds = t.assignees.map((a: any) => a._id.toString());

    await Notification.insertMany(
      assigneeIds.map((id: string) => ({ recipient: id, message, type: "deadline", taskId: t._id }))
    );
    sendPushToUsers(assigneeIds, { title: "Deadline approaching", body: message, url: "/dashboard" });
    await Task.findByIdAndUpdate(t._id, { reminderSent: true });
    notified++;
  }

  return NextResponse.json({ ok: true, remindersSent: notified });
}