import { defineTool } from "@lovable.dev/mcp-js";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_my_profile",
  title: "Get my profile",
  description: "Read the signed-in user's WorldFace profile (name, bio, location, premium status).",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_args, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const { data, error } = await supabaseForUser(ctx)
      .from("profiles")
      .select("id, display_name, bio, location, avatar_url, is_premium, preferred_language, created_at")
      .eq("id", ctx.getUserId()!)
      .maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!data) return { content: [{ type: "text", text: "Profile not found" }], isError: true };
    const profile = {
      id: data.id, display_name: data.display_name, bio: data.bio, location: data.location,
      avatar_url: data.avatar_url, is_premium: data.is_premium,
      preferred_language: data.preferred_language, created_at: data.created_at,
    };
    return { content: [{ type: "text", text: JSON.stringify(profile) }], structuredContent: { profile } };
  },
});
