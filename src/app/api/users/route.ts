import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Task from "@/models/Task";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const users = await User.find({ role: "member" }).select("-password").lean();

  // Work out live free/busy per member: anyone with an open task is "busy",
  // everyone else is "available" — this is derived, not stored, so it can
  // never drift out of sync with actual task state.
  const openTasks = await Task.find({ status: "pending" }).select("assignees").lean();
  const busyIds = new Set(openTasks.flatMap((t: any) => (t.assignees || []).map((a: any) => a.toString())));

  const withStatus = users.map((u: any) => ({
    ...u,
    status: busyIds.has(u._id.toString()) ? "busy" : "available"
  }));

  return NextResponse.json(withStatus);
}
