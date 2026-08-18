import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Task from "@/models/Task";
import Notification from "@/models/Notification";
import Activity from "@/models/Activity";
import { sendPushToUsers } from "@/lib/push";
import { waitUntil } from "@vercel/functions";

const BUFFER_HOURS = 0.25;

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

    waitUntil(sendPushToUsers([assignedById], {
      title: "Task completed",
      body: message,
      url: "/dashboard/admin/projects/" + projectId
    }));

    return NextResponse.json(populated);
  }

  // Admin: full edit, including reassignment / files / deadline / priority.
  const previousDeadlineMs = task.deadline.getTime();

  const allowed = ["title", "description", "assignees", "groupName", "deadline", "priority", "attachments", "figmaLink", "status"];
  for (const key of allowed) {
    if (body[key] !== undefined) task[key] = body[key];
  }
  if (body.status === "completed" && !task.completedAt) {
    task.completedAt = new Date();
    task.completedBy = user.id;
  }
  if (body.status === "pending") {
    task.completedAt = null;
    task.completedBy = null;
  }

  // If the deadline actually changed, recompute the staged reminder flags
  // from scratch — otherwise a stage marked "sent" under the old deadline
  // stays stuck skipped forever, even if the new deadline puts it back
  // inside (or outside) that stage's window.
  if (body.deadline !== undefined && task.deadline.getTime() !== previousDeadlineMs) {
    const leadTimeHours = (task.deadline.getTime() - Date.now()) / (1000 * 60 * 60);
    task.remind48hSent = leadTimeHours < 48 - BUFFER_HOURS;
    task.remind24hSent = leadTimeHours < 24 - BUFFER_HOURS;
    task.remind1hSent = leadTimeHours < 1 - BUFFER_HOURS;
  }

  await task.save();

  const assigneeIds = task.assignees.map((a: any) => a.toString());

  const populated = await task.populate([
    { path: "assignees", select: "name avatarColor avatarUrl title" },
    { path: "assignedBy", select: "name avatarColor avatarUrl" },
    { path: "project", select: "name color" },
    { path: "completedBy", select: "name avatarColor avatarUrl" }
  ]);

  if (body.assignees) {
    const message = `Task "${task.title}" was updated by an admin.`;
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