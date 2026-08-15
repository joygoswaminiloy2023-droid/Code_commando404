import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import ShowcaseProject from "@/models/ShowcaseProject";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const projects = await ShowcaseProject.find()
    .populate("addedBy", "name avatarColor avatarUrl")
    .sort({ createdAt: -1 })
    .lean();
  return NextResponse.json(projects);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const { title, description, liveUrl, githubUrl, imageUrl } = await req.json();
  if (!title?.trim()) return NextResponse.json({ error: "Title is required." }, { status: 400 });

  const project = await ShowcaseProject.create({
    title: title.trim(),
    description: description || "",
    liveUrl: liveUrl || "",
    githubUrl: githubUrl || "",
    imageUrl: imageUrl || "",
    addedBy: (session.user as any).id
  });
  const populated = await project.populate("addedBy", "name avatarColor avatarUrl");
  return NextResponse.json(populated, { status: 201 });
}
