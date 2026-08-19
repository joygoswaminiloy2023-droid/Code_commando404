import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Meeting from "@/models/Meeting";
import Project from "@/models/Project";
import Notification from "@/models/Notification";
import { sendPushToUsers } from "@/lib/push";
import { waitUntil } from "@vercel/functions";

// GET /api/meetings              → every upcoming meeting across projects the user's in (admin: all)
// GET /api/meetings?project=<id> → every meeting for one project (any project member can see these)
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const me = session.user as any;
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("project");

  let projectFilter: any = {};
  if (projectId) {
    const project: any = await Project.findById(projectId).lean();
    if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const isMember = project.members.some((m: any) => m.toString() === me.id);
    if (me.role !== "admin" && !isMember) {
      return NextResponse.json({ error: "You don't have access to this project." }, { status: 403 });
    }
    projectFilter = { project: projectId };
  } else if (me.role !== "admin") {
    const myProjects = await Project.find({ members: me.id }).select("_id").lean();
    projectFilter = { project: { $in: myProjects.map((p: any) => p._id) } };
  }

  const meetings = await Meeting.find(projectFilter)
    .populate("project", "name color")
    .populate("scheduledBy", "name avatarColor avatarUrl")
    .populate("attendees", "name avatarColor avatarUrl")
    .sort({ scheduledAt: 1 })
    .lean();

  return NextResponse.json(meetings);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Only an admin can schedule meetings." }, { status: 403 });
  }
  await connectDB();
  const { project, title, topic, scheduledAt, attendees } = await req.json();
  if (!project || !title?.trim() || !scheduledAt || !attendees?.length) {
    return NextResponse.json({ error: "Project, title, date/time and at least one attendee are required." }, { status: 400 });
  }

  const proj: any = await Project.findById(project).lean();
  if (!proj) return NextResponse.json({ error: "Project not found." }, { status: 404 });

  // If the meeting is scheduled with less lead time than a reminder stage's
  // window represents, that stage would never be a meaningful heads-up —
  // e.g. a meeting booked 1 hour out shouldn't trigger a "2 days away!"
  // reminder. Pre-mark those stages as already sent so the cron sweep
  // skips them and only the stages that make sense actually fire.
  const leadTimeHours = (new Date(scheduledAt).getTime() - Date.now()) / (1000 * 60 * 60);

  const meeting = await Meeting.create({
    project,
    title: title.trim(),
    topic: topic || "",
    scheduledAt,
    scheduledBy: (session.user as any).id,
    attendees,
    remind48hSent: leadTimeHours < 48,
    remind24hSent: leadTimeHours < 24,
    remind1hSent: leadTimeHours < 1
  });
  const populated = await meeting.populate([
    { path: "project", select: "name color" },
    { path: "scheduledBy", select: "name avatarColor avatarUrl" },
    { path: "attendees", select: "name avatarColor avatarUrl" }
  ]);

  const message = `"${title.trim()}" scheduled in ${proj.name} — ${new Date(scheduledAt).toLocaleString("en-US", {
    timeZone: "Asia/Dhaka",
    dateStyle: "medium",
    timeStyle: "short"
  })}.`;

  await Notification.insertMany(
    attendees.map((a: string) => ({ recipient: a, message, type: "meeting" }))
  );
  waitUntil(sendPushToUsers(attendees, { title: "Meeting scheduled", body: message, url: `/dashboard/admin/projects/${project}` }));

  return NextResponse.json(populated, { status: 201 });
}