"use client";

import { MessageSquare, Video, Users2, ArrowUpRight } from "lucide-react";
import Link from "next/link";

const rooms = [
  {
    name: "Discord",
    description: "The Code Commando 404 server — general chat, quick questions, and async discussion.",
    href: "https://discord.gg/DsFbY9b54",
    icon: MessageSquare,
    color: "#5865F2"
  },
  {
    name: "Google Meet",
    description: "Start an instant video call — a fresh meeting link is created each time you click.",
    href: "https://meet.google.com/new",
    icon: Video,
    color: "#00AC47"
  },
  {
    name: "WhatsApp Community",
    description: "Fast, mobile-first updates and pings for the whole team.",
    href: "https://chat.whatsapp.com/FwXKVJNyo1jI9kIFD4CSsO",
    icon: Users2,
    color: "#25D366"
  }
];

export default function MeetingRoomPage() {
  return (
    <div>
      <h1 className="font-display text-3xl text-paper mb-1">Meeting room</h1>
      <p className="text-mute text-sm mb-8">
        Jump into a call or chat — these open the real app/site, since none of them allow embedding directly here.
      </p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {rooms.map((r) => {
          const Icon = r.icon;
          return (
            <Link
              key={r.name}
              href={r.href}
              target="_blank"
              rel="noreferrer"
              className="group bg-panel border border-line rounded-xl2 p-5 hover:border-signal/30 transition-colors flex flex-col"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-11 h-11 rounded-lg flex items-center justify-center" style={{ background: `${r.color}22`, border: `1px solid ${r.color}55` }}>
                  <Icon size={20} style={{ color: r.color }} />
                </div>
                <ArrowUpRight size={16} className="text-mute group-hover:text-signal transition-colors" />
              </div>
              <h3 className="font-display text-lg text-paper mb-1">{r.name}</h3>
              <p className="text-sm text-mute leading-relaxed">{r.description}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}