import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Package, Plus, Pencil, EyeOff, Eye, Trash2, Store as StoreIcon } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ReviewForm } from "@/components/commerce/Reviews";
import { ProductFormDialog } from "@/components/commerce/ProductFormDialog";
import { ORDER_STATUS_LABEL, dispatchOrderWebhooks, formatCoins, friendlyError, type Order, type Product } from "@/lib/commerce";

/** Actions each side may request; the database enforces the real rules. */
const SELLER_NEXT: Record<string, string[]> = {
  paid: ["shipped", "refunded"], shipped: ["delivered", "refunded"], delivered: ["refunded"],
};
const BUYER_NEXT: Record<string, string[]> = { paid: ["cancelled"], shipped: ["completed"], delivered: ["completed"] };
const ESCROW_LABEL: Record<string, string> = {
  held: "Escrow: funds held / Pesa zimeshikiliwa", released: "Paid to seller / Muuzaji amelipwa", refunded: "Refunded to buyer / Imerudishwa",
};

const OrderRow = ({ o, side, onChange }: { o: Order; side: "buyer" | "seller"; onChange: () => void }) => {
  const [busy, setBusy] = useState<string | null>(null);
  const next = (side === "seller" ? SELLER_NEXT : BUYER_NEXT)[o.status] ?? [];
  const move = async (status: string) => {
    setBusy(status);
    const { error } = await supabase.rpc("update_order_status", { _order_id: o.id, _status: status });
    setBusy(null);
    if (error) return toast.error(friendlyError(error));
    dispatchOrderWebhooks(o.id, "status");
    toast.success(`Order ${ORDER_STATUS_LABEL[status] ?? status}`);
    onChange();
  };
  return (
    <li className="glass-elevated rounded-2xl p-3 flex gap-3">
      {o.product_image ? <img src={o.product_image} alt="" className="h-16 w-16 rounded-xl object-cover" loading="lazy" />
        : <div className="h-16 w-16 rounded-xl bg-muted grid place-items-center"><Package className="h-6 w-6 text-muted-foreground" /></div>}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <p className="font-medium truncate">{o.product_title}</p>
          <Badge variant="secondary">{ORDER_STATUS_LABEL[o.status] ?? o.status}</Badge>
        </div>
        <p className="text-xs text-muted-foreground">{o.quantity} × {formatCoins(o.unit_price)} = <b>{formatCoins(o.total)}</b> · {new Date(o.created_at).toLocaleDateString()}</p>
        {o.escrow_status && <p className={`text-xs ${o.escrow_status === "held" ? "text-primary" : "text-muted-foreground"}`}>{ESCROW_LABEL[o.escrow_status]}</p>}
        {side === "buyer" && o.escrow_status === "held" && ["shipped", "delivered"].includes(o.status) && <p className="text-xs text-muted-foreground">Confirm "Completed" only after you receive the item. / Thibitisha baada ya kupokea.</p>}
        {side === "buyer" && o.status === "completed" && <ReviewForm orderId={o.id} productId={o.product_id} sellerId={o.seller_id} buyerId={o.buyer_id} />}
        {o.note && <p className="text-xs text-muted-foreground line-clamp-2">“{o.note}”</p>}
        {next.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {next.map((s) => (
              <Button key={s} size="sm" variant={s === "cancelled" || s === "refunded" ? "outline" : "default"} disabled={!!busy} onClick={() => move(s)}>
                {busy === s && <Loader2 className="h-3 w-3 animate-spin" />} {ORDER_STATUS_LABEL[s]}
              </Button>
            ))}
          </div>
        )}
      </div>
    </li>
  );
};

export default function Orders() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [purchases, setPurchases] = useState<Order[]>([]);
  const [sales, setSales] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [editing, setEditing] = useState<Product | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setError(null);
    const [b, s, p] = await Promise.all([
      supabase.from("orders").select("*").eq("buyer_id", user.id).order("created_at", { ascending: false }).limit(100),
      supabase.from("orders").select("*").eq("seller_id", user.id).order("created_at", { ascending: false }).limit(100),
      supabase.from("products").select("*").eq("seller_id", user.id).order("created_at", { ascending: false }),
    ]);
    const err = b.error || s.error || p.error;
    if (err) setError(friendlyError(err));
    setPurchases(b.data ?? []); setSales(s.data ?? []); setProducts(p.data ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const toggleHidden = async (p: Product) => {
    const status = p.status === "hidden" ? "active" : "hidden";
    const { error } = await supabase.from("products").update({ status }).eq("id", p.id);
    if (error) return toast.error(friendlyError(error));
    load();
  };
  const remove = async (p: Product) => {
    if (!confirm(`Delete "${p.title}"?`)) return;
    const { error } = await supabase.from("products").delete().eq("id", p.id);
    if (error) return toast.error(friendlyError(error));
    toast.success("Product deleted"); load();
  };

  const earned = sales.filter((o) => o.escrow_status === "released").reduce((a, o) => a + o.total, 0);
  const Empty = ({ text }: { text: string }) => <p className="py-10 text-center text-sm text-muted-foreground">{text}</p>;

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl p-4 space-y-4">
        <header className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-heading font-bold gradient-text">Orders & Store</h1>
            <p className="text-sm text-muted-foreground">Oda na Duka lako · Store sales: {formatCoins(earned)} · In escrow: {formatCoins(sales.filter((o) => o.escrow_status === "held").reduce((a, o) => a + o.total, 0))}</p>
          </div>
          <Button asChild variant="outline" size="sm"><Link to="/marketplace"><StoreIcon className="h-4 w-4" /> Marketplace</Link></Button>
        </header>

        {error && <p className="rounded-xl border border-destructive/40 p-3 text-sm text-destructive">{error} <button className="underline" onClick={load}>Retry</button></p>}

        {loading ? <div className="grid place-items-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div> : (
          <Tabs defaultValue="purchases">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="purchases">Purchases ({purchases.length})</TabsTrigger>
              <TabsTrigger value="sales">Sales ({sales.length})</TabsTrigger>
              <TabsTrigger value="products">Products ({products.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="purchases">
              {purchases.length ? <ul className="space-y-2">{purchases.map((o) => <OrderRow key={o.id} o={o} side="buyer" onChange={load} />)}</ul>
                : <Empty text="No purchases yet. / Bado hujanunua chochote." />}
            </TabsContent>
            <TabsContent value="sales">
              {sales.length ? <ul className="space-y-2">{sales.map((o) => <OrderRow key={o.id} o={o} side="seller" onChange={load} />)}</ul>
                : <Empty text="No sales yet. / Bado hakuna mauzo." />}
            </TabsContent>
            <TabsContent value="products" className="space-y-2">
              <Button className="w-full" onClick={() => { setEditing(null); setFormOpen(true); }}><Plus className="h-4 w-4" /> Add product</Button>
              {products.length ? (
                <ul className="space-y-2">
                  {products.map((p) => (
                    <li key={p.id} className="glass-elevated rounded-2xl p-3 flex items-center gap-3">
                      {p.images?.[0] ? <img src={p.images[0]} alt="" className="h-14 w-14 rounded-xl object-cover" loading="lazy" />
                        : <div className="h-14 w-14 rounded-xl bg-muted" />}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{p.title}</p>
                        <p className="text-xs text-muted-foreground">{formatCoins(p.price)} · {p.is_digital ? "Digital" : `Stock ${p.stock}`} · {p.status}</p>
                      </div>
                      <Button size="icon" variant="ghost" aria-label="Edit" onClick={() => { setEditing(p); setFormOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" aria-label={p.status === "hidden" ? "Show" : "Hide"} onClick={() => toggleHidden(p)}>
                        {p.status === "hidden" ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </Button>
                      <Button size="icon" variant="ghost" aria-label="Delete" onClick={() => remove(p)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </li>
                  ))}
                </ul>
              ) : <Empty text="You have no products yet. / Huna bidhaa bado." />}
            </TabsContent>
          </Tabs>
        )}
        <ProductFormDialog open={formOpen} onOpenChange={setFormOpen} product={editing ?? undefined} onSaved={load} />
      </div>
    </AppLayout>
  );
}
