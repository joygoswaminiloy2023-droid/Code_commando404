import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Project from "@/models/Project";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const user = session.user as any;

  // Admins see every project; members only see projects they've been added to.
  const filter = user.role === "admin" ? {} : { members: user.id };
  const projects = await Project.find(filter)
    .populate("createdBy", "name avatarColor avatarUrl")
    .populate("members", "name avatarColor avatarUrl title status")
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json(projects);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Only an admin can create projects." }, { status: 403 });
  }
  await connectDB();
  const { name, description, status, color, members, whatsappLink } = await req.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "Project name is required." }, { status: 400 });
  }

  const project = await Project.create({
    name: name.trim(),
    description: description || "",
    status: status || "active",
    color: color || "#E8342B",
    whatsappLink: whatsappLink || "",
    createdBy: (session.user as any).id,
    members: members || [],
    groups: [],
    resources: []
  });

  const populated = await project.populate([
    { path: "createdBy", select: "name avatarColor avatarUrl" },
    { path: "members", select: "name avatarColor avatarUrl title status" }
  ]);

  return NextResponse.json(populated, { status: 201 });
}
