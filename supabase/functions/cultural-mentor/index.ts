import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

interface Msg { role: 'system' | 'user' | 'assistant'; content: string }

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const key = Deno.env.get('LOVABLE_API_KEY');
    if (!key) return new Response(JSON.stringify({ error: 'Missing LOVABLE_API_KEY' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const authHeader = req.headers.get('Authorization') ?? '';
    if (!authHeader.toLowerCase().startsWith('bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData, error: authErr } = await supabase.auth.getUser();
    if (authErr || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { messages, mode, country } = await req.json() as { messages: Msg[]; mode?: 'mentor' | 'language'; country?: string };

    const systemPrompt = mode === 'language'
      ? `You are the WorldFace AI Language Companion. Help the user learn languages, translate phrases in real time, and explain local sayings, idioms and proverbs.${country ? ` Focus on languages spoken in ${country}.` : ''} Always show: 1) the phrase in the target language, 2) pronunciation, 3) literal meaning, 4) cultural context. Keep answers warm and concise.`
      : `You are the WorldFace AI Cultural Mentor. You explain world cultures — history, customs, ceremonies, food, music, dance, clothing, festivals — in an organized, respectful, well-sourced way.${country ? ` The user is currently exploring ${country}.` : ''} Use short sections with clear headers (## Overview, ## History, ## Customs, ## Notes) and celebrate cultural diversity without stereotypes.`;

    const upstream = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Lovable-API-Key': key },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        stream: true,
        messages: [{ role: 'system', content: systemPrompt }, ...(messages ?? [])],
      }),
    });

    if (!upstream.ok) {
      const txt = await upstream.text();
      return new Response(JSON.stringify({ error: txt }), { status: upstream.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(upstream.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
