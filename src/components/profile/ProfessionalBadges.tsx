import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Briefcase, Mic2, Rocket, Crown, Palette, Building2 } from 'lucide-react';

export type ProBadge =
  | 'artist'
  | 'entrepreneur'
  | 'founder'
  | 'creator'
  | 'business'
  | 'musician';

export const PRO_BADGES: {
  key: ProBadge;
  label: string;
  icon: React.ReactNode;
  color: string;
}[] = [
  { key: 'artist', label: 'Artist', icon: <Palette className="h-3 w-3" />, color: 'from-pink-500/20 to-rose-500/20 text-pink-300 border-pink-500/30' },
  { key: 'musician', label: 'Musician', icon: <Mic2 className="h-3 w-3" />, color: 'from-purple-500/20 to-fuchsia-500/20 text-purple-300 border-purple-500/30' },
  { key: 'entrepreneur', label: 'Entrepreneur', icon: <Rocket className="h-3 w-3" />, color: 'from-amber-500/20 to-orange-500/20 text-amber-300 border-amber-500/30' },
  { key: 'founder', label: 'Founder', icon: <Crown className="h-3 w-3" />, color: 'from-yellow-500/20 to-amber-500/20 text-yellow-300 border-yellow-500/30' },
  { key: 'creator', label: 'Creator', icon: <Briefcase className="h-3 w-3" />, color: 'from-blue-500/20 to-cyan-500/20 text-blue-300 border-blue-500/30' },
  { key: 'business', label: 'Business', icon: <Building2 className="h-3 w-3" />, color: 'from-emerald-500/20 to-teal-500/20 text-emerald-300 border-emerald-500/30' },
];

interface DisplayProps {
  badges: string[] | null | undefined;
  className?: string;
}

export const ProfessionalBadgesDisplay = ({ badges, className }: DisplayProps) => {
  if (!badges || badges.length === 0) return null;
  const list = PRO_BADGES.filter((b) => badges.includes(b.key));
  if (list.length === 0) return null;
  return (
    <div className={cn('flex flex-wrap gap-1.5 justify-center', className)}>
      {list.map((b) => (
        <Badge
          key={b.key}
          variant="outline"
          className={cn(
            'gap-1 px-2 py-0.5 text-[10px] font-medium bg-gradient-to-r',
            b.color,
          )}
        >
          {b.icon}
          {b.label}
        </Badge>
      ))}
    </div>
  );
};

interface EditorProps {
  selected: string[];
  onChange: (v: string[]) => void;
}

export const ProfessionalBadgesEditor = ({ selected, onChange }: EditorProps) => {
  const toggle = (k: ProBadge) => {
    if (selected.includes(k)) onChange(selected.filter((s) => s !== k));
    else onChange([...selected, k]);
  };
  return (
    <div className="flex flex-wrap gap-2">
      {PRO_BADGES.map((b) => {
        const active = selected.includes(b.key);
        return (
          <button
            key={b.key}
            type="button"
            onClick={() => toggle(b.key)}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition',
              active
                ? cn('bg-gradient-to-r', b.color)
                : 'border-border bg-background text-muted-foreground hover:text-foreground',
            )}
          >
            {b.icon}
            {b.label}
          </button>
        );
      })}
    </div>
  );
};
