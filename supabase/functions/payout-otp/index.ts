import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

async function requireUser(req: Request) {
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.toLowerCase().startsWith("bearer ")) return { user: null, error: json({ error: "Unauthorized" }, 401) };
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data, error } = await sb.auth.getUser();
  if (error || !data?.user) return { user: null, error: json({ error: "Unauthorized" }, 401) };
  return { user: data.user, error: null };
}

const admin = () =>
  createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

async function sha256(v: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(v));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function maskPhone(p?: string | null) {
  if (!p) return null;
  const s = p.replace(/\s+/g, "");
  return s.length < 5 ? "***" : `${s.slice(0, 4)}****${s.slice(-2)}`;
}

async function trySendSms(to: string, code: string) {
  const gwKey = Deno.env.get("GATEWAYAPI_API_KEY");
  const lovKey = Deno.env.get("LOVABLE_API_KEY");
  if (!gwKey || !lovKey) return false;
  const digits = to.replace(/\D/g, "");
  const resp = await fetch("https://connector-gateway.lovable.dev/gatewayapi/mobile/single", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovKey}`,
      "X-Connection-Api-Key": gwKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender: "WorldFace",
      recipient: Number(digits),
      message: `WorldFace payout OTP: ${code}. Inaisha baada ya dakika 10.`,
    }),
  });
  if (!resp.ok) {
    console.error(`SMS send failed [${resp.status}]: ${await resp.text()}`);
    return false;
  }
  return true;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = await requireUser(req);
    if (auth.error) return auth.error;
    const user = auth.user!;
    const db = admin();
    const body = await req.json().catch(() => ({}));
    const action = body?.action;

    if (action === "start") {
      const purpose = body?.purpose;
      if (!["payout_request", "method_change"].includes(purpose)) return json({ error: "Invalid purpose" }, 400);

      let payload: Record<string, unknown> = {};
      if (purpose === "payout_request") {
        const amount = Number(body?.amount);
        const methodId = typeof body?.method_id === "string" ? body.method_id : null;
        if (!Number.isFinite(amount) || amount <= 0 || amount > 10_000_000) return json({ error: "Kiasi si sahihi" }, 400);
        if (!methodId) return json({ error: "Chagua njia ya malipo" }, 400);
        const { data: method } = await db.from("payout_methods").select("id,currency").eq("id", methodId).eq("user_id", user.id).maybeSingle();
        if (!method) return json({ error: "Njia ya malipo haipo" }, 400);
        payload = { amount, method_id: methodId, currency: method.currency };
      } else {
        const methodId = typeof body?.method_id === "string" ? body.method_id : null;
        if (!methodId) return json({ error: "Njia ya malipo inahitajika" }, 400);
        const { data: method } = await db.from("payout_methods").select("id").eq("id", methodId).eq("user_id", user.id).maybeSingle();
        if (!method) return json({ error: "Njia ya malipo haipo" }, 400);
        payload = { method_id: methodId, set_default: true };
      }

      // Invalidate previous unused codes for this purpose
      await db.from("payout_otp_codes").update({ consumed_at: new Date().toISOString() })
        .eq("user_id", user.id).eq("purpose", purpose).is("consumed_at", null);

      const code = String(Math.floor(100000 + Math.random() * 900000));
      const { data: row, error } = await db.from("payout_otp_codes").insert({
        user_id: user.id,
        code_hash: await sha256(code),
        purpose,
        payload,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      }).select("id").single();
      if (error) throw error;

      const { data: contact } = await db.from("profile_contacts")
        .select("phone_country_code, phone_number").eq("user_id", user.id).maybeSingle();
      const phone = contact?.phone_number ? `${contact.phone_country_code ?? ""}${contact.phone_number}` : null;
      const sent = phone ? await trySendSms(phone, code) : false;

      return json({
        otp_id: row.id,
        delivered: sent,
        destination: sent ? maskPhone(phone) : maskPhone(user.email ?? phone),
        // Hakuna SMS provider iliyounganishwa: tunarudisha code kwa mmiliki wa akaunti pekee.
        fallback_code: sent ? null : code,
      });
    }

    if (action === "confirm") {
      const otpId = typeof body?.otp_id === "string" ? body.otp_id : null;
      const code = typeof body?.code === "string" ? body.code.trim() : "";
      if (!otpId || !/^\d{6}$/.test(code)) return json({ error: "OTP si sahihi" }, 400);

      const { data: otp } = await db.from("payout_otp_codes").select("*").eq("id", otpId).eq("user_id", user.id).maybeSingle();
      if (!otp || otp.consumed_at) return json({ error: "OTP haipatikani au imetumika" }, 400);
      if (new Date(otp.expires_at).getTime() < Date.now()) return json({ error: "OTP imeisha muda" }, 400);
      if (otp.attempts >= 5) return json({ error: "Umejaribu mara nyingi mno" }, 429);

      if (await sha256(code) !== otp.code_hash) {
        await db.from("payout_otp_codes").update({ attempts: otp.attempts + 1 }).eq("id", otp.id);
        return json({ error: "OTP si sahihi" }, 400);
      }

      const payload = (otp.payload ?? {}) as Record<string, any>;

      if (otp.purpose === "payout_request") {
        const { data: revenue } = await db.from("creator_revenue_logs").select("amount").eq("user_id", user.id);
        const { data: reqs } = await db.from("payout_requests").select("amount,status").eq("user_id", user.id);
        const earned = (revenue ?? []).reduce((s, r: any) => s + Number(r.amount), 0);
        const locked = (reqs ?? []).filter((r: any) => ["pending", "processing", "paid"].includes(r.status))
          .reduce((s, r: any) => s + Number(r.amount), 0);
        const available = earned - locked;
        if (Number(payload.amount) > available) return json({ error: "Salio halitoshi" }, 400);

        const { data: created, error } = await db.from("payout_requests").insert({
          user_id: user.id,
          method_id: payload.method_id,
          amount: payload.amount,
          currency: payload.currency ?? "KES",
        }).select("id").single();
        if (error) throw error;
        await db.from("payout_otp_codes").update({ consumed_at: new Date().toISOString() }).eq("id", otp.id);
        return json({ ok: true, payout_request_id: created.id });
      }

      // method_change -> set default
      await db.from("payout_methods").update({ is_default: false }).eq("user_id", user.id);
      const { error } = await db.from("payout_methods").update({ is_default: true }).eq("id", payload.method_id).eq("user_id", user.id);
      if (error) throw error;
      await db.from("payout_otp_codes").update({ consumed_at: new Date().toISOString() }).eq("id", otp.id);
      return json({ ok: true });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    console.error("payout-otp error", e);
    return json({ error: e instanceof Error ? e.message : "Server error" }, 500);
  }
});
