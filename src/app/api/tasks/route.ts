import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Task from "@/models/Task";
import Notification from "@/models/Notification";
import Activity from "@/models/Activity";
import Project from "@/models/Project";
import { sendPushToUsers } from "@/lib/push";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const user = session.user as any;
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("project");

  const filter: any = user.role === "admin" ? {} : { assignees: user.id };
  if (projectId) filter.project = projectId;

  const tasks = await Task.find(filter)
    .populate("assignees", "name avatarColor avatarUrl title")
    .populate("assignedBy", "name avatarColor avatarUrl")
    .populate("project", "name color")
    .populate("completedBy", "name avatarColor avatarUrl")
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json(tasks);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Only an admin can assign tasks." }, { status: 403 });
  }

  await connectDB();
  const body = await req.json();
  const { title, description, project, assignees, groupName, deadline, priority, attachments, figmaLink } = body;

  if (!title || !project || !deadline || !assignees?.length) {
    return NextResponse.json({ error: "Title, project, at least one assignee and a deadline are required." }, { status: 400 });
  }

  const proj: any = await Project.findById(project).lean();
  if (!proj) return NextResponse.json({ error: "Project not found." }, { status: 404 });

  const task = await Task.create({
    title,
    description,
    project,
    assignees,
    groupName: groupName || "",
    assignedBy: (session.user as any).id,
    deadline,
    priority: priority || "medium",
    attachments: attachments || [],
    figmaLink: figmaLink || ""
  });

  const populated = await task.populate([
    { path: "assignees", select: "name avatarColor avatarUrl title" },
    { path: "assignedBy", select: "name avatarColor avatarUrl" },
    { path: "project", select: "name color" }
  ]);

  const label = groupName ? `the "${groupName}" group` : "you";
  const message = `New task "${title}" assigned to ${label} in ${proj.name}, due ${new Date(deadline).toLocaleDateString()}.`;

  await Notification.insertMany(
    assignees.map((a: string) => ({ recipient: a, message, type: "assigned", taskId: task._id }))
  );

  await Activity.create({
    kind: "assigned",
    taskTitle: title,
    assigneeName: groupName || populated.assignees.map((a: any) => a.name).join(", ")
  });

  sendPushToUsers(assignees, { title: "New task assigned", body: message, url: "/dashboard" });

  return NextResponse.json(populated, { status: 201 });
}