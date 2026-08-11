"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutGrid, Users, User, FolderKanban, LogOut, Terminal, X,
  MessageCircle, StickyNote, Sparkles, Video
} from "lucide-react";
import clsx from "clsx";

export default function Sidebar({
  role,
  mobileOpen,
  onCloseMobile
}: {
  role: "admin" | "member";
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}) {
  const pathname = usePathname();

  const adminLinks = [
    { href: "/dashboard/admin", label: "Overview", icon: LayoutGrid },
    { href: "/dashboard/admin/projects", label: "Projects", icon: FolderKanban },
    { href: "/dashboard/admin/users", label: "Team", icon: Users },
    { href: "/dashboard/admin/messages", label: "Messages", icon: MessageCircle },
    { href: "/dashboard/showcase", label: "Showcase", icon: Sparkles },
    { href: "/dashboard/meeting-room", label: "Meeting room", icon: Video },
    { href: "/dashboard/notes", label: "Notes", icon: StickyNote },
    { href: "/dashboard/profile", label: "Profile", icon: User }
  ];
  const memberLinks = [
    { href: "/dashboard/user", label: "My projects", icon: FolderKanban },
    { href: "/dashboard/messages", label: "Message admin", icon: MessageCircle },
    { href: "/dashboard/showcase", label: "Showcase", icon: Sparkles },
    { href: "/dashboard/meeting-room", label: "Meeting room", icon: Video },
    { href: "/dashboard/notes", label: "Notes", icon: StickyNote },
    { href: "/dashboard/profile", label: "Profile", icon: User }
  ];

  const links = role === "admin" ? adminLinks : memberLinks;
  const topLevel = ["/dashboard/admin", "/dashboard/user"];

  const content = (
    <>
      <div className="flex items-center justify-between mb-10 px-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-signal/10 border border-signal/30 flex items-center justify-center">
            <Terminal size={16} className="text-signal" />
          </div>
          <div className="leading-tight">
            <div className="font-display text-sm text-paper tracking-tight">Code Commando</div>
            <div className="font-mono text-[10px] text-signal tracking-[0.2em]">404</div>
          </div>
        </div>
        <button onClick={onCloseMobile} className="md:hidden text-mute hover:text-paper">
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto">
        {links.map((link) => {
          const active = pathname === link.href || (!topLevel.includes(link.href) && pathname.startsWith(link.href));
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onCloseMobile}
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                active ? "bg-signal/10 text-signal border border-signal/20" : "text-mute hover:text-paper hover:bg-panel2"
              )}
            >
              <Icon size={16} />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-mute hover:text-coral hover:bg-panel2 transition-colors"
      >
        <LogOut size={16} />
        Sign out
      </button>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 bg-panel border-r border-line min-h-screen flex-col p-5 sticky top-0 h-screen">
        {content}
      </aside>

      {/* Mobile off-canvas sidebar */}
      <div
        className={clsx(
          "md:hidden fixed inset-0 z-50 transition-opacity",
          mobileOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        )}
      >
        <div className="absolute inset-0 bg-black/60" onClick={onCloseMobile} />
        <aside
          className={clsx(
            "absolute left-0 top-0 h-full w-72 bg-panel border-r border-line flex flex-col p-5 transition-transform duration-200",
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          {content}
        </aside>
      </div>
    </>
  );
}