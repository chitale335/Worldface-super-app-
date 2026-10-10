import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import { supabase } from '@/integrations/supabase/client';
import { CulturalVerseLayout } from './CulturalVerseLayout';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

interface Country { code: string; name: string; flag: string | null; region: string | null }

// Map numeric ISO codes from world-atlas to ISO2 codes we seed
const N2A: Record<string, string> = {
  '404':'KE','834':'TZ','566':'NG','840':'US','356':'IN','392':'JP','076':'BR','818':'EG','156':'CN','250':'FR','826':'GB','276':'DE','484':'MX','710':'ZA','231':'ET','504':'MA','288':'GH','686':'SN','036':'AU','032':'AR',
};

export default function CulturalVerseMap() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [q, setQ] = useState('');
  const [hover, setHover] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.from('cultural_countries').select('code,name,flag,region').order('name').then(({ data }) => {
      setCountries((data ?? []) as Country[]);
    });
  }, []);

  const codeSet = useMemo(() => new Set(countries.map((c) => c.code)), [countries]);
  const filtered = useMemo(() => countries.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()) || c.code.toLowerCase().includes(q.toLowerCase())), [countries, q]);

  return (
    <CulturalVerseLayout>
      <div className="max-w-7xl mx-auto p-4 md:p-6 grid lg:grid-cols-[1fr_320px] gap-4">
        <div className="rounded-2xl overflow-hidden border border-border/50 bg-gradient-to-br from-primary/5 to-violet/5 relative">
          <ComposableMap projectionConfig={{ scale: 155 }} height={520} style={{ width: '100%', height: 'auto' }}>
            <ZoomableGroup>
              <Geographies geography={GEO_URL}>
                {({ geographies }) =>
                  geographies.map((geo) => {
                    const iso2 = N2A[geo.id];
                    const hasData = iso2 && codeSet.has(iso2);
                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        onClick={() => hasData && navigate(`/culturalverse/country/${iso2}`)}
                        onMouseEnter={() => setHover(hasData ? iso2 : null)}
                        onMouseLeave={() => setHover(null)}
                        style={{
                          default: { fill: hasData ? 'hsl(var(--primary) / 0.5)' : 'hsl(var(--muted))', stroke: 'hsl(var(--background))', strokeWidth: 0.5, outline: 'none' },
                          hover: { fill: hasData ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground) / 0.3)', outline: 'none', cursor: hasData ? 'pointer' : 'default' },
                          pressed: { fill: 'hsl(var(--primary))', outline: 'none' },
                        }}
                      />
                    );
                  })
                }
              </Geographies>
            </ZoomableGroup>
          </ComposableMap>
          {hover && (
            <div className="absolute top-3 left-3 px-3 py-1.5 rounded-full bg-card/90 backdrop-blur border border-border/50 text-sm font-medium">
              {countries.find((c) => c.code === hover)?.flag} {countries.find((c) => c.code === hover)?.name}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search countries" className="pl-9" />
          </div>
          <div className="rounded-2xl border border-border/50 divide-y divide-border/50 max-h-[520px] overflow-y-auto">
            {filtered.map((c) => (
              <button
                key={c.code}
                onClick={() => navigate(`/culturalverse/country/${c.code}`)}
                className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition text-left"
              >
                <span className="text-2xl">{c.flag}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{c.name}</div>
                  <div className="text-xs text-muted-foreground">{c.region}</div>
                </div>
              </button>
            ))}
            {filtered.length === 0 && <div className="p-6 text-center text-sm text-muted-foreground">No countries found</div>}
          </div>
        </div>
      </div>
    </CulturalVerseLayout>
  );
}
