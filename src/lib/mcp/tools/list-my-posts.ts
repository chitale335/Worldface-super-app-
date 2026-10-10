import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_my_posts",
  title: "List my posts",
  description: "List the signed-in user's recent WorldFace posts with engagement counts.",
  inputSchema: { limit: z.number().int().min(1).max(50).default(10).describe("How many posts to return.") },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const { data, error } = await supabaseForUser(ctx)
      .from("posts")
      .select("id, caption, type, media_url, like_count, comment_count, share_count, view_count, created_at")
      .eq("user_id", ctx.getUserId()!)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const posts = (data ?? []).map((p) => ({
      id: p.id, caption: p.caption, type: String(p.type), media_url: p.media_url,
      like_count: p.like_count, comment_count: p.comment_count, share_count: p.share_count,
      view_count: p.view_count, created_at: p.created_at,
    }));
    return { content: [{ type: "text", text: JSON.stringify(posts) }], structuredContent: { posts } };
  },
});
