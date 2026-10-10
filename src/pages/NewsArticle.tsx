import { Link, useParams } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, Clock, Heart, MessageCircle, Share2 } from 'lucide-react';
import { MOCK_ARTICLES } from '@/lib/mockData';
import { toast } from 'sonner';

const NewsArticle = () => {
  const { id } = useParams();
  const article = MOCK_ARTICLES.find((a) => a.id === id);

  if (!article) {
    return (
      <AppLayout>
        <div className="p-8 text-center">
          <p className="text-muted-foreground">Article not found.</p>
          <Link to="/news"><Button variant="link">Back to News</Button></Link>
        </div>
      </AppLayout>
    );
  }

  const related = MOCK_ARTICLES.filter((a) => a.category === article.category && a.id !== article.id).slice(0, 3);

  return (
    <AppLayout>
      <article className="max-w-3xl mx-auto p-4 space-y-4 pb-12">
        <Link to="/news" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> News
        </Link>

        <Badge>{article.category}</Badge>
        <h1 className="text-3xl md:text-4xl font-heading font-bold leading-tight">{article.title}</h1>

        <div className="flex items-center gap-3 text-sm">
          <Avatar><AvatarImage src={article.author.avatar} /><AvatarFallback>{article.author.name[0]}</AvatarFallback></Avatar>
          <div>
            <p className="font-semibold">{article.author.name}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              {article.publishedAt} · <Clock className="h-3 w-3" /> {article.readMinutes} min read
            </p>
          </div>
        </div>

        <img src={article.cover} alt={article.title} className="w-full aspect-video object-cover rounded-xl" />

        <p className="text-lg text-muted-foreground italic">{article.excerpt}</p>

        <div className="prose prose-invert max-w-none">
          {article.body.split('\n\n').map((p, i) => (
            <p key={i} className="text-base leading-relaxed">{p}</p>
          ))}
        </div>

        <div className="flex gap-2 pt-4 border-t border-border">
          <Button variant="outline" size="sm"><Heart className="h-4 w-4 mr-1" /> Like</Button>
          <Button variant="outline" size="sm"><MessageCircle className="h-4 w-4 mr-1" /> Comment</Button>
          <Button variant="outline" size="sm" onClick={() => { navigator.clipboard?.writeText(window.location.href); toast.success('Link copied'); }}>
            <Share2 className="h-4 w-4 mr-1" /> Share
          </Button>
        </div>

        {related.length > 0 && (
          <section className="pt-6 space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Related in {article.category}</h2>
            <div className="grid md:grid-cols-3 gap-3">
              {related.map((a) => (
                <Link key={a.id} to={`/news/${a.id}`}>
                  <Card className="overflow-hidden hover:bg-muted/40 transition h-full">
                    <img src={a.cover} alt="" className="aspect-video object-cover w-full" />
                    <div className="p-3">
                      <p className="font-semibold text-sm line-clamp-2">{a.title}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{a.publishedAt}</p>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
    </AppLayout>
  );
};

export default NewsArticle;
