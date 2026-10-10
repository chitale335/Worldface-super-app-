import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Download, ArrowLeft, History } from 'lucide-react';
import { MOCK_APPS, formatNumber } from '@/lib/mockData';
import { toast } from 'sonner';

const AppDetail = () => {
  const { id } = useParams();
  const app = MOCK_APPS.find((a) => a.id === id);
  const [installed, setInstalled] = useState(false);

  if (!app) {
    return (
      <AppLayout>
        <div className="p-8 text-center">
          <p className="text-muted-foreground">App not found.</p>
          <Link to="/appstore"><Button variant="link">Back to AppStore</Button></Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto p-4 space-y-6">
        <Link to="/appstore" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> AppStore
        </Link>

        <div className="flex gap-4 items-start">
          <img src={app.icon} alt={app.name} className="w-24 h-24 rounded-3xl object-cover shrink-0" />
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-heading font-bold">{app.name}</h1>
            <p className="text-sm text-muted-foreground">{app.developer}</p>
            <div className="flex items-center gap-3 mt-2 text-sm">
              <span className="flex items-center gap-1"><Star className="h-4 w-4 fill-amber text-amber" /> {app.rating}</span>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground">{formatNumber(app.reviews)} reviews</span>
            </div>
            <Button className="mt-3" onClick={() => { setInstalled(!installed); toast.success(installed ? 'Uninstalled' : 'Installing APK...'); }}>
              <Download className="h-4 w-4 mr-1" /> {installed ? 'Installed' : 'Install'} · {app.size}
            </Button>
          </div>
        </div>

        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Screenshots</h2>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide">
            {app.screenshots.map((s, i) => (
              <img key={i} src={s} alt={`Screenshot ${i + 1}`} className="h-64 rounded-xl object-cover shrink-0" />
            ))}
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">About this app</h2>
          <Card className="p-4">
            <p className="text-sm">{app.description}</p>
            <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
              <span>Version: <b>{app.version}</b></span>
              <span>Size: <b>{app.size}</b></span>
              <span>Downloads: <b>{formatNumber(app.downloads)}</b></span>
              <Badge variant="secondary">{app.category}</Badge>
            </div>
          </Card>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <History className="h-4 w-4" /> Version history
          </h2>
          <Card className="divide-y divide-border">
            {app.versionHistory.map((v) => (
              <div key={v.version} className="p-4">
                <div className="flex justify-between text-sm">
                  <span className="font-semibold">v{v.version}</span>
                  <span className="text-xs text-muted-foreground">{v.date}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{v.notes}</p>
              </div>
            ))}
          </Card>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Ratings & Reviews</h2>
          <Card className="divide-y divide-border">
            {app.reviewsList.map((r, i) => (
              <div key={i} className="p-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-sm">{r.user}</p>
                  <span className="text-xs text-muted-foreground">{r.date}</span>
                </div>
                <div className="flex gap-0.5 my-1">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} className={`h-3 w-3 ${j < r.rating ? 'fill-amber text-amber' : 'text-muted-foreground'}`} />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">{r.text}</p>
              </div>
            ))}
          </Card>
        </section>
      </div>
    </AppLayout>
  );
};

export default AppDetail;
