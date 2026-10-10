import { auth, defineMcp } from "@lovable.dev/mcp-js";
import getMyProfileTool from "./tools/get-my-profile";
import listMyPostsTool from "./tools/list-my-posts";
import listMyNotificationsTool from "./tools/list-my-notifications";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "worldface-super",
  title: "Worldface super",
  version: "0.1.0",
  instructions:
    "Read-only tools for the signed-in WorldFace user: their profile, recent posts with engagement, and notifications.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [getMyProfileTool, listMyPostsTool, listMyNotificationsTool],
});
