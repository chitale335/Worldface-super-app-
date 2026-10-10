import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Search, MapPin, MessageCircle, Plus, ShoppingBag, Store as StoreIcon, Receipt, Loader2, Minus, PackageOpen } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@/hooks/useWallet';
import { ReviewList } from '@/components/commerce/Reviews';
import { ProductFormDialog } from '@/components/commerce/ProductFormDialog';
import { PRODUCT_CATEGORIES, dispatchOrderWebhooks, formatCoins, friendlyError, messageUser, type Product } from '@/lib/commerce';

type Seller = { user_id: string; display_name: string | null; avatar_url: string | null; username: string | null };

const Marketplace = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const wallet = useWallet() as { balance?: number | null; refresh?: () => void } | undefined;
  const [products, setProducts] = useState<Product[] | null>(null);
  const [sellers, setSellers] = useState<Record<string, Seller>>({});
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('All');
  const [active, setActive] = useState<Product | null>(null);
  const [qty, setQty] = useState(1);
  const [buying, setBuying] = useState(false);
  const [sellOpen, setSellOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setError(null);
    const { data, error } = await supabase.from('products').select('*').eq('status', 'active').order('created_at', { ascending: false }).limit(200);
    if (error) { setError(friendlyError(error)); setProducts([]); return; }
    setProducts(data);
    const ids = [...new Set(data.map((p) => p.seller_id))];
    if (ids.length) {
      const { data: profs } = await supabase.from('profiles').select('user_id, display_name, avatar_url, username').in('user_id', ids);
      setSellers(Object.fromEntries((profs ?? []).map((p) => [p.user_id, p])));
    }
  };
  useEffect(() => { load(); }, []);
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('product');
    const p = id && products?.find((x) => x.id === id);
    if (p) { setActive(p); setQty(1); }
  }, [products]);

  const list = useMemo(() => (products ?? []).filter((p) =>
    (cat === 'All' || p.category === cat) &&
    (p.title.toLowerCase().includes(q.toLowerCase()) || p.description.toLowerCase().includes(q.toLowerCase()))
  ), [products, q, cat]);

  const buy = async () => {
    if (!active) return;
    setBuying(true);
    const { data, error } = await supabase.rpc('place_order', { _product_id: active.id, _quantity: qty });
    setBuying(false);
    if (error) return toast.error(friendlyError(error));
    dispatchOrderWebhooks(data as string, 'placed');
    toast.success(active.is_digital ? 'Order paid! / Oda imelipwa' : 'Paid into escrow — seller is paid when you confirm delivery / Pesa zimeshikiliwa hadi uthibitishe');
    setActive(null);
    wallet?.refresh?.();
    navigate('/orders');
  };

  const chat = async (sellerId: string) => {
    try { navigate(`/messages/${await messageUser(sellerId)}`); } catch (e) { toast.error(friendlyError(e)); }
  };

  const seller = active ? sellers[active.seller_id] : undefined;
  const isMine = active?.seller_id === user?.id;

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto p-4 space-y-5">
        <header className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber to-emerald flex items-center justify-center">
              <ShoppingBag className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-heading font-bold gradient-text">Marketplace</h1>
              <p className="text-sm text-muted-foreground">Buy & sell with WorldFace Coins · Nunua na uza</p>
            </div>
          </div>
          <Button onClick={() => setSellOpen(true)}><Plus className="h-4 w-4 mr-1" /> Sell</Button>
        </header>

        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" asChild><Link to={user ? `/store/${user.id}` : '/orders'}><StoreIcon className="h-4 w-4 mr-1" /> My Store</Link></Button>
          <Button variant="outline" asChild><Link to="/orders"><Receipt className="h-4 w-4 mr-1" /> Orders</Link></Button>
        </div>

        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search products & services… / Tafuta…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>

        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {['All', ...PRODUCT_CATEGORIES].map((c) => (
            <Button key={c} size="sm" variant={cat === c ? 'default' : 'outline'} onClick={() => setCat(c)} className="shrink-0">{c}</Button>
          ))}
        </div>

        {error && <Card className="p-4 text-sm text-destructive flex items-center justify-between">{error}<Button size="sm" variant="outline" onClick={load}>Retry</Button></Card>}

        {products === null ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="aspect-[3/4] rounded-xl" />)}</div>
        ) : list.length === 0 ? (
          <Card className="p-10 text-center space-y-3">
            <PackageOpen className="h-10 w-10 mx-auto text-muted-foreground" />
            <p className="font-medium">No products yet / Hakuna bidhaa bado</p>
            <p className="text-sm text-muted-foreground">Be the first to list something.</p>
            <Button onClick={() => setSellOpen(true)}><Plus className="h-4 w-4 mr-1" /> List a product</Button>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {list.map((p) => (
              <Card key={p.id} className="overflow-hidden cursor-pointer hover:shadow-glow transition" onClick={() => { setActive(p); setQty(1); }}>
                <div className="aspect-square bg-muted">
                  {p.images[0] ? <img src={p.images[0]} alt={p.title} loading="lazy" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center"><ShoppingBag className="h-8 w-8 text-muted-foreground" /></div>}
                </div>
                <div className="p-3">
                  <p className="font-semibold text-sm truncate">{p.title}</p>
                  <p className="text-base font-bold text-primary mt-0.5">{formatCoins(p.price)}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1 truncate">
                    <MapPin className="h-3 w-3 shrink-0" /> {p.is_digital ? 'Digital' : p.location || '—'}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
          <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto">
            {active && (
              <>
                {active.images.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto snap-x">
                    {active.images.map((src) => <img key={src} src={src} alt="" className="w-full shrink-0 snap-center aspect-square object-cover rounded-lg" />)}
                  </div>
                )}
                <DialogHeader><DialogTitle>{active.title}</DialogTitle></DialogHeader>
                <p className="text-2xl font-bold text-primary">{formatCoins(active.price)}</p>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="secondary">{active.category}</Badge>
                  {active.is_digital ? <Badge>Instant delivery</Badge> : <Badge variant="outline">{active.stock} in stock</Badge>}
                </div>
                {active.description && <p className="text-sm text-muted-foreground whitespace-pre-line">{active.description}</p>}
                {!active.is_digital && active.location && <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" /> {active.location}</p>}
                <ReviewList productId={active.id} />
                <Card className="p-3 flex items-center gap-3">
                  <Avatar><AvatarImage src={seller?.avatar_url ?? undefined} /><AvatarFallback>{seller?.display_name?.[0] ?? '?'}</AvatarFallback></Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{seller?.display_name ?? 'Seller'}</p>
                    <div className="flex gap-3">
                      <Link to={`/store/${active.seller_id}`} className="text-xs text-primary">Visit store</Link>
                      <Link to={`/u/${active.seller_id}`} className="text-xs text-primary">View profile</Link>
                    </div>
                  </div>
                  {!isMine && <Button size="sm" variant="outline" onClick={() => chat(active.seller_id)}><MessageCircle className="h-4 w-4 mr-1" /> Chat</Button>}
                </Card>
                {!isMine && (
                  <DialogFooter className="flex-col gap-2 sm:flex-col">
                    {!active.is_digital && (
                      <div className="flex items-center justify-center gap-3">
                        <Button size="icon" variant="outline" aria-label="Less" onClick={() => setQty((n) => Math.max(1, n - 1))}><Minus className="h-4 w-4" /></Button>
                        <span className="w-8 text-center font-semibold">{qty}</span>
                        <Button size="icon" variant="outline" aria-label="More" onClick={() => setQty((n) => Math.min(active.stock, n + 1))}><Plus className="h-4 w-4" /></Button>
                      </div>
                    )}
                    {typeof wallet?.balance === 'number' && <p className="text-xs text-center text-muted-foreground">Wallet: {formatCoins(wallet.balance)}</p>}
                    <Button className="w-full" onClick={buy} disabled={buying}>
                      {buying && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}Buy now · {formatCoins(active.price * qty)}
                    </Button>
                  </DialogFooter>
                )}
              </>
            )}
          </DialogContent>
        </Dialog>

        <ProductFormDialog open={sellOpen} onOpenChange={setSellOpen} onSaved={load} />
      </div>
    </AppLayout>
  );
};

export default Marketplace;
