import { ReviewList } from "@/components/commerce/Reviews";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { MapPin, MessageCircle, PackageOpen, Share2, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatCoins, friendlyError, messageUser, type Product, type Store } from "@/lib/commerce";

type Seller = { display_name: string | null; avatar_url: string | null; bio: string | null };

/** Public storefront for one seller: /store/:sellerId */
export default function PublicStore() {
  const { sellerId = "" } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [store, setStore] = useState<Store | null>(null);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [products, setProducts] = useState<Product[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [s, p, pr] = await Promise.all([
        supabase.from("stores").select("*").eq("owner_id", sellerId).maybeSingle(),
        supabase.from("profiles").select("display_name, avatar_url, bio").eq("user_id", sellerId).maybeSingle(),
        supabase.from("products").select("*").eq("seller_id", sellerId).eq("status", "active").order("created_at", { ascending: false }),
      ]);
      if (pr.error) setError(friendlyError(pr.error));
      setStore(s.data ?? null);
      setSeller(p.data ?? null);
      setProducts(pr.data ?? []);
    })();
  }, [sellerId]);

  const name = store?.name || seller?.display_name || "Store";
  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: name, url });
      else { await navigator.clipboard.writeText(url); toast.success("Link copied / Kiungo kimenakiliwa"); }
    } catch { /* cancelled */ }
  };
  const chat = async () => {
    try { navigate(`/messages/${await messageUser(sellerId)}`); } catch (e) { toast.error(friendlyError(e)); }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto p-4 space-y-5">
        <Card className="p-4 flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={store?.logo_url ?? seller?.avatar_url ?? undefined} />
            <AvatarFallback>{name[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-heading font-bold truncate">{name}</h1>
            <p className="text-sm text-muted-foreground line-clamp-2">{store?.description || seller?.bio || "Duka la WorldFace"}</p>
            {store?.location && <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1"><MapPin className="h-3 w-3" />{store.location}</p>}
            {sellerId && <div className="mt-1"><ReviewList sellerId={sellerId} compact /></div>}
          </div>
        </Card>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={share}><Share2 className="h-4 w-4 mr-1" /> Share</Button>
          {user?.id !== sellerId && <Button className="flex-1" onClick={chat}><MessageCircle className="h-4 w-4 mr-1" /> Chat</Button>}
          <Button variant="outline" asChild><Link to={`/u/${sellerId}`}>Profile</Link></Button>
        </div>

        {error && <Card className="p-4 text-sm text-destructive">{error}</Card>}

        {products === null ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="aspect-[3/4] rounded-xl" />)}</div>
        ) : products.length === 0 ? (
          <Card className="p-10 text-center space-y-2">
            <PackageOpen className="h-10 w-10 mx-auto text-muted-foreground" />
            <p className="font-medium">No products yet / Hakuna bidhaa bado</p>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {products.map((p) => (
              <Card key={p.id} className="overflow-hidden cursor-pointer hover:shadow-glow transition" onClick={() => navigate(`/marketplace?product=${p.id}`)}>
                <div className="aspect-square bg-muted">
                  {p.images[0] ? <img src={p.images[0]} alt={p.title} loading="lazy" className="w-full h-full object-cover" />
                    : <div className="w-full h-full grid place-items-center"><ShoppingBag className="h-8 w-8 text-muted-foreground" /></div>}
                </div>
                <div className="p-3">
                  <p className="font-semibold text-sm truncate">{p.title}</p>
                  <p className="text-base font-bold text-primary mt-0.5">{formatCoins(p.price)}</p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
