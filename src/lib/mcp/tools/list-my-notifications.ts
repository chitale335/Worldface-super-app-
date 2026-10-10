import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_my_notifications",
  title: "List my notifications",
  description: "List the signed-in user's recent WorldFace notifications, optionally only unread ones.",
  inputSchema: {
    unreadOnly: z.boolean().default(false).describe("Only return unread notifications."),
    limit: z.number().int().min(1).max(50).default(20).describe("How many notifications to return."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ unreadOnly, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    let query = supabaseForUser(ctx)
      .from("notifications")
      .select("id, type, actor_id, post_id, read_at, created_at")
      .eq("recipient_id", ctx.getUserId()!)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (unreadOnly) query = query.is("read_at", null);
    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const notifications = (data ?? []).map((n) => ({
      id: n.id, type: String(n.type), actor_id: n.actor_id, post_id: n.post_id,
      read_at: n.read_at, created_at: n.created_at,
    }));
    return { content: [{ type: "text", text: JSON.stringify(notifications) }], structuredContent: { notifications } };
  },
});
