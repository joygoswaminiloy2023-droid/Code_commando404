import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import ShowcaseProject from "@/models/ShowcaseProject";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const me = session.user as any;

  const project: any = await ShowcaseProject.findById(params.id);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (me.role !== "admin" && project.addedBy.toString() !== me.id) {
    return NextResponse.json({ error: "You can only edit your own showcase entries." }, { status: 403 });
  }

  const body = await req.json();
  const allowed = ["title", "description", "liveUrl", "githubUrl", "imageUrl"];
  for (const key of allowed) {
    if (body[key] !== undefined) project[key] = body[key];
  }
  await project.save();
  const populated = await project.populate("addedBy", "name avatarColor avatarUrl");
  return NextResponse.json(populated);
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const me = session.user as any;

  const project: any = await ShowcaseProject.findById(params.id);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (me.role !== "admin" && project.addedBy.toString() !== me.id) {
    return NextResponse.json({ error: "You can only delete your own showcase entries." }, { status: 403 });
  }
  await ShowcaseProject.findByIdAndDelete(params.id);
  return NextResponse.json({ ok: true });
}