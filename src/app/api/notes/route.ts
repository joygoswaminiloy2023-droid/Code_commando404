import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Note from "@/models/Note";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const note = await Note.findOne({ user: (session.user as any).id }).lean();
  return NextResponse.json(note || { content: "" });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const { content } = await req.json();
  const note = await Note.findOneAndUpdate(
    { user: (session.user as any).id },
    { content: content ?? "" },
    { upsert: true, new: true }
  );
  return NextResponse.json(note);
}