import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const ORDER_EVENTS = ["order.created", "order.paid", "payment.received", "order.status_changed"] as const;

function isSafeUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:") return false;
    const h = u.hostname.toLowerCase();
    if (h === "localhost" || h.endsWith(".local") || h.endsWith(".internal")) return false;
    if (/^\d+\.\d+\.\d+\.\d+$/.test(h)) {
      const [a, b] = h.split(".").map(Number);
      if (a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168)) return false;
    }
    if (h.startsWith("[") || h.includes(":")) return false;
    return true;
  } catch {
    return false;
  }
}

async function hmac(secret: string, msg: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(msg));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

type Hook = { id: string; user_id: string; url: string; secret: string; events: string[] };

async function deliver(admin: ReturnType<typeof createClient>, hook: Hook, event: string, data: Record<string, unknown>) {
  const payload = { id: crypto.randomUUID(), event, created_at: new Date().toISOString(), data };
  const body = JSON.stringify(payload);
  const ts = Math.floor(Date.now() / 1000).toString();
  let status: number | null = null;
  let text = "";
  if (!isSafeUrl(hook.url)) {
    text = "Blocked: URL must be a public https address";
  } else {
    try {
      const sig = await hmac(hook.secret, `${ts}.${body}`);
      const res = await fetch(hook.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "WorldFace-Webhooks/1.0",
          "X-WorldFace-Event": event,
          "X-WorldFace-Timestamp": ts,
          "X-WorldFace-Signature": `sha256=${sig}`,
        },
        body,
        redirect: "manual",
        signal: AbortSignal.timeout(8000),
      });
      status = res.status;
      text = (await res.text()).slice(0, 500);
    } catch (e) {
      text = `Delivery failed: ${(e as Error).message}`.slice(0, 500);
    }
  }
  await admin.from("webhook_deliveries").insert({ webhook_id: hook.id, user_id: hook.user_id, event, payload, status_code: status, response: text });
  return { event, status };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.toLowerCase().startsWith("bearer ")) return json({ error: "Unauthorized" }, 401);
  const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: auth } = await userClient.auth.getUser();
  const user = auth?.user;
  if (!user) return json({ error: "Unauthorized" }, 401);
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  let input: { test_webhook_id?: string; order_id?: string; kind?: "placed" | "status" };
  try { input = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }

  // Test delivery to one of the caller's own webhooks.
  if (input.test_webhook_id) {
    const { data: hook } = await admin.from("webhooks").select("id,user_id,url,secret,events").eq("id", input.test_webhook_id).eq("user_id", user.id).maybeSingle();
    if (!hook) return json({ error: "Webhook not found" }, 404);
    const r = await deliver(admin, hook as Hook, "webhook.test", { message: "Hello from WorldFace" });
    return json({ results: [r] });
  }

  if (!input.order_id || !/^[0-9a-f-]{36}$/i.test(input.order_id)) return json({ error: "order_id required" }, 400);
  const { data: order } = await admin.from("orders").select("*").eq("id", input.order_id).maybeSingle();
  if (!order || (order.buyer_id !== user.id && order.seller_id !== user.id)) return json({ error: "Order not found" }, 404);

  const events: string[] = input.kind === "status" ? ["order.status_changed"] : ["order.created", "order.paid", "payment.received"];
  const { data: hooks } = await admin.from("webhooks").select("id,user_id,url,secret,events").eq("user_id", order.seller_id).eq("active", true);
  const data = {
    order_id: order.id, status: order.status, product_id: order.product_id, product_title: order.product_title,
    quantity: order.quantity, total: order.total, currency: "COINS", buyer_id: order.buyer_id, created_at: order.created_at,
  };
  const results: unknown[] = [];
  for (const hook of (hooks ?? []) as Hook[]) {
    for (const ev of events) {
      if (!hook.events.includes(ev) || !ORDER_EVENTS.includes(ev as typeof ORDER_EVENTS[number])) continue;
      // Avoid duplicate deliveries for the same order/event/status.
      const { count } = await admin.from("webhook_deliveries").select("id", { count: "exact", head: true })
        .eq("webhook_id", hook.id).eq("event", ev).eq("payload->data->>order_id", order.id).eq("payload->data->>status", order.status);
      if ((count ?? 0) > 0) continue;
      results.push(await deliver(admin, hook, ev, data));
    }
  }
  return json({ results });
});
