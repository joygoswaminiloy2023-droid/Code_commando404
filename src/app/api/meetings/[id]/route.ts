import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Meeting from "@/models/Meeting";
import Project from "@/models/Project";

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

  const allowed = ["title", "topic", "scheduledAt", "attendees", "notes"];
  let rescheduled = false;
  for (const key of allowed) {
    if (body[key] !== undefined) {
      if (key === "scheduledAt" && new Date(body[key]).getTime() !== new Date(meeting.scheduledAt).getTime()) {
        rescheduled = true;
      }
      meeting[key] = body[key];
    }
  }
  if (rescheduled) {
    meeting.remind48hSent = false;
    meeting.remind24hSent = false;
    meeting.remind1hSent = false;
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