import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Instagram, Globe, Send, Facebook } from 'lucide-react';

export type SocialLinks = {
  username: string;
  instagram_url: string;
  twitter_url: string;
  telegram_url: string;
  facebook_url: string;
  tiktok_url: string;
  youtube_url: string;
  linkedin_url: string;
};

const SOCIAL_FIELDS: { key: keyof SocialLinks; label: string; placeholder: string; icon?: React.ReactNode }[] = [
  { key: 'username', label: 'Web Name (URL)', placeholder: 'johndoe', icon: <Globe className="h-4 w-4" /> },
  { key: 'instagram_url', label: 'Instagram', placeholder: 'https://instagram.com/...', icon: <Instagram className="h-4 w-4" /> },
  { key: 'twitter_url', label: 'X (Twitter)', placeholder: 'https://x.com/...' },
  { key: 'facebook_url', label: 'Facebook', placeholder: 'https://facebook.com/...', icon: <Facebook className="h-4 w-4" /> },
  { key: 'telegram_url', label: 'Telegram', placeholder: 'https://t.me/...', icon: <Send className="h-4 w-4" /> },
  { key: 'tiktok_url', label: 'TikTok', placeholder: 'https://tiktok.com/@...' },
  { key: 'youtube_url', label: 'YouTube', placeholder: 'https://youtube.com/@...' },
  { key: 'linkedin_url', label: 'LinkedIn', placeholder: 'https://linkedin.com/in/...' },
];

interface SocialLinksEditorProps {
  links: SocialLinks;
  onChange: (links: SocialLinks) => void;
}

export const SocialLinksEditor = ({ links, onChange }: SocialLinksEditorProps) => {
  return (
    <div className="space-y-3">
      <h3 className="font-heading font-semibold text-sm text-muted-foreground uppercase tracking-wider">
        Social & Web Name
      </h3>
      {SOCIAL_FIELDS.map((f) => (
        <div key={f.key} className="space-y-1">
          <Label className="text-xs flex items-center gap-1.5">
            {f.icon}
            {f.label}
          </Label>
          <Input
            value={links[f.key] || ''}
            onChange={(e) => onChange({ ...links, [f.key]: e.target.value })}
            placeholder={f.placeholder}
            maxLength={255}
            className="h-9 text-sm"
          />
          {f.key === 'username' && links.username && (
            <p className="text-[10px] text-muted-foreground">
              Your page: worldface.app/u/{links.username}
            </p>
          )}
        </div>
      ))}
    </div>
  );
};
