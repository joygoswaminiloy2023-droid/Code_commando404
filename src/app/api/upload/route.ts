import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

function typeFromName(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  if (ext === "pdf") return "pdf";
  if (["doc", "docx"].includes(ext)) return "doc";
  if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)) return "image";
  return "other";
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;

    // On Vercel (and any other read-only/ephemeral filesystem) uploads must go
    // to real object storage or they'd vanish between requests. Vercel Blob is
    // used automatically whenever a Blob store is attached to the project
    // (which sets BLOB_READ_WRITE_TOKEN for you). Locally, without that token,
    // we fall back to writing into public/uploads so dev works with zero setup.
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const { put } = await import("@vercel/blob");
      const blob = await put(`uploads/${safeName}`, file, {
        access: "public",
        token: process.env.BLOB_READ_WRITE_TOKEN
      });
      return NextResponse.json({ name: file.name, url: blob.url, type: typeFromName(file.name) });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });
    await writeFile(path.join(uploadsDir, safeName), buffer);

    return NextResponse.json({
      name: file.name,
      url: `/uploads/${safeName}`,
      type: typeFromName(file.name)
    });
  } catch (err: any) {
    // Logged server-side so the real cause shows up in Vercel's function
    // logs — the client only ever sees a short, safe message.
    console.error("Upload failed:", err);
    return NextResponse.json({ error: err?.message || "Upload failed." }, { status: 500 });
  }
}
