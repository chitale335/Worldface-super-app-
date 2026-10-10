import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Music2, Search, BadgeCheck, Play, Crown, Star } from 'lucide-react';
import { MOCK_ARTISTS, FEATURED_ARTIST_ID, formatNumber } from '@/lib/mockData';

const Music = () => {
  const [q, setQ] = useState('');
  const featured = MOCK_ARTISTS.find((a) => a.id === FEATURED_ARTIST_ID)!;
  const otherArtists = MOCK_ARTISTS.filter((a) => a.id !== FEATURED_ARTIST_ID);
  const artists = otherArtists.filter((a) => a.name.toLowerCase().includes(q.toLowerCase()));
  const trendingSongs = MOCK_ARTISTS.flatMap((a) => a.songs.map((s) => ({ ...s, artist: a }))).sort((a, b) => b.plays - a.plays);

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <header className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-rose to-violet flex items-center justify-center">
              <Music2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-heading font-bold gradient-text">Music · Wasanii</h1>
              <p className="text-sm text-muted-foreground">Discover artists, listen, and connect</p>
            </div>
          </div>
        </header>

        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search artists, songs..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>

        {/* Featured Artist: King Misori */}
        <Link to={`/music/${featured.id}`} className="block">
          <Card className="overflow-hidden border-amber/40 hover:shadow-glow transition group">
            <div className="relative h-44 sm:h-56">
              <img src={featured.cover} alt={featured.name} className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/20" />
              <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-amber/90 text-black px-2.5 py-1 rounded-full text-xs font-bold">
                <Crown className="h-3.5 w-3.5" /> FEATURED ARTIST
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end gap-4">
                <Avatar className="h-20 w-20 border-4 border-amber shadow-xl">
                  <AvatarImage src={featured.avatar} />
                  <AvatarFallback>{featured.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 text-white">
                  <div className="flex items-center gap-1.5">
                    <h2 className="font-heading font-bold text-2xl truncate">{featured.name}</h2>
                    <BadgeCheck className="h-5 w-5 text-primary fill-primary shrink-0" />
                  </div>
                  <p className="text-sm text-white/80 line-clamp-1">{featured.bio}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-white/70">
                    <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-amber text-amber" /> {formatNumber(featured.followers)} followers</span>
                    <span>· {featured.songs.length} songs</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </Link>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Trending songs</h2>
          <div className="space-y-2">
            {trendingSongs.slice(0, 5).map((s, i) => (
              <Link key={s.id} to={`/music/${s.artist.id}`}>
                <Card className="flex items-center gap-3 p-3 hover:bg-muted/40 transition">
                  <span className="w-6 text-center font-bold text-muted-foreground">{i + 1}</span>
                  <img src={s.cover} alt={s.title} className="w-12 h-12 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{s.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{s.artist.name} · {formatNumber(s.plays)} plays</p>
                  </div>
                  <Button size="icon" variant="ghost"><Play className="h-4 w-4" /></Button>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Top artists</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {artists.map((a) => (
              <Link key={a.id} to={`/music/${a.id}`}>
                <Card className="overflow-hidden hover:shadow-glow transition">
                  <div className="h-24 bg-gradient-to-br from-rose to-violet relative">
                    <img src={a.cover} alt="" className="w-full h-full object-cover opacity-60" />
                  </div>
                  <div className="p-3 -mt-8 relative">
                    <Avatar className="h-14 w-14 border-4 border-card">
                      <AvatarImage src={a.avatar} />
                      <AvatarFallback>{a.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="mt-2 flex items-center gap-1">
                      <p className="font-semibold truncate">{a.name}</p>
                      {a.verified && <BadgeCheck className="h-4 w-4 text-primary shrink-0" />}
                    </div>
                    <p className="text-xs text-muted-foreground">{formatNumber(a.followers)} followers</p>
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {a.genres.slice(0, 2).map((g) => <Badge key={g} variant="secondary" className="text-[10px]">{g}</Badge>)}
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        <Card className="p-5 bg-gradient-to-br from-rose/10 to-violet/10 border-rose/20">
          <h3 className="font-heading font-bold mb-1">Are you an artist?</h3>
          <p className="text-sm text-muted-foreground mb-3">Upload your songs and reach millions of fans on WorldFace.</p>
          <Button>Upload your music</Button>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Music;
