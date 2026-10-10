import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Product = Tables<"products">;
export type Order = Tables<"orders">;
export type Store = Tables<"stores">;

export const PRODUCT_CATEGORIES = ["Electronics", "Fashion", "Services", "Digital", "Music", "Courses", "Vehicles", "Home", "Other"] as const;

export const ORDER_STATUS_LABEL: Record<string, string> = {
  pending: "Pending", paid: "Paid", shipped: "Shipped", delivered: "Delivered",
  completed: "Completed", cancelled: "Cancelled", refunded: "Refunded",
};

export const formatCoins = (n: number) => `${n.toLocaleString()} coins`;

/** Turns database errors into short user-friendly messages. */
export const friendlyError = (e: unknown): string => {
  const msg = (e as { message?: string })?.message ?? String(e);
  if (msg.includes("Insufficient balance")) return "Not enough coins in your wallet.";
  if (msg.includes("own product")) return "You can't buy your own product.";
  if (msg.includes("Not enough stock")) return "Not enough stock left.";
  if (msg.includes("not available")) return "This product is no longer available.";
  if (msg.includes("stores_slug")) return "Store link may only use a-z, 0-9 and dashes (3–40).";
  if (msg.includes("duplicate key") && msg.includes("slug")) return "That store link is taken.";
  if (msg.includes("webhooks_url_https")) return "Webhook URL must start with https://";
  return msg.length > 140 ? "Something went wrong. Please try again." : msg;
};

/** Fire-and-forget webhook notification for order events. */
export const dispatchOrderWebhooks = (orderId: string, kind: "placed" | "status") => {
  supabase.functions.invoke("webhook-dispatch", { body: { order_id: orderId, kind } }).catch(() => {});
};

export const uploadProductImage = async (userId: string, file: File) => {
  if (!file.type.startsWith("image/")) throw new Error("Only images are allowed");
  if (file.size > 8 * 1024 * 1024) throw new Error("Image must be under 8MB");
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${userId}/products/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("posts").upload(path, file, { contentType: file.type });
  if (error) throw error;
  return supabase.storage.from("posts").getPublicUrl(path).data.publicUrl;
};

export const messageUser = async (otherUserId: string) => {
  const { data, error } = await supabase.rpc("start_direct_conversation", { other_user_id: otherUserId });
  if (error) throw error;
  return data as string;
};

export const profileCodeFor = (userId: string) => "WF-" + userId.replace(/-/g, "").slice(0, 8).toUpperCase();
