"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

// Every page under /dashboard/admin/* is wrapped by this layout, so a single
// guard here protects all of them at once — no page below needs to (or
// should have to) remember to check role itself. Without this, a signed-in
// member could navigate straight to an admin URL and the page would render
// using whatever it can scrape from APIs, which is exactly what happened
// with the admin message-thread view before this fix.
export default function AdminSectionLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated" && (session?.user as any)?.role !== "admin") {
      router.replace("/dashboard/user");
    }
  }, [status, session, router]);

  if (status === "loading") {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-signal border-t-transparent animate-spin" />
      </div>
    );
  }

  if (status === "authenticated" && (session?.user as any)?.role !== "admin") {
    return null;
  }

  return <>{children}</>;
}