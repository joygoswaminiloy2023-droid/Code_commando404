import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Project from "@/models/Project";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Only an admin can add project files or links." }, { status: 403 });
  }
  await connectDB();
  const { kind, name, url, fileType } = await req.json();
  if (!name?.trim() || !url?.trim()) {
    return NextResponse.json({ error: "Name and URL are required." }, { status: 400 });
  }

  const project: any = await Project.findById(params.id);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  project.resources.push({
    kind: kind === "link" ? "link" : "file",
    name: name.trim(),
    url,
    fileType: fileType || (kind === "link" ? "link" : "other"),
    uploadedBy: (session.user as any).id
  });
  await project.save();

  const populated = await Project.findById(project._id).populate("resources.uploadedBy", "name avatarColor avatarUrl").lean();

  return NextResponse.json((populated as any).resources, { status: 201 });
}
