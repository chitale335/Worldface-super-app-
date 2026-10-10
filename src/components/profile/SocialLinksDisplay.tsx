import { Instagram, Globe, Send, Facebook, Linkedin, Youtube } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SocialLinksDisplayProps {
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
  };
}

const LINK_MAP: { key: string; icon: React.ReactNode; label: string }[] = [
  { key: 'instagram_url', icon: <Instagram className="h-4 w-4" />, label: 'Instagram' },
  { key: 'twitter_url', icon: <span className="font-bold text-xs">𝕏</span>, label: 'X' },
  { key: 'facebook_url', icon: <Facebook className="h-4 w-4" />, label: 'Facebook' },
  { key: 'telegram_url', icon: <Send className="h-4 w-4" />, label: 'Telegram' },
  { key: 'tiktok_url', icon: <span className="text-sm">♪</span>, label: 'TikTok' },
  { key: 'youtube_url', icon: <Youtube className="h-4 w-4" />, label: 'YouTube' },
  { key: 'linkedin_url', icon: <Linkedin className="h-4 w-4" />, label: 'LinkedIn' },
  { key: 'website', icon: <Globe className="h-4 w-4" />, label: 'Website' },
];

export const SocialLinksDisplay = ({ profile }: SocialLinksDisplayProps) => {
  const links = LINK_MAP.filter(
    (l) => (profile as Record<string, unknown>)[l.key]
  );

  if (links.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5">
      {links.map((l) => (
        <Button
          key={l.key}
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-full"
          asChild
        >
          <a
            href={(profile as Record<string, string>)[l.key]}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={l.label}
          >
            {l.icon}
          </a>
        </Button>
      ))}
    </div>
  );
};
