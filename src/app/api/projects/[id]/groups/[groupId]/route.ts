import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Project from "@/models/Project";

export async function PATCH(req: Request, { params }: { params: { id: string; groupId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Only an admin can edit a group." }, { status: 403 });
  }
  await connectDB();
  const body = await req.json();

  const project: any = await Project.findById(params.id);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const group = project.groups.id(params.groupId);
  if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });

  if (body.name !== undefined) group.name = body.name.trim();
  if (body.members !== undefined) group.members = body.members;

  await project.save();
  const populated = await Project.findById(project._id).populate("groups.members", "name avatarColor avatarUrl title status").lean();
  return NextResponse.json((populated as any).groups);
}

export async function DELETE(req: Request, { params }: { params: { id: string; groupId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Only an admin can delete a group." }, { status: 403 });
  }
  await connectDB();
  const project: any = await Project.findById(params.id);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  project.groups = project.groups.filter((g: any) => g._id.toString() !== params.groupId);
  await project.save();
  return NextResponse.json({ ok: true });
}
