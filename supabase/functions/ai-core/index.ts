// WorldFace AI Core — Router + Memory + Safety in one gateway.
// The AI is available in every module but NEVER acts without explicit user consent:
// it can only propose actions, which the client stores in ai_action_requests for approval.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Msg = { role: "user" | "assistant"; content: string };

const MODULES = ["core", "feed", "chat", "pay", "studio", "search", "ads", "care"] as const;
type ModuleName = typeof MODULES[number];

// consent scope required for each module to read that module's data context
const MODULE_SCOPE: Record<ModuleName, string | null> = {
  core: null,
  feed: "feed_context",
  chat: "chat_context",
  pay: "wallet_context",
  studio: "studio_context",
  search: null,
  ads: "ads_context",
  care: "care_context",
};

const MODULE_PROMPT: Record<ModuleName, string> = {
  core: "You are the general WorldFace guide. Explain features, help users navigate, and answer questions.",
  feed: "You help with the social feed: captions, hashtags, post ideas, engagement tips and content quality.",
  chat: "You help with messaging: reply drafts, tone, translation (English/Swahili) and summarising long chats.",
  pay: "You explain NexaPay: wallet balance meaning, coins, gifts, payouts, currencies (KES/USD/EUR/GBP/TZS/UGX/NGN/ZAR) and fees. You NEVER move money. If the user wants a transaction, emit an ACTION proposal so they can confirm it themselves.",
  studio: "You help creators in Studio: video/photo ideas, scripts, thumbnails, titles, publishing schedule.",
  search: "You help users find people, posts, music, apps, products and communities. Suggest precise search queries and routes.",
  ads: "You are the WorldFace Ads advisor. Ads only ever run INSIDE the WorldFace app. Advise on objective, audience, placement (app_open interstitial or in-feed), budget and CPM, and estimate reach and cost. Be concrete with numbers and currency.",
  care: "You are WorldFace Premium Customer Care, available 24/7. Be warm, fast, and solution-first. Confirm the issue, give numbered steps, and offer to escalate to a human agent when the issue is billing, fraud or account loss.",
};

const SAFETY_RULES = `SAFETY & CONTROL RULES (highest priority, never break):
- You have NO autonomous control over the user's account. You never post, pay, message, delete, or change settings yourself.
- When an action is needed, output exactly one line: [[ACTION]]{"action":"<name>","label":"<short human label>","payload":{...}} and let the user approve it in the app.
- Never reveal or ask for passwords, OTP codes, private keys, card numbers or full account numbers.
- Never claim to know another user's private data. Only use context that was provided to you.
- Refuse harmful, hateful, sexual-minor, self-harm-encouraging, fraud or hacking requests, briefly and kindly.
- Reply in the user's language (English or Swahili). Be concise and practical. Markdown is fine.`;

const BLOCK_PATTERNS: { re: RegExp; reason: string }[] = [
  { re: /\b(otp|one[- ]time (code|password)|pin)\b.*\b(send|give|tell|share)\b/i, reason: "otp_solicitation" },
  { re: /\b(hack|bypass|brute[- ]?force|sql injection|steal)\b.*\b(account|password|wallet|database)\b/i, reason: "intrusion_request" },
  { re: /\b(service[_ ]?role|private key|vapid_private)\b/i, reason: "secret_probe" },
  { re: /\b(kill|hurt|harm)\b.*\b(myself|yourself|him|her|them)\b/i, reason: "harm" },
];

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return json({ error: "LOVABLE_API_KEY missing" }, 500);

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.toLowerCase().startsWith("bearer ")) return json({ error: "Unauthorized" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData, error: authErr } = await supabase.auth.getUser();
    const user = userData?.user;
    if (authErr || !user) return json({ error: "Unauthorized" }, 401);

    const body = await req.json().catch(() => ({}));
    const rawMessages = Array.isArray(body?.messages) ? body.messages : [];
    const requested = String(body?.module ?? "core");
    const language = body?.language === "sw" ? "sw" : "en";

    // ---- validation ----
    if (rawMessages.length === 0 || rawMessages.length > 40) return json({ error: "messages required (1-40)" }, 400);
    const messages: Msg[] = [];
    for (const m of rawMessages) {
      if (!m || (m.role !== "user" && m.role !== "assistant")) return json({ error: "invalid role" }, 400);
      const content = typeof m.content === "string" ? m.content : "";
      if (!content.trim() || content.length > 8000) return json({ error: "invalid message content" }, 400);
      messages.push({ role: m.role, content });
    }

    // ---- AI SAFETY ----
    const lastUser = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
    const hit = BLOCK_PATTERNS.find((p) => p.re.test(lastUser));
    if (hit) {
      await supabase.from("ai_safety_logs").insert({
        user_id: user.id, module: requested, verdict: "blocked", reason: hit.reason,
      });
      return json({
        blocked: true,
        reason: hit.reason,
        message: language === "sw"
          ? "Samahani, siwezi kusaidia na ombi hilo kwa sababu za usalama."
          : "Sorry — I can't help with that request for safety reasons.",
      }, 200);
    }

    // ---- AI ROUTER ----
    let module: ModuleName = (MODULES as readonly string[]).includes(requested)
      ? (requested as ModuleName)
      : "core";
    if (module === "core") {
      const t = lastUser.toLowerCase();
      if (/(pesa|wallet|payout|coin|gift|mpesa|balance|malipo)/.test(t)) module = "pay";
      else if (/(caption|hashtag|post|feed|chapisho)/.test(t)) module = "feed";
      else if (/(message|reply|chat|ujumbe)/.test(t)) module = "chat";
      else if (/(ad|advert|tangazo|campaign|budget|cpm)/.test(t)) module = "ads";
      else if (/(video|thumbnail|studio|script)/.test(t)) module = "studio";
      else if (/(find|search|tafuta)/.test(t)) module = "search";
      else if (/(problem|issue|help me|support|refund|shida|msaada)/.test(t)) module = "care";
    }

    // ---- consent + premium ----
    const [{ data: consents }, { data: profile }] = await Promise.all([
      supabase.from("ai_consents").select("scope, granted").eq("user_id", user.id),
      supabase.from("profiles").select("display_name, username, is_premium, premium_until, preferred_language").eq("user_id", user.id).maybeSingle(),
    ]);
    const granted = new Set((consents ?? []).filter((c) => c.granted).map((c) => c.scope));
    const isPremium = !!profile?.is_premium && (!profile?.premium_until || new Date(profile.premium_until) > new Date());

    const needed = MODULE_SCOPE[module];
    const contextAllowed = !needed || granted.has(needed);

    if (module === "care" && !isPremium) {
      return json({
        upgrade_required: true,
        message: language === "sw"
          ? "Huduma ya wateja 24/7 ya AI ni kwa watumiaji wa Premium. Pandisha akaunti yako ili kupata msaada wa papo hapo saa 24."
          : "24/7 AI customer care is a Premium feature. Upgrade to get instant round-the-clock support.",
      }, 200);
    }

    // ---- AI MEMORY (only with consent) ----
    let memoryBlock = "";
    if (granted.has("memory")) {
      const { data: mem } = await supabase
        .from("ai_memories")
        .select("content, module, kind")
        .eq("user_id", user.id)
        .order("importance", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(20);
      if (mem?.length) {
        memoryBlock = `\n\nWhat you remember about this user (they allowed memory):\n${mem.map((m) => `- [${m.module}/${m.kind}] ${m.content}`).join("\n")}`;
      }
    }

    const who = profile?.display_name || profile?.username || "the user";
    const system = [
      `You are WorldFace AI Core — one assistant present across the whole WorldFace app (Feed, Chat, NexaPay, Studio, Search, Ads, Care).`,
      `Active module: ${module}. ${MODULE_PROMPT[module]}`,
      `You are talking to ${who}. Account tier: ${isPremium ? "Premium" : "Standard"}.`,
      contextAllowed
        ? `The user has allowed you to use their ${module} context.`
        : `The user has NOT allowed access to their ${module} data. Answer generally and tell them they can grant "${needed}" permission in AI permissions if they want personalised help.`,
      granted.size ? `Granted permissions: ${[...granted].join(", ")}.` : `The user has granted no data permissions yet.`,
      SAFETY_RULES,
      language === "sw" ? "Default to Swahili." : "",
      memoryBlock,
    ].filter(Boolean).join("\n\n");

    const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: isPremium ? "google/gemini-3-pro-preview" : "google/gemini-3-flash-preview",
        stream: true,
        messages: [{ role: "system", content: system }, ...messages],
      }),
    });

    if (!upstream.ok) {
      const txt = await upstream.text();
      const status = upstream.status === 429 || upstream.status === 402 ? upstream.status : 500;
      return json({ error: `AI error ${upstream.status}: ${txt}` }, status);
    }

    await supabase.from("ai_safety_logs").insert({
      user_id: user.id, module, verdict: "allowed", reason: contextAllowed ? "context_allowed" : "context_restricted",
    });

    return new Response(upstream.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "X-AI-Module": module,
      },
    });
  } catch (e) {
    return json({ error: (e as Error).message ?? "Unknown error" }, 500);
  }
});
