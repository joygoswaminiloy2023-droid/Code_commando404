import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Task from "@/models/Task";
import Notification from "@/models/Notification";
import Activity from "@/models/Activity";
import { sendPushToUsers } from "@/lib/push";
import { waitUntil } from "@vercel/functions";
import { formatInTimeZone } from "date-fns-tz";

const APP_TIMEZONE = "Asia/Dhaka";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const user = session.user as any;
  const body = await req.json();

  const task: any = await Task.findById(params.id);
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isAssignee = task.assignees.map((a: any) => a.toString()).includes(user.id);

  // A member may only ever flip their own task to "completed" — every other
  // field edit (deadline, reassignment, priority, files) stays admin-only.
  if (user.role !== "admin") {
    if (!isAssignee) {
      return NextResponse.json({ error: "Not your task." }, { status: 403 });
    }
    if (body.status !== "completed") {
      return NextResponse.json({ error: "Members can only mark a task complete." }, { status: 403 });
    }
    task.status = "completed";
    task.completedAt = new Date();
    task.completedBy = user.id;
    await task.save();

    const projectId = task.project.toString();
    const assignedById = task.assignedBy.toString();

    const populated = await task.populate([
      { path: "assignees", select: "name avatarColor avatarUrl title" },
      { path: "assignedBy", select: "name avatarColor avatarUrl" },
      { path: "project", select: "name color" },
      { path: "completedBy", select: "name avatarColor avatarUrl" }
    ]);

    const message = `${user.name} completed "${task.title}".`;
    await Notification.create({
      recipient: assignedById,
      message,
      type: "completed",
      taskId: task._id
    });

    await Activity.create({ kind: "completed", taskTitle: task.title, assigneeName: user.name });

    await waitUntil(sendPushToUsers([assignedById], {
      title: "Task completed",
      body: message,
      url: "/dashboard/admin/projects/" + projectId
    }));

    return NextResponse.json(populated);
  }

  // Admin: full edit, including reassignment / files / deadline / priority.
  const allowed = ["title", "description", "assignees", "groupName", "deadline", "priority", "attachments", "figmaLink", "status"];
  const oldTitle = task.title;
  const oldDeadline = task.deadline;
  const oldAssigneeIds = task.assignees.map((a: any) => a.toString()).sort();
  const deadlineChanged = body.deadline !== undefined &&
    new Date(body.deadline).getTime() !== new Date(task.deadline).getTime();
  for (const key of allowed) {
    if (body[key] !== undefined) task[key] = body[key];
  }
  // If the deadline actually moved, clear the reminder flags so the new
  // date gets its own fresh 48h/24h/1h reminders instead of staying silent
  // because the old deadline already "used up" that stage.
  if (deadlineChanged) {
    task.remind48hSent = false;
    task.remind24hSent = false;
    task.remind1hSent = false;
  }
  if (body.status === "completed" && !task.completedAt) {
    task.completedAt = new Date();
    task.completedBy = user.id;
  }
  if (body.status === "pending") {
    task.completedAt = null;
    task.completedBy = null;
  }
  await task.save();

  const assigneeIds = task.assignees.map((a: any) => a.toString());

  const populated = await task.populate([
    { path: "assignees", select: "name avatarColor avatarUrl title" },
    { path: "assignedBy", select: "name avatarColor avatarUrl" },
    { path: "project", select: "name color" },
    { path: "completedBy", select: "name avatarColor avatarUrl" }
  ]);

  // Tell assignees exactly what changed — renamed, deadline moved,
  // reassigned — instead of a generic "task updated" ping.
  const titleChanged = body.title !== undefined && body.title !== oldTitle;
  const assigneesChanged = body.assignees !== undefined &&
    JSON.stringify([...assigneeIds].sort()) !== JSON.stringify(oldAssigneeIds);

  const changes: string[] = [];
  if (titleChanged) changes.push(`renamed to "${task.title}"`);
  if (deadlineChanged) {
    const oldLabel = formatInTimeZone(new Date(oldDeadline), APP_TIMEZONE, "MMM d, h:mm a");
    const newLabel = formatInTimeZone(new Date(task.deadline), APP_TIMEZONE, "MMM d, yyyy, h:mm a");
    changes.push(`deadline moved from ${oldLabel} to ${newLabel}`);
  }
  if (assigneesChanged) {
    changes.push(`reassigned to ${task.groupName || populated.assignees.map((a: any) => a.name).join(", ")}`);
  }

  if (changes.length > 0) {
    const message = `Task "${task.title}" updated — ${changes.join("; ")}.`;
    await Notification.insertMany(
      assigneeIds.map((id: string) => ({ recipient: id, message, type: "assigned", taskId: task._id }))
    );
    await Activity.create({
      kind: "assigned",
      taskTitle: task.title,
      assigneeName: task.groupName || populated.assignees.map((a: any) => a.name).join(", ")
    });
    waitUntil(sendPushToUsers(assigneeIds, { title: "Task updated", body: message, url: "/dashboard" }));
  }

  return NextResponse.json(populated);
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Only an admin can delete tasks." }, { status: 403 });
  }
  await connectDB();
  await Task.findByIdAndDelete(params.id);
  return NextResponse.json({ ok: true });
}