import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Project from "@/models/Project";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Only an admin can create a group." }, { status: 403 });
  }
  await connectDB();
  const { name, members } = await req.json();
  if (!name?.trim() || !members?.length) {
    return NextResponse.json({ error: "Group name and at least one member are required." }, { status: 400 });
  }

  const project: any = await Project.findById(params.id);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Only allow grouping people who are already members of this project.
  const validMembers = members.filter((m: string) => project.members.map((x: any) => x.toString()).includes(m));
  if (validMembers.length < 2) {
    return NextResponse.json({ error: "A group needs at least 2 project members." }, { status: 400 });
  }

  project.groups.push({ name: name.trim(), members: validMembers });
  await project.save();

  const populated = await Project.findById(project._id).populate("groups.members", "name avatarColor avatarUrl title status").lean();
  return NextResponse.json((populated as any).groups, { status: 201 });
}
