import webpush from "web-push";
import { connectDB } from "@/lib/db";
import PushSubscription from "@/models/PushSubscription";

let configured = false;
function ensureConfigured() {
  if (configured) return;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return; // push is optional — app still works without it
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:admin@example.com",
    publicKey,
    privateKey
  );
  configured = true;
}

type PushPayload = { title: string; body: string; url?: string };

// Sends a push notification to every device a user has subscribed on
// (phone, laptop, etc — each browser/install gets its own subscription).
// Never throws: a push failure should never break the API call that
// triggered it (task assignment, completion, announcement...).
export async function sendPushToUsers(userIds: string[], payload: PushPayload) {
  ensureConfigured();
  if (!configured || userIds.length === 0) return;

  try {
    await connectDB();
    console.log(
      "PushSubscription diagnostic:",
      "type=", typeof PushSubscription,
      "hasFind=", typeof (PushSubscription as any)?.find,
      "modelName=", (PushSubscription as any)?.modelName
    );
    const subs = await PushSubscription.find({ user: { $in: userIds } }).lean();
    const body = JSON.stringify(payload);

    await Promise.all(
      subs.map(async (sub: any) => {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: sub.keys },
            body
          );
        } catch (err: any) {
          // 404/410 = the browser unsubscribed or the subscription expired —
          // clean it up so we stop trying to send to a dead endpoint.
          if (err?.statusCode === 404 || err?.statusCode === 410) {
            await PushSubscription.deleteOne({ _id: sub._id });
          } else {
            console.error("Push send failed:", err?.message || err);
          }
        }
      })
    );
  } catch (err) {
    console.error("Push dispatch failed:", err);
  }
}