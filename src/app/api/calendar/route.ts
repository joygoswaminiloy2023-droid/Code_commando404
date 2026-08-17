import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Task from "@/models/Task";
import Meeting from "@/models/Meeting";
import Project from "@/models/Project";


export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const user = session.user as any;

  const { searchParams } = new URL(req.url);
  const now = new Date();
  const year = parseInt(searchParams.get("year") || String(now.getFullYear()), 10);
  const month = parseInt(searchParams.get("month") || String(now.getMonth() + 1), 10);


  const rangeStart = new Date(year, month - 1, 1);
  rangeStart.setDate(rangeStart.getDate() - 7);
  const rangeEnd = new Date(year, month, 0);
  rangeEnd.setDate(rangeEnd.getDate() + 7);
  rangeEnd.setHours(23, 59, 59, 999);

  const taskFilter: any = {
    deadline: { $gte: rangeStart, $lte: rangeEnd }
  };
  if (user.role !== "admin") taskFilter.assignees = user.id;

  const tasks = await Task.find(taskFilter)
    .select("title deadline status priority project")
    .populate("project", "name color")
    .lean();

  let meetingProjectFilter: any = {};
  if (user.role !== "admin") {
    const myProjects = await Project.find({ members: user.id }).select("_id").lean();
    meetingProjectFilter = { project: { $in: myProjects.map((p: any) => p._id) } };
  }

  const meetings = await Meeting.find({
    ...meetingProjectFilter,
    scheduledAt: { $gte: rangeStart, $lte: rangeEnd }
  })
    .select("title scheduledAt project")
    .populate("project", "name color")
    .lean();

  return NextResponse.json({
    tasks: tasks.map((t: any) => ({
      id: t._id,
      kind: "task",
      title: t.title,
      date: t.deadline,
      status: t.status,
      priority: t.priority,
      projectName: t.project?.name || "",
      projectColor: t.project?.color || "#E8342B",
      href: user.role === "admin" ? `/dashboard/admin/projects/${t.project?._id}` : `/dashboard/user/projects/${t.project?._id}`
    })),
    meetings: meetings.map((m: any) => ({
      id: m._id,
      kind: "meeting",
      title: m.title,
      date: m.scheduledAt,
      projectName: m.project?.name || "",
      projectColor: m.project?.color || "#E8342B",
      href: user.role === "admin" ? `/dashboard/admin/projects/${m.project?._id}` : `/dashboard/user/projects/${m.project?._id}`
    }))
  });
}