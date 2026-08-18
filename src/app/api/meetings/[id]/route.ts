import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Meeting from "@/models/Meeting";
import Project from "@/models/Project";

const BUFFER_HOURS = 0.25;

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const me = session.user as any;

  const meeting: any = await Meeting.findById(params.id);
  if (!meeting) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const bodyKeys = Object.keys(body);
  const isNotesOnly = bodyKeys.length > 0 && bodyKeys.every((k) => k === "notes");

  if (me.role !== "admin") {
    if (!isNotesOnly) {
      return NextResponse.json({ error: "Only an admin can edit the meeting details." }, { status: 403 });
    }
    const project: any = await Project.findById(meeting.project).lean();
    const isProjectMember = project?.members?.some((m: any) => m.toString() === me.id);
    if (!isProjectMember) {
      return NextResponse.json({ error: "You don't have access to this meeting." }, { status: 403 });
    }
    meeting.notes = body.notes ?? "";
    await meeting.save();
    const populatedNotes = await meeting.populate([
      { path: "project", select: "name color" },
      { path: "scheduledBy", select: "name avatarColor avatarUrl" },
      { path: "attendees", select: "name avatarColor avatarUrl" }
    ]);
    return NextResponse.json(populatedNotes);
  }

  // Compare actual timestamps, not stringified values — body.scheduledAt
  // arrives as an ISO string while meeting.scheduledAt is a Date object,
  // so String(...) on each side never reliably matches.
  const previousScheduledAtMs = meeting.scheduledAt.getTime();

  const allowed = ["title", "topic", "scheduledAt", "attendees", "notes"];
  for (const key of allowed) {
    if (body[key] !== undefined) meeting[key] = body[key];
  }

  const rescheduled = body.scheduledAt !== undefined && meeting.scheduledAt.getTime() !== previousScheduledAtMs;

  if (rescheduled) {
    // Recompute from actual lead time, same buffered logic used at
    // creation — a blanket reset to false would wrongly un-skip stages
    // that don't apply anymore (e.g. resetting the 48h flag on a meeting
    // that got moved to 30 minutes away would fire a bogus "2 days" ping).
    const leadTimeHours = (meeting.scheduledAt.getTime() - Date.now()) / (1000 * 60 * 60);
    meeting.remind48hSent = leadTimeHours < 48 - BUFFER_HOURS;
    meeting.remind24hSent = leadTimeHours < 24 - BUFFER_HOURS;
    meeting.remind1hSent = leadTimeHours < 1 - BUFFER_HOURS;
  }

  await meeting.save();

  const populated = await meeting.populate([
    { path: "project", select: "name color" },
    { path: "scheduledBy", select: "name avatarColor avatarUrl" },
    { path: "attendees", select: "name avatarColor avatarUrl" }
  ]);
  return NextResponse.json(populated);
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Only an admin can cancel a meeting." }, { status: 403 });
  }
  await connectDB();
  await Meeting.findByIdAndDelete(params.id);
  return NextResponse.json({ ok: true });
}