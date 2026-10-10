import { Link } from 'react-router-dom';
import { CulturalVerseLayout } from './CulturalVerseLayout';
import { Card } from '@/components/ui/card';
import { Globe2, Building2, Bot, Music2, UtensilsCrossed, Shirt, Users, Trophy, BookOpen, Sparkles, ShoppingBag, Languages, Mic, Video, TreePine } from 'lucide-react';

const features = [
  { to: '/culturalverse/map', title: 'Global Cultural Map', desc: 'Explore cultures by country', icon: Globe2, color: 'from-cyan to-primary' },
  { to: '/culturalverse/mentor', title: 'AI Cultural Mentor', desc: 'Ask about any culture', icon: Bot, color: 'from-violet to-primary' },
  { to: '/culturalverse/mentor?mode=language', title: 'Language Companion', desc: 'Learn & translate live', icon: Languages, color: 'from-emerald to-cyan' },
  { to: '/culturalverse/museums', title: 'Virtual Museums', desc: 'Curate heritage collections', icon: Building2, color: 'from-amber to-rose' },
  { to: '/culturalverse/music', title: 'Heritage Music', desc: 'Traditional songs & instruments', icon: Music2, color: 'from-rose to-violet' },
  { to: '/culturalverse/recipes', title: 'World Recipes', desc: 'Traditional cuisine step-by-step', icon: UtensilsCrossed, color: 'from-amber to-emerald' },
  { to: '/culturalverse/fashion', title: 'Traditional Fashion', desc: 'Clothing across cultures', icon: Shirt, color: 'from-violet to-rose' },
  { to: '/culturalverse/stories', title: 'Oral History Archive', desc: 'Preserve elders\u2019 voices', icon: Mic, color: 'from-cyan to-violet' },
  { to: '/culturalverse/live', title: 'Festival Live', desc: 'Streamed cultural events', icon: Video, color: 'from-rose to-amber' },
  { to: '/culturalverse/groups', title: 'Cultural Groups', desc: 'Facebook-style communities', icon: Users, color: 'from-primary to-emerald' },
  { to: '/culturalverse/ambassadors', title: 'Ambassador Program', desc: 'Earn as a cultural creator', icon: Sparkles, color: 'from-amber to-primary' },
  { to: '/culturalverse/exchange', title: 'Cultural Exchange', desc: 'Meet people worldwide', icon: Globe2, color: 'from-emerald to-violet' },
  { to: '/culturalverse/marketplace', title: 'Cultural Marketplace', desc: 'Artisan crafts & art', icon: ShoppingBag, color: 'from-amber to-rose' },
  { to: '/culturalverse/learn', title: 'Learning Center', desc: 'Micro-courses & certificates', icon: BookOpen, color: 'from-cyan to-primary' },
  { to: '/culturalverse/challenges', title: 'Heritage Challenge', desc: 'Monthly cultural contests', icon: Trophy, color: 'from-amber to-rose' },
  { to: '/culturalverse/heritage-tree', title: 'Family Heritage Tree', desc: 'Preserve your lineage', icon: TreePine, color: 'from-emerald to-cyan' },
];

export default function CulturalVerseHub() {
  return (
    <CulturalVerseLayout>
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="rounded-3xl overflow-hidden mb-6 p-8 md:p-12 relative bg-gradient-to-br from-primary/20 via-violet/10 to-cyan/20 border border-border/50">
          <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 30% 20%, hsl(var(--primary)/0.35), transparent 50%), radial-gradient(circle at 80% 70%, hsl(var(--violet)/0.35), transparent 50%)' }} />
          <div className="relative">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur border border-white/20 text-xs font-medium mb-4">
              <Sparkles className="h-3.5 w-3.5" /> New on WorldFace
            </div>
            <h2 className="font-heading text-3xl md:text-5xl font-bold mb-3 gradient-text">Discover the world&apos;s cultures</h2>
            <p className="text-muted-foreground max-w-2xl md:text-lg">
              Preserve, learn about, and celebrate world cultures. Powered by AI, community and heritage.
            </p>
            <div className="flex flex-wrap gap-2 mt-6">
              <Link to="/culturalverse/map" className="px-5 py-2.5 rounded-full bg-primary text-primary-foreground font-medium text-sm shadow-glow hover:opacity-90 transition">Open World Map</Link>
              <Link to="/culturalverse/mentor" className="px-5 py-2.5 rounded-full bg-card border border-border/50 font-medium text-sm hover:border-primary/50 transition">Ask AI Mentor</Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {features.map(({ to, title, desc, icon: Icon, color }) => (
            <Link key={to} to={to}>
              <Card className="p-4 h-full hover:border-primary/50 transition-all hover:-translate-y-0.5 hover:shadow-glow group cursor-pointer">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-3 shadow-md group-hover:scale-110 transition-transform`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-heading font-semibold text-sm mb-1">{title}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2">{desc}</p>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </CulturalVerseLayout>
  );
}
