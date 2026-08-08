import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Notification from "@/models/Notification";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const notifications = await Notification.find({ recipient: (session.user as any).id })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();
  return NextResponse.json(notifications);
}

export async function PATCH() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  await Notification.updateMany(
    { recipient: (session.user as any).id, read: false },
    { $set: { read: true } }
  );
  return NextResponse.json({ ok: true });
}
