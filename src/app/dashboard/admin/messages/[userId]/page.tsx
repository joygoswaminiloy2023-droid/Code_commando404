"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft } from "lucide-react";
import MessageThread from "@/components/MessageThread";

export default function AdminThreadPage() {
  const { userId } = useParams<{ userId: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const me = session?.user as any;
  const [memberName, setMemberName] = useState("");

  useEffect(() => {
    fetch(`/api/users/${userId}`).then((r) => r.json()).then((d) => setMemberName(d.user?.name || ""));
  }, [userId]);

  if (!me) return null;

  return (
    <div className="max-w-2xl">
      <button onClick={() => router.push("/dashboard/admin/messages")} className="flex items-center gap-1.5 text-mute hover:text-paper text-sm mb-4">
        <ArrowLeft size={14} /> All messages
      </button>
      <h1 className="font-display text-2xl text-paper mb-1">{memberName || "Conversation"}</h1>
      <p className="text-mute text-sm mb-6">Only you and {memberName || "this member"} can see this thread.</p>
      <MessageThread
        meId={me.id}
        fetchUrl={`/api/messages?user=${userId}`}
        postUrl="/api/messages"
        extraPostBody={{ userId }}
        emptyLabel="No messages in this thread yet."
        otherPartyLabel={() => memberName || "Member"}
      />
    </div>
  );
}
