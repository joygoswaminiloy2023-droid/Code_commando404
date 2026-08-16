import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const user = await User.findById((session.user as any).id).select("-password").lean();
  return NextResponse.json(user);
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const { title, bio, avatarUrl, linkedinUrl, githubUrl } = await req.json();
  const update: any = {};
  if (title !== undefined) update.title = title;
  if (bio !== undefined) update.bio = bio;
  if (avatarUrl !== undefined) update.avatarUrl = avatarUrl;
  if (linkedinUrl !== undefined) update.linkedinUrl = linkedinUrl;
  if (githubUrl !== undefined) update.githubUrl = githubUrl;
  const user = await User.findByIdAndUpdate(
    (session.user as any).id,
    { $set: update },
    { new: true }
  ).select("-password");
  return NextResponse.json(user);
}