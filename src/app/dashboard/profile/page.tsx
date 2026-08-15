"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { Linkedin, Github } from "lucide-react";
import AvatarUpload from "@/components/AvatarUpload";

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const [form, setForm] = useState({ title: "", bio: "", linkedinUrl: "", githubUrl: "" });
  const [avatarUrl, setAvatarUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/profile").then((r) => r.json()).then((u) => {
      setForm({
        title: u.title || "",
        bio: u.bio || "",
        linkedinUrl: u.linkedinUrl || "",
        githubUrl: u.githubUrl || ""
      });
      setAvatarUrl(u.avatarUrl || "");
      setLoading(false);
    });
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    setSaving(false);
    if (res.ok) {
      toast.success("Profile updated.");
      await update({ title: form.title });
    } else toast.error("Couldn't save changes.");
  }

  async function handleAvatarUploaded(url: string) {
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ avatarUrl: url })
    });
    if (!res.ok) {
      toast.error("The photo uploaded but couldn't be saved to your profile. Try again.");
      return;
    }
    setAvatarUrl(url);
    await update({ avatarUrl: url });
    toast.success("Profile photo saved — visible to everyone now.");
  }

  const user = session?.user as any;
  if (!user || loading) return <p className="text-mute text-sm">Loading...</p>;

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-4 mb-8">
        <AvatarUpload
          name={user.name}
          avatarUrl={avatarUrl}
          avatarColor={user.avatarColor}
          size={64}
          onUploaded={handleAvatarUploaded}
        />
        <div>
          <h1 className="font-display text-2xl text-paper">{user.name}</h1>
          <p className="text-mute text-sm break-all">{user.email} · {user.role === "admin" ? "Admin" : "Member"}</p>
        </div>
      </div>

      <form onSubmit={save} className="bg-panel border border-line rounded-xl2 p-6">
        <label className="block text-xs font-mono uppercase tracking-wide text-mute mb-2">Role / title</label>
        <input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="w-full bg-ink border border-line rounded-lg px-4 py-2.5 text-paper mb-4 focus-ring outline-none text-sm"
          placeholder="Frontend Developer"
        />

        <label className="block text-xs font-mono uppercase tracking-wide text-mute mb-2">Bio</label>
        <textarea
          value={form.bio}
          onChange={(e) => setForm({ ...form, bio: e.target.value })}
          rows={4}
          className="w-full bg-ink border border-line rounded-lg px-4 py-2.5 text-paper mb-6 focus-ring outline-none text-sm resize-none"
          placeholder="A line about what you work on."
        />

        <label className="block text-xs font-mono uppercase tracking-wide text-mute mb-2 flex items-center gap-1.5">
          <Linkedin size={13} /> LinkedIn profile
        </label>
        <input
          value={form.linkedinUrl}
          onChange={(e) => setForm({ ...form, linkedinUrl: e.target.value })}
          className="w-full bg-ink border border-line rounded-lg px-4 py-2.5 text-paper mb-4 focus-ring outline-none text-sm"
          placeholder="https://linkedin.com/in/..."
        />

        <label className="block text-xs font-mono uppercase tracking-wide text-mute mb-2 flex items-center gap-1.5">
          <Github size={13} /> GitHub profile
        </label>
        <input
          value={form.githubUrl}
          onChange={(e) => setForm({ ...form, githubUrl: e.target.value })}
          className="w-full bg-ink border border-line rounded-lg px-4 py-2.5 text-paper mb-6 focus-ring outline-none text-sm"
          placeholder="https://github.com/..."
        />

        <button
          disabled={saving}
          className="w-full sm:w-auto bg-signal text-ink font-medium rounded-lg px-5 py-2.5 hover:bg-signal2 transition-colors disabled:opacity-60 text-sm"
        >
          {saving ? "Saving..." : "Save changes"}
        </button>
      </form>
    </div>
  );
}