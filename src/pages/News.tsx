import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Newspaper, Clock, PenSquare } from 'lucide-react';
import { MOCK_ARTICLES, NEWS_CATEGORIES } from '@/lib/mockData';
import { toast } from 'sonner';

const News = () => {
  const [cat, setCat] = useState<string>('All');
  const articles = cat === 'All' ? MOCK_ARTICLES : MOCK_ARTICLES.filter((a) => a.category === cat);
  const featured = articles[0];
  const rest = articles.slice(1);

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <header className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan to-emerald flex items-center justify-center">
              <Newspaper className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-heading font-bold gradient-text">News & Blog</h1>
              <p className="text-sm text-muted-foreground">Stories from the WorldFace community</p>
            </div>
          </div>
          <Button onClick={() => toast.info('Article editor coming soon')}>
            <PenSquare className="h-4 w-4 mr-1" /> Write
          </Button>
        </header>

        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {NEWS_CATEGORIES.map((c) => (
            <Button key={c} size="sm" variant={cat === c ? 'default' : 'outline'} onClick={() => setCat(c)} className="shrink-0">
              {c}
            </Button>
          ))}
        </div>

        {featured && (
          <Link to={`/news/${featured.id}`}>
            <Card className="overflow-hidden hover:shadow-glow transition">
              <div className="aspect-video">
                <img src={featured.cover} alt={featured.title} className="w-full h-full object-cover" />
              </div>
              <div className="p-4 space-y-2">
                <Badge>{featured.category}</Badge>
                <h2 className="text-xl font-heading font-bold">{featured.title}</h2>
                <p className="text-sm text-muted-foreground">{featured.excerpt}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
                  <Avatar className="h-6 w-6"><AvatarImage src={featured.author.avatar} /><AvatarFallback>{featured.author.name[0]}</AvatarFallback></Avatar>
                  <span>{featured.author.name}</span>
                  <span>·</span>
                  <span>{featured.publishedAt}</span>
                  <span>·</span>
                  <Clock className="h-3 w-3" /> {featured.readMinutes} min read
                </div>
              </div>
            </Card>
          </Link>
        )}

        <div className="grid md:grid-cols-2 gap-3">
          {rest.map((a) => (
            <Link key={a.id} to={`/news/${a.id}`}>
              <Card className="overflow-hidden hover:bg-muted/40 transition h-full">
                <div className="aspect-video">
                  <img src={a.cover} alt={a.title} className="w-full h-full object-cover" />
                </div>
                <div className="p-3 space-y-1">
                  <Badge variant="secondary" className="text-[10px]">{a.category}</Badge>
                  <p className="font-semibold text-sm">{a.title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">{a.excerpt}</p>
                  <p className="text-[10px] text-muted-foreground pt-1">{a.author.name} · {a.publishedAt}</p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default News;
