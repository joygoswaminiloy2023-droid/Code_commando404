import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Project from "@/models/Project";

export async function PATCH(req: Request, { params }: { params: { id: string; resourceId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Only an admin can edit project files or links." }, { status: 403 });
  }
  await connectDB();
  const body = await req.json();

  const project: any = await Project.findById(params.id);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const resource = project.resources.id(params.resourceId);
  if (!resource) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (body.name !== undefined) resource.name = body.name.trim();
  if (body.url !== undefined) resource.url = body.url.trim();

  await project.save();
  const populated = await Project.findById(project._id).populate("resources.uploadedBy", "name avatarColor avatarUrl").lean();
  return NextResponse.json((populated as any).resources);
}

export async function DELETE(req: Request, { params }: { params: { id: string; resourceId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Only an admin can delete project files or links." }, { status: 403 });
  }
  await connectDB();
  const project: any = await Project.findById(params.id);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  project.resources = project.resources.filter((r: any) => r._id.toString() !== params.resourceId);
  await project.save();
  return NextResponse.json({ ok: true });
}
