"use client";

import { useSession } from "next-auth/react";
import MessageThread from "@/components/MessageThread";

export default function MemberMessagesPage() {
  const { data: session } = useSession();
  const me = session?.user as any;
  if (!me) return null;

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-3xl text-paper mb-1">Message admin</h1>
      <p className="text-mute text-sm mb-6">Private to you and the admin — no other member can see this.</p>
      <MessageThread
        meId={me.id}
        fetchUrl="/api/messages"
        postUrl="/api/messages"
        emptyLabel="No messages yet — say hi if something's unclear."
        otherPartyLabel={() => "Admin"}
      />
    </div>
  );
}
