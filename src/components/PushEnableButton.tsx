"use client";

import { useEffect, useState } from "react";
import { BellRing, BellOff } from "lucide-react";
import toast from "react-hot-toast";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export default function PushEnableButton() {
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    setSupported(true);

    navigator.serviceWorker.register("/sw.js").then(async (reg) => {
      const existing = await reg.pushManager.getSubscription();
      setSubscribed(!!existing);
    });
  }, []);

  async function enable() {
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!publicKey) {
      toast.error("Push isn't configured on this deployment yet.");
      return;
    }
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast.error("Notifications were blocked — enable them in your browser/phone settings to turn this on.");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      });
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: sub })
      });
      setSubscribed(true);
      toast.success("Push notifications are on for this device.");
    } catch {
      toast.error("Couldn't turn on notifications. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint })
        });
        await sub.unsubscribe();
      }
      setSubscribed(false);
      toast.success("Push notifications turned off for this device.");
    } catch {
      toast.error("Couldn't turn that off. Try again.");
    } finally {
      setBusy(false);
    }
  }

  if (!supported) return null;

  return (
    <button
      onClick={subscribed ? disable : enable}
      disabled={busy}
      title={subscribed ? "Turn off push notifications on this device" : "Turn on push notifications on this device"}
      className="p-2 rounded-lg hover:bg-panel2 transition-colors text-paper disabled:opacity-50"
    >
      {subscribed ? <BellRing size={19} className="text-signal" /> : <BellOff size={19} />}
    </button>
  );
}