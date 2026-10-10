import { useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Search, MapPin, Star, MessageCircle, Plus, ShoppingBag, Send } from 'lucide-react';
import { MOCK_LISTINGS, type Listing } from '@/lib/mockData';
import { toast } from 'sonner';

const CATS = ['All', 'Electronics', 'Fashion', 'Services', 'Vehicles', 'Home'] as const;

const Marketplace = () => {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<string>('All');
  const [active, setActive] = useState<Listing | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chat, setChat] = useState<{ from: 'me' | 'seller'; text: string }[]>([]);
  const [input, setInput] = useState('');

  const listings = MOCK_LISTINGS.filter((l) =>
    (cat === 'All' || l.category === cat) &&
    (l.title.toLowerCase().includes(q.toLowerCase()) || l.description.toLowerCase().includes(q.toLowerCase()))
  );

  const sendMsg = () => {
    const t = input.trim();
    if (!t) return;
    setChat((c) => [...c, { from: 'me', text: t }]);
    setInput('');
    setTimeout(() => setChat((c) => [...c, { from: 'seller', text: 'Hi! Yes it is still available. When can you collect?' }]), 800);
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <header className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber to-emerald flex items-center justify-center">
              <ShoppingBag className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-heading font-bold gradient-text">Marketplace</h1>
              <p className="text-sm text-muted-foreground">Buy & sell on WorldFace</p>
            </div>
          </div>
          <Button onClick={() => toast.info('Listing form coming soon')}>
            <Plus className="h-4 w-4 mr-1" /> Sell
          </Button>
        </header>

        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search products & services..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>

        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {CATS.map((c) => (
            <Button key={c} size="sm" variant={cat === c ? 'default' : 'outline'} onClick={() => setCat(c)} className="shrink-0">
              {c}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {listings.map((l) => (
            <Card key={l.id} className="overflow-hidden cursor-pointer hover:shadow-glow transition" onClick={() => setActive(l)}>
              <div className="aspect-square bg-muted">
                <img src={l.images[0]} alt={l.title} className="w-full h-full object-cover" />
              </div>
              <div className="p-3">
                <p className="font-semibold text-sm truncate">{l.title}</p>
                <p className="text-base font-bold text-primary mt-0.5">{l.currency} {l.price.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1 truncate">
                  <MapPin className="h-3 w-3 shrink-0" /> {l.location}
                </p>
              </div>
            </Card>
          ))}
        </div>

        <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            {active && (
              <>
                <img src={active.images[0]} alt="" className="w-full aspect-square object-cover rounded-lg" />
                <DialogHeader>
                  <DialogTitle>{active.title}</DialogTitle>
                </DialogHeader>
                <p className="text-2xl font-bold text-primary">{active.currency} {active.price.toLocaleString()}</p>
                <Badge variant="secondary" className="w-fit">{active.category}</Badge>
                <p className="text-sm text-muted-foreground">{active.description}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {active.location} · Posted {active.postedAt}
                </p>
                <Card className="p-3 flex items-center gap-3">
                  <Avatar><AvatarImage src={active.seller.avatar} /><AvatarFallback>{active.seller.name[0]}</AvatarFallback></Avatar>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{active.seller.name}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Star className="h-3 w-3 fill-amber text-amber" /> {active.seller.rating}
                    </p>
                  </div>
                </Card>
                <DialogFooter>
                  <Button className="w-full" onClick={() => { setChatOpen(true); setChat([]); }}>
                    <MessageCircle className="h-4 w-4 mr-1" /> Message seller
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={chatOpen} onOpenChange={setChatOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Chat with {active?.seller.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 h-64 overflow-y-auto border rounded-lg p-3 bg-muted/20">
              {chat.length === 0 && <p className="text-xs text-muted-foreground text-center pt-20">Start the conversation about "{active?.title}"</p>}
              {chat.map((m, i) => (
                <div key={i} className={`flex ${m.from === 'me' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${m.from === 'me' ? 'bg-primary text-primary-foreground' : 'bg-card'}`}>
                    {m.text}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendMsg()} placeholder="Type a message..." />
              <Button size="icon" onClick={sendMsg}><Send className="h-4 w-4" /></Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default Marketplace;
