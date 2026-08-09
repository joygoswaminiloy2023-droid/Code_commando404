import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Announcement from "@/models/Announcement";
import User from "@/models/User";
import Notification from "@/models/Notification";
import { sendPushToUsers } from "@/lib/push";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const announcements = await Announcement.find()
    .populate("postedBy", "name avatarColor")
    .sort({ createdAt: -1 })
    .limit(30)
    .lean();
  return NextResponse.json(announcements);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Only an admin can post announcements." }, { status: 403 });
  }
  await connectDB();
  const { message } = await req.json();
  if (!message?.trim()) return NextResponse.json({ error: "Message required." }, { status: 400 });

  const announcement = await Announcement.create({
    message,
    postedBy: (session.user as any).id
  });
  const populated = await announcement.populate("postedBy", "name avatarColor");

  // Fan the announcement out as a personal notification too, so it shows up
  // in each member's notification bell, not just the live feed.
  const members = await User.find({ role: "member" }).select("_id").lean();
  await Notification.insertMany(
    members.map((m: any) => ({
      recipient: m._id,
      message: `Announcement: ${message}`,
      type: "announcement"
    }))
  );

  sendPushToUsers(
    members.map((m: any) => m._id.toString()),
    { title: "Announcement", body: message, url: "/dashboard" }
  );

  return NextResponse.json(populated, { status: 201 });
}