"use client";

import { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export default function AvatarUpload({
  name,
  avatarUrl,
  avatarColor,
  size = 64,
  onUploaded
}: {
  name: string;
  avatarUrl?: string;
  avatarColor?: string;
  size?: number;
  onUploaded: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error();
      const data = await res.json();
      onUploaded(data.url);
      toast.success("Profile photo updated.");
    } catch {
      toast.error("Couldn't upload that image.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={name}
          className="rounded-full object-cover border border-line"
          style={{ width: size, height: size }}
        />
      ) : (
        <div
          className="rounded-full flex items-center justify-center text-ink font-medium"
          style={{ width: size, height: size, background: avatarColor || "#5EF1C0", fontSize: size / 2.6 }}
        >
          {name?.[0]?.toUpperCase()}
        </div>
      )}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-panel border border-line flex items-center justify-center text-paper hover:text-signal hover:border-signal/40 transition-colors"
        title="Change photo"
      >
        {uploading ? <Loader2 size={12} className="animate-spin" /> : <Camera size={12} />}
      </button>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
}
