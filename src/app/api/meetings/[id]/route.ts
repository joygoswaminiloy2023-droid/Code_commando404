import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Meeting from "@/models/Meeting";
import Project from "@/models/Project";
import Notification from "@/models/Notification";
import { sendPushToUsers } from "@/lib/push";
import { waitUntil } from "@vercel/functions";
import { formatInTimeZone } from "date-fns-tz";

const APP_TIMEZONE = "Asia/Dhaka";

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
  const oldTitle = meeting.title;
  const oldScheduledAt = meeting.scheduledAt;
  const oldAttendeeIds = meeting.attendees.map((a: any) => a.toString()).sort();
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

  // Capture attendee/scheduledBy IDs BEFORE populating — .populate() mutates
  // the document in place, replacing these ObjectId refs with full User
  // objects, which would otherwise break .toString() below and crash the
  // whole request (and silently break the edit modal on the client).
  const attendeeIds = meeting.attendees.map((a: any) => a.toString());
  const scheduledById = meeting.scheduledBy.toString();

  const populated = await meeting.populate([
    { path: "project", select: "name color" },
    { path: "scheduledBy", select: "name avatarColor avatarUrl" },
    { path: "attendees", select: "name avatarColor avatarUrl" }
  ]);

  // Tell attendees (and the admin who scheduled it) exactly what changed —
  // postponed/rescheduled, renamed, or attendee list updated — instead of
  // staying silent.
  const titleChanged = body.title !== undefined && body.title !== oldTitle;
  const attendeesChanged = body.attendees !== undefined &&
    JSON.stringify([...attendeeIds].sort()) !== JSON.stringify(oldAttendeeIds);

  const changes: string[] = [];
  if (rescheduled) {
    const oldLabel = formatInTimeZone(new Date(oldScheduledAt), APP_TIMEZONE, "MMM d, h:mm a");
    const newLabel = formatInTimeZone(new Date(meeting.scheduledAt), APP_TIMEZONE, "MMM d, yyyy, h:mm a");
    changes.push(`rescheduled from ${oldLabel} to ${newLabel}`);
  }
  if (titleChanged) changes.push(`renamed to "${meeting.title}"`);
  if (attendeesChanged) changes.push("attendee list updated");

  if (changes.length > 0) {
    const recipients = Array.from(new Set([...attendeeIds, scheduledById]));
    const message = rescheduled
      ? `Meeting "${meeting.title}" was postponed — ${changes.join("; ")}.`
      : `Meeting "${meeting.title}" updated — ${changes.join("; ")}.`;
    await Notification.insertMany(
      recipients.map((id: string) => ({ recipient: id, message, type: "meeting" }))
    );
    waitUntil(sendPushToUsers(recipients, {
      title: rescheduled ? "Meeting rescheduled" : "Meeting updated",
      body: message,
      url: "/dashboard"
    }));
  }

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