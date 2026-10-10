import { NavLink, useLocation } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { Globe2, Building2, Bot, Music2, UtensilsCrossed, Shirt, Users, Trophy, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

const links = [
  { to: '/culturalverse', label: 'Hub', icon: Globe2, end: true },
  { to: '/culturalverse/map', label: 'World Map', icon: Globe2 },
  { to: '/culturalverse/mentor', label: 'AI Mentor', icon: Bot },
  { to: '/culturalverse/museums', label: 'Museums', icon: Building2 },
  { to: '/culturalverse/music', label: 'Music', icon: Music2 },
  { to: '/culturalverse/recipes', label: 'Recipes', icon: UtensilsCrossed },
  { to: '/culturalverse/fashion', label: 'Fashion', icon: Shirt },
  { to: '/culturalverse/groups', label: 'Groups', icon: Users },
  { to: '/culturalverse/challenges', label: 'Challenges', icon: Trophy },
  { to: '/culturalverse/learn', label: 'Learn', icon: BookOpen },
];

export const CulturalVerseLayout = ({ children }: { children: React.ReactNode }) => {
  const { pathname } = useLocation();
  return (
    <AppLayout>
      <div className="border-b border-border/50 bg-gradient-to-r from-primary/5 via-transparent to-violet/5 sticky top-0 z-30 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="font-heading text-xl font-bold gradient-text">CulturalVerse</h1>
              <p className="text-xs text-muted-foreground">One World. Many Cultures. One Community.</p>
            </div>
          </div>
          <nav className="flex overflow-x-auto scrollbar-hide gap-1.5 -mx-1 px-1">
            {links.map(({ to, label, icon: Icon, end }) => {
              const active = end ? pathname === to : pathname.startsWith(to);
              return (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all shrink-0 border',
                    active
                      ? 'bg-primary text-primary-foreground border-primary shadow-md'
                      : 'bg-card/50 border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/40',
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>
      {children}
    </AppLayout>
  );
};
