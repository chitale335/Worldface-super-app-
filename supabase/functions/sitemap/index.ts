import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SITE = "https://worldface.lovable.app";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const staticPaths = ["/", "/explore", "/auth", "/founder"];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, username, updated_at")
    .order("updated_at", { ascending: false })
    .limit(5000);

  const { data: posts } = await supabase
    .from("posts")
    .select("id, updated_at, created_at")
    .order("created_at", { ascending: false })
    .limit(5000);

  const urls: string[] = [];

  for (const p of staticPaths) {
    urls.push(`<url><loc>${SITE}${p}</loc><changefreq>daily</changefreq><priority>0.8</priority></url>`);
  }

  for (const pr of profiles ?? []) {
    const slug = (pr as any).username || pr.user_id;
    const lastmod = (pr as any).updated_at ?? new Date().toISOString();
    urls.push(`<url><loc>${SITE}/u/${slug}</loc><lastmod>${lastmod}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>`);
  }

  for (const post of posts ?? []) {
    const lastmod = (post as any).updated_at ?? (post as any).created_at ?? new Date().toISOString();
    urls.push(`<url><loc>${SITE}/?post=${post.id}</loc><lastmod>${lastmod}</lastmod><changefreq>weekly</changefreq><priority>0.6</priority></url>`);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
});
