import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { CulturalVerseLayout } from './CulturalVerseLayout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bot, Music2, UtensilsCrossed, Shirt, Building2, Users, MapPin, Languages, Sparkles } from 'lucide-react';

interface Country {
  code: string; name: string; flag: string | null; region: string | null; languages: string[] | null;
  summary: string | null; history: string | null; customs: string | null; food: string | null;
  music: string | null; clothing: string | null; festivals: string | null; attractions: string | null;
}

const Section = ({ icon: Icon, title, body }: { icon: any; title: string; body?: string | null }) => body ? (
  <Card className="p-5">
    <div className="flex items-center gap-2 mb-2"><Icon className="h-4 w-4 text-primary" /><h3 className="font-heading font-semibold">{title}</h3></div>
    <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
  </Card>
) : null;

export default function CountryPage() {
  const { code } = useParams();
  const [c, setC] = useState<Country | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!code) return;
    supabase.from('cultural_countries').select('*').eq('code', code.toUpperCase()).maybeSingle().then(({ data }) => {
      setC(data as Country | null);
      setLoading(false);
    });
  }, [code]);

  if (loading) return <CulturalVerseLayout><div className="p-8 text-center text-muted-foreground">Loading…</div></CulturalVerseLayout>;
  if (!c) return <CulturalVerseLayout><div className="p-8 text-center">Country not found. <Link to="/culturalverse/map" className="text-primary">Back to map</Link></div></CulturalVerseLayout>;

  return (
    <CulturalVerseLayout>
      <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-4">
        <div className="rounded-3xl p-8 bg-gradient-to-br from-primary/15 via-violet/10 to-cyan/15 border border-border/50 relative overflow-hidden">
          <div className="flex items-start gap-4 flex-wrap">
            <div className="text-6xl md:text-8xl">{c.flag}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1"><MapPin className="h-3 w-3" />{c.region}</div>
              <h1 className="font-heading text-3xl md:text-5xl font-bold">{c.name}</h1>
              {c.summary && <p className="text-muted-foreground mt-3 max-w-2xl">{c.summary}</p>}
              {c.languages && c.languages.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-4">
                  <Languages className="h-4 w-4 text-primary mt-0.5" />
                  {c.languages.map((l) => <Badge key={l} variant="secondary">{l}</Badge>)}
                </div>
              )}
              <div className="flex gap-2 mt-5">
                <Link to={`/culturalverse/mentor?country=${c.code}`} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                  <Bot className="h-4 w-4" /> Ask AI about {c.name}
                </Link>
                <Link to={`/culturalverse/mentor?mode=language&country=${c.code}`} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-card border border-border/50 text-sm font-medium">
                  <Languages className="h-4 w-4" /> Learn language
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          <Section icon={Sparkles} title="History" body={c.history} />
          <Section icon={Users} title="Customs & Traditions" body={c.customs} />
          <Section icon={UtensilsCrossed} title="Traditional Food" body={c.food} />
          <Section icon={Music2} title="Music & Dance" body={c.music} />
          <Section icon={Shirt} title="Traditional Clothing" body={c.clothing} />
          <Section icon={Sparkles} title="Festivals" body={c.festivals} />
          <Section icon={MapPin} title="Tourist Attractions" body={c.attractions} />
          <Section icon={Building2} title="Overview" body={c.summary} />
        </div>
      </div>
    </CulturalVerseLayout>
  );
}
