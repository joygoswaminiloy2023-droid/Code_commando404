"use client";

import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

// One socket connection per tab, shared by whichever component mounts first.
let sharedSocket: Socket | null = null;

export function useSocket(userId?: string | null) {
  const ref = useRef<Socket | null>(null);

  useEffect(() => {
    if (!sharedSocket) {
      sharedSocket = io({ path: "/socket.io" });
    }
    ref.current = sharedSocket;
    if (userId) {
      sharedSocket.emit("identify", userId);
    }
  }, [userId]);

  return ref.current || sharedSocket;
}
