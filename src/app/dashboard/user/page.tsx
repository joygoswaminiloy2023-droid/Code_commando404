"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import ProjectCard from "@/components/ProjectCard";
import AnnouncementFeed from "@/components/AnnouncementFeed";

const POLL_MS = 20000;

export default function MyProjectsPage() {
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id;
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await fetch("/api/projects");
    if (res.ok) setProjects(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  return (
    <div>
      <h1 className="font-display text-3xl text-paper mb-1">My projects</h1>
      <p className="text-mute text-sm mb-8">Everything you've been added to, and what's due.</p>

      <div className="bg-panel border border-line rounded-xl2 p-6 mb-8">
        <h2 className="font-display text-lg text-paper mb-4">Announcements</h2>
        <AnnouncementFeed canPost={false} userId={userId} />
      </div>

      <h2 className="font-display text-lg text-paper mb-4">Projects ({projects.length})</h2>
      {loading ? (
        <p className="text-mute text-sm">Loading...</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => (
            <ProjectCard key={p._id} project={p} href={`/dashboard/user/projects/${p._id}`} />
          ))}
          {projects.length === 0 && <p className="text-mute text-sm">You haven't been added to a project yet — ask your admin.</p>}
        </div>
      )}
    </div>
  );
}