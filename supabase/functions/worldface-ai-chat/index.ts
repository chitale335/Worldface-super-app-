import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_EN = `You are WorldFace AI, the friendly assistant inside WorldFace — a Kenyan/African super app for social feeds, chat, calls, NexaPay wallet, music (Wasanii), AppStore, Marketplace, and creator tools. Help users write posts, captions, and comments; suggest friends, groups, and hashtags; explain features; and answer questions. Be concise, warm, and practical. Use markdown when useful.`;

const SYSTEM_SW = `Wewe ni WorldFace AI, msaidizi rafiki ndani ya WorldFace — jukwaa la Kiafrika la mitandao ya kijamii, gumzo, simu, mkoba wa NexaPay, muziki (Wasanii), AppStore, Soko, na zana za wabunifu. Msaidie mtumiaji kuandika machapisho, manukuu, na maoni; pendekeza marafiki, vikundi, na hashtag; eleza vipengele; na jibu maswali. Kuwa mfupi, wa joto, na wa vitendo. Jibu kwa Kiswahili. Tumia markdown ikihitajika.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const { messages = [], language = "en", conversationId } = await req.json();
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.toLowerCase().startsWith("bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: authErr } = await supabase.auth.getUser();
    const user = userData?.user;
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Persist user message and ensure a conversation
    let convId = conversationId as string | undefined;
    if (user) {
      if (!convId) {
        const firstUser = messages.filter((m: any) => m.role === "user").pop();
        const title = (firstUser?.content ?? "New chat").slice(0, 60);
        const { data: newConv } = await supabase
          .from("ai_conversations")
          .insert({ user_id: user.id, title, language })
          .select("id")
          .single();
        convId = newConv?.id;
      }
      const lastMsg = messages[messages.length - 1];
      if (convId && lastMsg?.role === "user") {
        await supabase.from("ai_messages").insert({
          conversation_id: convId,
          user_id: user.id,
          role: "user",
          content: lastMsg.content,
        });
      }
    }

    const system = language === "sw" ? SYSTEM_SW : SYSTEM_EN;
    const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        stream: true,
        messages: [{ role: "system", content: system }, ...messages],
      }),
    });

    if (!upstream.ok) {
      const txt = await upstream.text();
      return new Response(JSON.stringify({ error: `AI error ${upstream.status}: ${txt}` }), {
        status: upstream.status === 429 || upstream.status === 402 ? upstream.status : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Tee stream to accumulate assistant text and persist at end
    let assistantText = "";
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();
    const reader = upstream.body!.getReader();

    const stream = new ReadableStream({
      async start(controller) {
        // Prepend conv id as first SSE meta event
        if (convId) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ conversationId: convId })}\n\n`));
        }
        let buf = "";
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            controller.enqueue(encoder.encode(chunk));
            buf += chunk;
            let idx: number;
            while ((idx = buf.indexOf("\n")) !== -1) {
              const line = buf.slice(0, idx).trim();
              buf = buf.slice(idx + 1);
              if (!line.startsWith("data: ")) continue;
              const payload = line.slice(6).trim();
              if (payload === "[DONE]") continue;
              try {
                const j = JSON.parse(payload);
                const delta = j.choices?.[0]?.delta?.content;
                if (delta) assistantText += delta;
              } catch { /* ignore */ }
            }
          }
        } catch (e) {
          console.error("stream error", e);
        } finally {
          controller.close();
          if (user && convId && assistantText) {
            await supabase.from("ai_messages").insert({
              conversation_id: convId,
              user_id: user.id,
              role: "assistant",
              content: assistantText,
            });
          }
        }
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message ?? "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
