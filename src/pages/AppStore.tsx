import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Star, Download, Package } from 'lucide-react';
import { MOCK_APPS, formatNumber } from '@/lib/mockData';

const AppStore = () => {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<string>('All');
  const cats = ['All', ...Array.from(new Set(MOCK_APPS.map((a) => a.category)))];
  const apps = MOCK_APPS.filter((a) =>
    (cat === 'All' || a.category === cat) &&
    (a.name.toLowerCase().includes(q.toLowerCase()) || a.developer.toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <header>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan to-primary flex items-center justify-center">
              <Package className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-heading font-bold gradient-text">WorldFace AppStore</h1>
              <p className="text-sm text-muted-foreground">Download apps built by the community</p>
            </div>
          </div>
        </header>

        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search apps, developers..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>

        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {cats.map((c) => (
            <Button key={c} size="sm" variant={cat === c ? 'default' : 'outline'} onClick={() => setCat(c)} className="shrink-0">
              {c}
            </Button>
          ))}
        </div>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Featured</h2>
          <div className="grid gap-3">
            {apps.map((a) => (
              <Link key={a.id} to={`/appstore/${a.id}`}>
                <Card className="p-4 hover:bg-muted/40 transition">
                  <div className="flex gap-3 items-start">
                    <img src={a.icon} alt={a.name} className="w-16 h-16 rounded-2xl object-cover shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold truncate">{a.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{a.developer}</p>
                        </div>
                        <Button size="sm">Install</Button>
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-amber text-amber" /> {a.rating}</span>
                        <span className="flex items-center gap-1"><Download className="h-3 w-3" /> {formatNumber(a.downloads)}</span>
                        <Badge variant="secondary" className="text-[10px]">{a.category}</Badge>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        <Card className="p-5 bg-gradient-to-br from-cyan/10 to-primary/10 border-primary/20">
          <h3 className="font-heading font-bold mb-1">Build for WorldFace</h3>
          <p className="text-sm text-muted-foreground mb-3">Publish your APK and reach the WorldFace community.</p>
          <Button>Upload your APK</Button>
        </Card>
      </div>
    </AppLayout>
  );
};

export default AppStore;
