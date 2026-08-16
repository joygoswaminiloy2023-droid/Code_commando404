import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Message from "@/models/Message";
import Notification from "@/models/Notification";
import User from "@/models/User";
import { sendPushToUsers } from "@/lib/push";

// GET /api/messages            → member: their own thread
// GET /api/messages?user=<id>  → admin: a specific member's thread
// GET /api/messages?threads=1  → admin: one row per member who has messaged in, with last message + unread count
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const me = session.user as any;
  const { searchParams } = new URL(req.url);

  if (searchParams.get("threads")) {
    if (me.role !== "admin") {
      return NextResponse.json({ error: "Admin only." }, { status: 403 });
    }
    const messages = await Message.find().sort({ createdAt: 1 }).populate("user", "name avatarColor avatarUrl").lean();
    const byUser = new Map<string, any>();
    for (const m of messages as any[]) {
      const uid = m.user._id.toString();
      const entry = byUser.get(uid) || { user: m.user, lastMessage: null, unread: 0 };
      entry.lastMessage = m;
      if (!m.readByAdmin && m.sender.toString() === uid) entry.unread += 1;
      byUser.set(uid, entry);
    }
    const threads = Array.from(byUser.values()).sort(
      (a, b) => new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime()
    );
    return NextResponse.json(threads);
  }

  const targetUserId = me.role === "admin" ? searchParams.get("user") : me.id;
  if (!targetUserId) return NextResponse.json({ error: "user is required" }, { status: 400 });
  if (me.role !== "admin" && targetUserId !== me.id) {
    return NextResponse.json({ error: "Not your thread." }, { status: 403 });
  }

  const messages = await Message.find({ user: targetUserId })
    .sort({ createdAt: 1 })
    .populate("sender", "name avatarColor avatarUrl role")
    .lean();

  if (me.role === "admin") {
    await Message.updateMany({ user: targetUserId, sender: targetUserId, readByAdmin: false }, { readByAdmin: true });
  } else {
    await Message.updateMany({ user: targetUserId, sender: { $ne: targetUserId }, readByUser: false }, { readByUser: true });
  }

  return NextResponse.json(messages);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const me = session.user as any;
  const { body, userId } = await req.json();
  if (!body?.trim()) return NextResponse.json({ error: "Message can't be empty." }, { status: 400 });

  const threadUserId = me.role === "admin" ? userId : me.id;
  if (!threadUserId) return NextResponse.json({ error: "userId is required for an admin reply." }, { status: 400 });

  const message = await Message.create({
    user: threadUserId,
    sender: me.id,
    body: body.trim(),
    readByAdmin: me.role === "admin",
    readByUser: me.role !== "admin"
  });
  const populated = await message.populate("sender", "name avatarColor avatarUrl role");

  if (me.role === "admin") {
    await Notification.create({ recipient: threadUserId, message: `Admin replied: ${body.trim()}`, type: "message" });
    sendPushToUsers([threadUserId], { title: "New reply from admin", body: body.trim(), url: "/dashboard/messages" });
  } else {
    const admins = await User.find({ role: "admin" }).select("_id").lean();
    await Notification.insertMany(
      admins.map((a: any) => ({ recipient: a._id, message: `${me.name}: ${body.trim()}`, type: "message" }))
    );
    sendPushToUsers(
      admins.map((a: any) => a._id.toString()),
      { title: `Message from ${me.name}`, body: body.trim(), url: `/dashboard/admin/messages/${me.id}` }
    );
  }

  return NextResponse.json(populated, { status: 201 });
}