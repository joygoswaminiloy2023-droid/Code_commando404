import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Task from "@/models/Task";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const me = session.user as any;
  if (me.role !== "admin" && me.id !== params.id) {
    return NextResponse.json({ error: "You can only view your own profile." }, { status: 403 });
  }

  await connectDB();
  const user = await User.findById(params.id).select("-password").lean();
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const tasks = await Task.find({ assignees: params.id })
    .populate("assignedBy", "name avatarColor avatarUrl")
    .populate("project", "name color")
    .sort({ createdAt: -1 })
    .lean();

  const completed = tasks.filter((t: any) => t.status === "completed");
  const onTime = completed.filter((t: any) => t.completedAt && new Date(t.completedAt) <= new Date(t.deadline));

  return NextResponse.json({
    user,
    tasks,
    stats: {
      total: tasks.length,
      completed: completed.length,
      pending: tasks.length - completed.length,
      onTime: onTime.length,
      late: completed.length - onTime.length
    }
  });
}