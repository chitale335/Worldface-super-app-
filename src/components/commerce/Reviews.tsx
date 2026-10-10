import { useEffect, useState } from "react";
import { Star, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { friendlyError } from "@/lib/commerce";

export const Stars = ({ value, onChange, size = 4 }: { value: number; onChange?: (n: number) => void; size?: number }) => (
  <span className="inline-flex gap-0.5">
    {[1, 2, 3, 4, 5].map((n) => (
      <button key={n} type="button" disabled={!onChange} onClick={() => onChange?.(n)} aria-label={`${n} stars`}>
        <Star className={`h-${size} w-${size} ${n <= Math.round(value) ? "fill-primary text-primary" : "text-muted-foreground"}`} />
      </button>
    ))}
  </span>
);

type Review = { id: string; rating: number; comment: string | null; created_at: string; buyer_id: string };

/** Buyer review form for a completed order; one review per order (enforced in database). */
export const ReviewForm = ({ orderId, productId, sellerId, buyerId }: { orderId: string; productId: string | null; sellerId: string; buyerId: string }) => {
  const [existing, setExisting] = useState<Review | null | undefined>(undefined);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.from("product_reviews").select("*").eq("order_id", orderId).maybeSingle().then(({ data }) => setExisting(data ?? null));
  }, [orderId]);

  const save = async () => {
    setBusy(true);
    const { data, error } = await supabase.from("product_reviews")
      .insert({ order_id: orderId, product_id: productId, seller_id: sellerId, buyer_id: buyerId, rating, comment: comment.trim().slice(0, 1000) || null })
      .select().single();
    setBusy(false);
    if (error) return toast.error(friendlyError(error));
    setExisting(data); setOpen(false); toast.success("Thanks for your review / Asante kwa maoni");
  };

  if (existing === undefined) return null;
  if (existing) return <p className="text-xs text-muted-foreground flex items-center gap-1">Your review: <Stars value={existing.rating} size={3} /></p>;
  if (!open) return <Button size="sm" variant="outline" onClick={() => setOpen(true)}><Star className="h-3 w-3" /> Rate / Toa maoni</Button>;
  return (
    <div className="space-y-2 pt-1">
      <Stars value={rating} onChange={setRating} size={5} />
      <Textarea value={comment} onChange={(e) => setComment(e.target.value)} maxLength={1000} placeholder="What did you think? / Maoni yako…" rows={2} />
      <div className="flex gap-2">
        <Button size="sm" onClick={save} disabled={busy}>{busy && <Loader2 className="h-3 w-3 animate-spin" />} Submit</Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </div>
  );
};

/** Average + recent reviews for a product or a seller. */
export const ReviewList = ({ productId, sellerId, compact }: { productId?: string; sellerId?: string; compact?: boolean }) => {
  const [rows, setRows] = useState<Review[] | null>(null);
  useEffect(() => {
    let q = supabase.from("product_reviews").select("id, rating, comment, created_at, buyer_id").order("created_at", { ascending: false }).limit(50);
    if (productId) q = q.eq("product_id", productId);
    if (sellerId) q = q.eq("seller_id", sellerId);
    q.then(({ data }) => setRows(data ?? []));
  }, [productId, sellerId]);
  if (!rows) return null;
  if (!rows.length) return <p className="text-xs text-muted-foreground">No reviews yet / Hakuna maoni bado</p>;
  const avg = rows.reduce((a, r) => a + r.rating, 0) / rows.length;
  const summary = <p className="text-sm flex items-center gap-2"><Stars value={avg} /> <b>{avg.toFixed(1)}</b> <span className="text-muted-foreground">({rows.length})</span></p>;
  if (compact) return summary;
  return (
    <div className="space-y-2">
      {summary}
      <ul className="space-y-2">
        {rows.slice(0, 5).map((r) => (
          <li key={r.id} className="rounded-lg bg-muted/40 p-2 text-sm">
            <div className="flex justify-between"><Stars value={r.rating} size={3} /><span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span></div>
            {r.comment && <p className="mt-1 text-muted-foreground">{r.comment}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
};
