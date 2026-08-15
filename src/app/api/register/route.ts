import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

export async function POST(req: Request) {
  await connectDB();
  const body = await req.json();
  const { name, email, password, title } = body;

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Name, email and password are required." }, { status: 400 });
  }

  const existingCount = await User.countDocuments();
  let role: "admin" | "member" = "member";

  if (existingCount === 0) {
    // The very first account created on a fresh install becomes the admin.
    role = "admin";
  } else {
    // Every account after that must be added by a signed-in admin, so a
    // stranger can't self-register into the workspace.
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json(
        { error: "Only an admin can add new members." },
        { status: 403 }
      );
    }
  }

  const already = await User.findOne({ email: email.toLowerCase() });
  if (already) {
    return NextResponse.json({ error: "That email is already registered." }, { status: 409 });
  }

  const hashed = await bcrypt.hash(password, 10);
  const palette = ["#E8342B", "#F5B95B", "#FF7A45", "#7C9CF5", "#E17CF5"];
  const avatarColor = palette[Math.floor(Math.random() * palette.length)];

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password: hashed,
    role,
    title: title || (role === "admin" ? "Workspace Admin" : "Member"),
    avatarColor
  });

  return NextResponse.json({
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role
  });
}
