import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { BadgeCheck, Play, Heart, MessageCircle, Share2, ArrowLeft, FileText } from 'lucide-react';
import { MOCK_ARTISTS, formatNumber, type Song } from '@/lib/mockData';
import { toast } from 'sonner';

const MusicArtist = () => {
  const { id } = useParams();
  const artist = MOCK_ARTISTS.find((a) => a.id === id);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [following, setFollowing] = useState(false);
  const [likedSongs, setLikedSongs] = useState<Record<string, boolean>>({});

  if (!artist) {
    return (
      <AppLayout>
        <div className="p-8 text-center">
          <p className="text-muted-foreground">Artist not found.</p>
          <Link to="/music"><Button variant="link">Back to Music</Button></Link>
        </div>
      </AppLayout>
    );
  }

  const toggleLike = (sid: string) => {
    setLikedSongs((p) => ({ ...p, [sid]: !p[sid] }));
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto pb-8">
        <div className="relative h-48 md:h-64">
          <img src={artist.cover} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
          <Link to="/music" className="absolute top-4 left-4 w-9 h-9 rounded-full bg-black/40 backdrop-blur flex items-center justify-center">
            <ArrowLeft className="h-4 w-4 text-white" />
          </Link>
        </div>

        <div className="px-4 -mt-16 relative">
          <Avatar className="h-28 w-28 border-4 border-background">
            <AvatarImage src={artist.avatar} />
            <AvatarFallback>{artist.name[0]}</AvatarFallback>
          </Avatar>
          <div className="mt-3 flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-2xl font-heading font-bold">{artist.name}</h1>
                {artist.verified && <BadgeCheck className="h-5 w-5 text-primary" />}
              </div>
              <p className="text-sm text-muted-foreground">{artist.handle} · {formatNumber(artist.followers)} followers</p>
              <div className="flex gap-1 mt-2 flex-wrap">
                {artist.genres.map((g) => <Badge key={g} variant="secondary">{g}</Badge>)}
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button variant={following ? 'outline' : 'default'} size="sm" onClick={() => setFollowing(!following)}>
                {following ? 'Following' : 'Follow'}
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-3">{artist.bio}</p>

          <div className="flex gap-4 mt-3 text-sm">
            <button className="flex items-center gap-1 text-muted-foreground hover:text-foreground">
              <Heart className="h-4 w-4" /> Like page
            </button>
            <button className="flex items-center gap-1 text-muted-foreground hover:text-foreground">
              <MessageCircle className="h-4 w-4" /> Comment
            </button>
            <button className="flex items-center gap-1 text-muted-foreground hover:text-foreground" onClick={() => { navigator.clipboard?.writeText(window.location.href); toast.success('Link copied'); }}>
              <Share2 className="h-4 w-4" /> Share
            </button>
          </div>
        </div>

        <section className="px-4 mt-6 space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Songs</h2>
          <div className="space-y-2">
            {artist.songs.map((s, i) => (
              <Card key={s.id} className="p-3">
                <div className="flex items-center gap-3">
                  <span className="w-6 text-center font-bold text-muted-foreground">{i + 1}</span>
                  <img src={s.cover} alt="" className="w-12 h-12 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{s.title}</p>
                    <p className="text-xs text-muted-foreground">{s.duration} · {formatNumber(s.plays)} plays · {s.releaseYear}</p>
                  </div>
                  <Button size="icon" variant="ghost"><Play className="h-4 w-4" /></Button>
                </div>
                <div className="flex items-center gap-4 mt-3 pl-9 text-xs">
                  <button onClick={() => toggleLike(s.id)} className={`flex items-center gap-1 ${likedSongs[s.id] ? 'text-rose' : 'text-muted-foreground'}`}>
                    <Heart className={`h-3.5 w-3.5 ${likedSongs[s.id] ? 'fill-current' : ''}`} /> {formatNumber(s.likes + (likedSongs[s.id] ? 1 : 0))}
                  </button>
                  <span className="flex items-center gap-1 text-muted-foreground"><MessageCircle className="h-3.5 w-3.5" /> {formatNumber(s.comments)}</span>
                  <span className="flex items-center gap-1 text-muted-foreground"><Share2 className="h-3.5 w-3.5" /> {formatNumber(s.shares)}</span>
                  <button onClick={() => setSelectedSong(selectedSong?.id === s.id ? null : s)} className="ml-auto flex items-center gap-1 text-primary">
                    <FileText className="h-3.5 w-3.5" /> {selectedSong?.id === s.id ? 'Hide' : 'Lyrics'}
                  </button>
                </div>
                {selectedSong?.id === s.id && (
                  <pre className="mt-3 pl-9 text-sm font-body whitespace-pre-wrap text-muted-foreground italic border-l-2 border-primary pl-4 ml-9">{s.lyrics}</pre>
                )}
              </Card>
            ))}
          </div>
        </section>
      </div>
    </AppLayout>
  );
};

export default MusicArtist;
