// Ads advisor — AI estimates how much an in-app WorldFace ad should cost and how far it will reach.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) return json({ error: "LOVABLE_API_KEY missing" }, 500);

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.toLowerCase().startsWith("bearer ")) return json({ error: "Unauthorized" }, 401);

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: u } = await supabase.auth.getUser();
    if (!u?.user) return json({ error: "Unauthorized" }, 401);

    const {
      title = "", objective = "awareness", placement = "app_open",
      currency = "KES", days = 7, budget = 0, audience = "",
    } = await req.json().catch(() => ({}));

    // Real platform signals so the estimate is grounded
    const since = new Date(Date.now() - 30 * 864e5).toISOString();
    const [{ count: users }, { count: recentImpressions }] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("ad_events").select("id", { count: "exact", head: true }).gte("created_at", since),
    ]);

    const prompt = `WorldFace in-app advertising estimate. Ads run ONLY inside the WorldFace app (app-open interstitial that auto-dismisses, or in-feed promoted cards).
Platform signals: ~${users ?? 0} registered profiles, ${recentImpressions ?? 0} ad views in the last 30 days.
Request: title="${title}", objective=${objective}, placement=${placement}, audience="${audience}", duration=${days} days, currency=${currency}, budget the advertiser typed=${budget}.

Return ONLY minified JSON with these keys:
{"recommended_cpm":number,"recommended_budget":number,"currency":"${currency}","estimated_impressions":number,"estimated_clicks":number,"estimated_ctr":number,"estimated_reach":number,"daily_budget":number,"priority":number,"confidence":"low"|"medium"|"high","notes":string,"tips":string[]}
priority is 1-10 (how high this ad should sit in the app-open queue given budget & objective). notes and tips must be short and written in the same language as the title (Swahili if the title is Swahili).`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a precise media-buying analyst. Output valid JSON only, no markdown fences." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!resp.ok) {
      const txt = await resp.text();
      return json({ error: `AI error ${resp.status}: ${txt}` }, resp.status === 429 || resp.status === 402 ? resp.status : 500);
    }

    const data = await resp.json();
    const raw = (data.choices?.[0]?.message?.content ?? "").replace(/```json|```/g, "").trim();
    let estimate: Record<string, unknown>;
    try {
      estimate = JSON.parse(raw);
    } catch {
      const m = raw.match(/\{[\s\S]*\}/);
      estimate = m ? JSON.parse(m[0]) : { error: "unparsable", raw };
    }

    return json({ estimate });
  } catch (e) {
    return json({ error: (e as Error).message ?? "Unknown error" }, 500);
  }
});
