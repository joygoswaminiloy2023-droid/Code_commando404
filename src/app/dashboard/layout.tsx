"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import NotificationBell from "@/components/NotificationBell";
import PushEnableButton from "@/components/PushEnableButton";
import { Menu } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/");
  }, [status, router]);

  if (status === "loading" || !session) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-signal border-t-transparent animate-spin" />
      </div>
    );
  }

  const user = session.user as any;

  return (
    <div className="flex min-h-screen bg-ink">
      <Sidebar role={user.role} mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-line flex items-center justify-between px-4 sm:px-8 sticky top-0 bg-ink/90 backdrop-blur z-30">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => setMobileOpen(true)} className="md:hidden text-paper p-1 -ml-1">
              <Menu size={22} />
            </button>
            <div className="font-mono text-xs text-mute uppercase tracking-wide truncate">
              {user.role === "admin" ? "Admin console" : "Your workspace"}
            </div>
          </div>
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            <span className="text-sm text-paper hidden sm:inline">{user.name}</span>
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="w-8 h-8 rounded-full object-cover border border-line" />
            ) : (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-ink text-xs font-medium"
                style={{ background: user.avatarColor || "#5EF1C0" }}
              >
                {user.name?.[0]?.toUpperCase()}
              </div>
            )}
            <PushEnableButton />
            <NotificationBell userId={user.id} />
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}