import { useState } from 'react';
import { Instagram, Globe, Send, Facebook, Linkedin, Youtube, Link2, Copy, ExternalLink, Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface LinksHubProps {
  profile: {
    username?: string | null;
    instagram_url?: string | null;
    twitter_url?: string | null;
    telegram_url?: string | null;
    facebook_url?: string | null;
    tiktok_url?: string | null;
    youtube_url?: string | null;
    linkedin_url?: string | null;
    website?: string | null;
  } | null;
}

const LINKS: {
  key: string;
  label: string;
  icon: React.ReactNode;
  color: string;
}[] = [
  { key: 'instagram_url', label: 'Instagram', icon: <Instagram className="h-5 w-5" />, color: 'from-pink-500 to-orange-500' },
  { key: 'twitter_url', label: 'X (Twitter)', icon: <span className="font-bold text-lg">𝕏</span>, color: 'from-slate-700 to-slate-900' },
  { key: 'facebook_url', label: 'Facebook', icon: <Facebook className="h-5 w-5" />, color: 'from-blue-600 to-blue-800' },
  { key: 'telegram_url', label: 'Telegram', icon: <Send className="h-5 w-5" />, color: 'from-sky-400 to-blue-600' },
  { key: 'tiktok_url', label: 'TikTok', icon: <span className="text-lg font-bold">♪</span>, color: 'from-fuchsia-500 to-slate-900' },
  { key: 'youtube_url', label: 'YouTube', icon: <Youtube className="h-5 w-5" />, color: 'from-red-500 to-red-700' },
  { key: 'linkedin_url', label: 'LinkedIn', icon: <Linkedin className="h-5 w-5" />, color: 'from-blue-500 to-blue-700' },
  { key: 'website', label: 'Website', icon: <Globe className="h-5 w-5" />, color: 'from-emerald-500 to-teal-700' },
];

export const LinksHub = ({ profile }: LinksHubProps) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState<string | null>(null);

  const items = LINKS.filter((l) => (profile as any)?.[l.key]);
  const publicUrl = profile?.username
    ? `${window.location.origin}/u/${profile.username}`
    : null;

  const copy = (val: string, key: string) => {
    navigator.clipboard.writeText(val);
    setCopied(key);
    toast({ title: 'Imenakiliwa!' });
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <Card className="glass-elevated">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Link2 className="h-4 w-4 text-primary" />
          <h3 className="font-heading font-semibold text-sm uppercase tracking-wider">Links Hub</h3>
          <span className="ml-auto text-xs text-muted-foreground">{items.length + (publicUrl ? 1 : 0)}</span>
        </div>

        {publicUrl && (
          <div className="p-3 rounded-lg bg-gradient-to-r from-primary/10 via-blue-500/10 to-violet-500/10 border border-primary/20">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Public Page</p>
            <div className="flex items-center gap-2">
              <p className="text-sm font-mono text-primary truncate flex-1">{publicUrl}</p>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => copy(publicUrl, 'public')}>
                {copied === 'public' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
              <Button size="icon" variant="ghost" className="h-7 w-7" asChild>
                <a href={publicUrl} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-3.5 w-3.5" /></a>
              </Button>
            </div>
          </div>
        )}

        {items.length === 0 && !publicUrl && (
          <p className="text-xs text-muted-foreground text-center py-4">
            Hakuna viungo bado. Ongeza kwenye "Edit profile".
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {items.map((l) => {
            const url = (profile as any)[l.key] as string;
            return (
              <div key={l.key} className="flex items-center gap-2 p-2 rounded-lg border border-border/50 bg-card/50 hover:bg-card transition">
                <div className={`h-9 w-9 rounded-lg bg-gradient-to-br ${l.color} text-white flex items-center justify-center shrink-0`}>
                  {l.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium">{l.label}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{url}</p>
                </div>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => copy(url, l.key)}>
                  {copied === l.key ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" asChild>
                  <a href={url} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-3.5 w-3.5" /></a>
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
