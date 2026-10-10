import webpush from "npm:web-push@3.6.7";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type PushEvent = "message" | "gift" | "live";

interface Payload {
  event: PushEvent;
  conversation_id?: string;
  recipient_id?: string;
  title?: string;
  body?: string;
  url?: string;
}

const json = (status: number, data: unknown) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  const vapidPublic = Deno.env.get("VAPID_PUBLIC_KEY");
  const vapidPrivate = Deno.env.get("VAPID_PRIVATE_KEY");
  const vapidSubject = Deno.env.get("VAPID_SUBJECT") ?? "mailto:support@worldface.app";
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  if (!vapidPublic || !vapidPrivate) return json(500, { error: "Push not configured" });

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) return json(401, { error: "Unauthorized" });

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
  const { data: userData, error: userError } = await admin.auth.getUser(authHeader.replace("Bearer ", ""));
  const caller = userData?.user;
  if (userError || !caller) return json(401, { error: "Unauthorized" });

  let payload: Payload;
  try {
    payload = await req.json();
  } catch {
    return json(400, { error: "Invalid JSON body" });
  }

  if (!payload?.event || !["message", "gift", "live"].includes(payload.event)) {
    return json(400, { error: "Invalid event" });
  }

  const title = String(payload.title ?? "WorldFace").slice(0, 80);
  const body = String(payload.body ?? "").slice(0, 200);
  const url = typeof payload.url === "string" && payload.url.startsWith("/") ? payload.url : "/";

  // Resolve recipients server-side; callers cannot push to arbitrary users.
  let recipients: string[] = [];

  if (payload.event === "message") {
    if (!payload.conversation_id) return json(400, { error: "conversation_id required" });
    const { data: parts } = await admin
      .from("conversation_participants")
      .select("user_id")
      .eq("conversation_id", payload.conversation_id);
    const ids = (parts ?? []).map((p: { user_id: string }) => p.user_id);
    if (!ids.includes(caller.id)) return json(403, { error: "Not a participant" });
    recipients = ids.filter((id) => id !== caller.id);
  } else if (payload.event === "gift") {
    if (!payload.recipient_id) return json(400, { error: "recipient_id required" });
    recipients = [payload.recipient_id].filter((id) => id !== caller.id);
  } else {
    const { data: followers } = await admin
      .from("follows")
      .select("follower_id")
      .eq("following_id", caller.id)
      .limit(2000);
    recipients = (followers ?? []).map((f: { follower_id: string }) => f.follower_id);
  }

  if (recipients.length === 0) return json(200, { sent: 0 });

  const { data: subs } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .in("user_id", recipients);

  if (!subs || subs.length === 0) return json(200, { sent: 0 });

  webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);

  const notification = JSON.stringify({
    title,
    body,
    url,
    tag: payload.event === "message" ? `msg-${payload.conversation_id}` : payload.event,
  });

  let sent = 0;
  const stale: string[] = [];

  await Promise.all(
    subs.map(async (s: { id: string; endpoint: string; p256dh: string; auth: string }) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          notification,
        );
        sent++;
      } catch (err) {
        const status = (err as { statusCode?: number })?.statusCode;
        if (status === 404 || status === 410) stale.push(s.id);
      }
    }),
  );

  if (stale.length) await admin.from("push_subscriptions").delete().in("id", stale);

  return json(200, { sent });
});
