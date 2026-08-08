import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Only an admin can block or unblock a member." }, { status: 403 });
  }
  if ((session.user as any).id === params.id) {
    return NextResponse.json({ error: "You can't block yourself." }, { status: 400 });
  }
  await connectDB();
  const { blocked } = await req.json();

  const user = await User.findByIdAndUpdate(
    params.id,
    { $set: { isBlocked: !!blocked } },
    { new: true }
  ).select("-password");

  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(user);
}
