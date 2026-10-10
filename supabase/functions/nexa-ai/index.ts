import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are NexaAI, the official AI assistant for WorldFace — a super app ecosystem.

## About WorldFace
WorldFace is an all-in-one super app that combines:
- **Nexa Social**: TikTok-style video feed, image/text posts, likes, comments, shares, trending content
- **NexaChat**: Real-time messaging with groups and media sharing
- **NexaCall**: 1-to-1 voice and video calls using WebRTC
- **NexaPay**: Virtual coin wallet system — send/receive coins, transaction history, gifting on posts
- **NexaAI**: AI-powered assistant (that's you!) for learning, help, and smart features
- **Creator Rewards**: XP points, level progression, badges, and leaderboards for top creators

## Key Features You Should Explain
- **Wallet & Coins**: Every new user gets 1,000 welcome coins. You can send coins to friends or gift them to creators on their posts.
- **Live Gifting**: Tap the gift button on any post to send coins with animated effects (Rose 🌹, Fire 🔥, Diamond 💎, Crown 👑, etc.)
- **Creator Levels**: Earn XP by posting (+10 XP), receiving likes (+2 XP), comments (+3 XP), and gifts (+1 XP per coin). Level up using formula: level = √(XP/50) + 1
- **Badges**: 8 unlockable badges like Rising Star (5 posts), Viral (100 likes), Coin King (500 coins received), Legend (Level 10)
- **Following**: Follow other users to see their content in your feed
- **Notifications**: Get alerts for likes, comments, follows, and comment replies
- **Profile**: Customize your display name, avatar, bio, location, and website

## Your Personality
- Be friendly, enthusiastic, and helpful
- Use emojis naturally but don't overdo it
- Keep answers clear and concise
- If asked about features not yet built, say "That feature is coming soon! 🚀"
- Speak the user's language (Swahili, English, etc.)
- Encourage users to explore the app and create content`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const authClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: `Bearer ${token}` } } },
    );
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "Messages array is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (messages.length === 0 || messages.length > 50) {
      return new Response(JSON.stringify({ error: "Messages must contain between 1 and 50 entries" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const sanitizedMessages = [] as Array<{ role: "user" | "assistant"; content: string }>;
    for (const m of messages) {
      if (!m || typeof m !== "object" || (m.role !== "user" && m.role !== "assistant")) {
        return new Response(JSON.stringify({ error: "Invalid message role" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (typeof m.content !== "string" || m.content.length === 0 || m.content.length > 4000) {
        return new Response(JSON.stringify({ error: "Message content must be a string of 1-4000 chars" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      sanitizedMessages.push({ role: m.role, content: m.content });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...sanitizedMessages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Too many requests. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service unavailable" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("nexa-ai error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
