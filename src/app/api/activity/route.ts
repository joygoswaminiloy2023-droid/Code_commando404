import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Activity from "@/models/Activity";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const items = await Activity.find().sort({ createdAt: -1 }).limit(8).lean();
  return NextResponse.json(items);
}