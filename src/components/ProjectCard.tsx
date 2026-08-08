"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Users, FolderKanban } from "lucide-react";
import clsx from "clsx";

const statusStyle: Record<string, string> = {
  planning: "text-mute border-line",
  active: "text-signal border-signal/30",
  "on-hold": "text-amber border-amber/30",
  completed: "text-paper border-line"
};

export default function ProjectCard({ project, href }: { project: any; href: string }) {
  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Link
        href={href}
        className="block bg-panel border border-line rounded-xl2 p-5 hover:border-signal/30 transition-colors h-full"
      >
        <div className="flex items-start justify-between mb-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${project.color}22`, border: `1px solid ${project.color}55` }}>
            <FolderKanban size={18} style={{ color: project.color }} />
          </div>
          <span className={clsx("text-[10px] font-mono uppercase tracking-wide px-2 py-0.5 rounded border", statusStyle[project.status] || statusStyle.active)}>
            {project.status}
          </span>
        </div>
        <h3 className="font-display text-lg text-paper mb-1 truncate">{project.name}</h3>
        {project.description && <p className="text-sm text-mute line-clamp-2 mb-4">{project.description}</p>}
        <div className="flex items-center gap-2 text-xs text-mute mt-auto">
          <Users size={13} />
          {project.members?.length || 0} member{project.members?.length === 1 ? "" : "s"}
          {project.groups?.length > 0 && <span>· {project.groups.length} group{project.groups.length === 1 ? "" : "s"}</span>}
        </div>
      </Link>
    </motion.div>
  );
}
