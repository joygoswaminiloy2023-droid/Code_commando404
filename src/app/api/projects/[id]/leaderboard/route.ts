import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Task from "@/models/Task";
import Project from "@/models/Project";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const me = session.user as any;

  const project: any = await Project.findById(params.id).populate("members", "name avatarColor avatarUrl title").lean();
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const isMember = project.members.some((m: any) => m._id.toString() === me.id);
  if (me.role !== "admin" && !isMember) {
    return NextResponse.json({ error: "You don't have access to this project." }, { status: 403 });
  }

  const tasks = await Task.find({ project: params.id }).lean();

  const stats = new Map<string, { completed: number; onTime: number }>();
  for (const t of tasks as any[]) {
    if (t.status !== "completed") continue;
    const onTime = t.completedAt && new Date(t.completedAt) <= new Date(t.deadline);
    for (const assigneeId of t.assignees) {
      const key = assigneeId.toString();
      const entry = stats.get(key) || { completed: 0, onTime: 0 };
      entry.completed += 1;
      if (onTime) entry.onTime += 1;
      stats.set(key, entry);
    }
  }

  const leaderboard = project.members
    .map((m: any) => {
      const s = stats.get(m._id.toString()) || { completed: 0, onTime: 0 };
      const onTimeRate = s.completed > 0 ? s.onTime / s.completed : 0;
      return { user: m, completed: s.completed, onTime: s.onTime, onTimeRate };
    })
    // Rank by total completed tasks first, then by on-time rate as the tiebreaker.
    .sort((a: any, b: any) => b.completed - a.completed || b.onTimeRate - a.onTimeRate);

  return NextResponse.json(leaderboard);
}
