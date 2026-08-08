import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Project from "@/models/Project";
import Task from "@/models/Task";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const user = session.user as any;

  const project: any = await Project.findById(params.id)
    .populate("createdBy", "name avatarColor avatarUrl")
    .populate("members", "name avatarColor avatarUrl title status email")
    .populate("groups.members", "name avatarColor avatarUrl title status")
    .populate("resources.uploadedBy", "name avatarColor avatarUrl")
    .lean();

  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isMember = project.members.some((m: any) => m._id.toString() === user.id);
  if (user.role !== "admin" && !isMember) {
    return NextResponse.json({ error: "You don't have access to this project." }, { status: 403 });
  }

  return NextResponse.json(project);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Only an admin can edit a project." }, { status: 403 });
  }
  await connectDB();
  const body = await req.json();

  const project: any = await Project.findById(params.id);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const allowed = ["name", "description", "status", "color", "members"];
  for (const key of allowed) {
    if (body[key] !== undefined) (project as any)[key] = body[key];
  }
  // If a member was removed from the project, also drop them from any group
  // inside it so groups never silently keep an outsider.
  if (body.members) {
    const stillIn = new Set(body.members.map((m: string) => m.toString()));
    project.groups = project.groups.map((g: any) => ({
      ...g.toObject(),
      members: g.members.filter((m: any) => stillIn.has(m.toString()))
    }));
  }

  await project.save();
  const populated = await Project.findById(project._id)
    .populate("createdBy", "name avatarColor avatarUrl")
    .populate("members", "name avatarColor avatarUrl title status email")
    .populate("groups.members", "name avatarColor avatarUrl title status")
    .populate("resources.uploadedBy", "name avatarColor avatarUrl")
    .lean();

  return NextResponse.json(populated);
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Only an admin can delete a project." }, { status: 403 });
  }
  await connectDB();
  await Project.findByIdAndDelete(params.id);
  await Task.deleteMany({ project: params.id });
  return NextResponse.json({ ok: true });
}
