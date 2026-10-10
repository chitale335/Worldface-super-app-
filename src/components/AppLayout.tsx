import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Home, MessageCircle, User, LogOut, Compass, PlusSquare, Bell, Wallet, Trophy, Bot, Aperture, Radio, Crown, BookOpen, Settings as SettingsIcon, Shield, Music2, Package, ShoppingBag, Wand2, Newspaper, Users as UsersIcon, Globe2, Megaphone } from 'lucide-react';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { Button } from '@/components/ui/button';
import worldfaceLogo from '@/assets/worldface-logo.png';
import { useUnreadNotifications } from '@/hooks/useNotifications';
import { useMessageNotifications } from '@/hooks/useMessageNotifications';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';
import { useAppBadge } from '@/hooks/useAppBadge';
import { NotificationSettings } from '@/components/NotificationSettings';
import { cn } from '@/lib/utils';

export const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const unread = useUnreadNotifications();
  const unreadMessages = useUnreadMessages();
  const { isAdmin } = useIsAdmin();
  useMessageNotifications();
  useAppBadge(unread + unreadMessages, 'WorldFace');

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const navItems = [
    { to: '/', icon: Home, label: 'Feed', badge: 0, color: 'from-primary to-violet' },
    { to: '/explore', icon: Compass, label: 'Explore', badge: 0, color: 'from-cyan to-primary' },
    { to: '/communities', icon: UsersIcon, label: 'Communities', badge: 0, color: 'from-violet to-primary' },
    { to: '/culturalverse', icon: Globe2, label: 'CulturalVerse', badge: 0, color: 'from-cyan to-violet' },
    { to: '/create', icon: PlusSquare, label: 'Create', badge: 0, color: 'from-rose to-amber' },
    { to: '/notifications', icon: Bell, label: 'Activity', badge: unread, color: 'from-amber to-rose' },
    { to: '/messages', icon: MessageCircle, label: 'Inbox', badge: unreadMessages, color: 'from-emerald to-cyan' },
    { to: '/wallet', icon: Wallet, label: 'Wallet', badge: 0, color: 'from-amber to-emerald' },
    { to: '/rewards', icon: Trophy, label: 'Rewards', badge: 0, color: 'from-amber to-rose' },
    { to: '/ai', icon: Bot, label: 'NexaAI', badge: 0, color: 'from-violet to-cyan' },
    { to: '/music', icon: Music2, label: 'Music', badge: 0, color: 'from-rose to-violet' },
    { to: '/appstore', icon: Package, label: 'AppStore', badge: 0, color: 'from-cyan to-primary' },
    { to: '/marketplace', icon: ShoppingBag, label: 'Market', badge: 0, color: 'from-amber to-emerald' },
    { to: '/assistant', icon: Wand2, label: 'AI Helper', badge: 0, color: 'from-violet to-cyan' },
    { to: '/ads', icon: Megaphone, label: 'Ads', badge: 0, color: 'from-amber to-rose' },
    { to: '/news', icon: Newspaper, label: 'News', badge: 0, color: 'from-cyan to-emerald' },
    { to: '/studio', icon: Aperture, label: 'Studio', badge: 0, color: 'from-rose to-violet' },
    { to: '/live', icon: Radio, label: 'Live', badge: 0, color: 'from-red-500 to-amber' },
    { to: '/founder', icon: Crown, label: 'King Misori', badge: 0, color: 'from-amber to-amber-600' },
    { to: '/blog', icon: BookOpen, label: 'Blog', badge: 0, color: 'from-cyan to-emerald' },
    { to: '/settings', icon: SettingsIcon, label: 'Settings', badge: 0, color: 'from-slate-500 to-slate-700' },
    ...(isAdmin ? [{ to: '/admin', icon: Shield, label: 'Admin', badge: 0, color: 'from-rose to-amber' }] : []),
    { to: user ? `/u/${user.id}` : '/profile', icon: User, label: 'Profile', badge: 0, color: 'from-primary to-emerald' },
  ];

  const renderBadge = (count: number) =>
    count > 0 && (
      <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-gradient-to-r from-rose to-amber text-white text-[10px] font-bold flex items-center justify-center shadow-glow animate-pulse-glow">
        {count > 99 ? '99+' : count}
      </span>
    );

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 hidden lg:flex flex-col overflow-y-auto scrollbar-hide"
        style={{ background: 'linear-gradient(180deg, hsl(222 47% 8%) 0%, hsl(222 47% 11%) 50%, hsl(262 40% 14%) 100%)' }}
      >
        <div className="p-6 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
            <img src={worldfaceLogo} alt="WorldFace" width={24} height={24} className="brightness-0 invert" />
          </div>
          <span className="font-heading font-bold text-lg gradient-text">WORLDFACE</span>
        </div>

        <nav className="flex-1 px-3 space-y-0.5">
          {navItems.map(({ to, icon: Icon, label, badge, color }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                  isActive
                    ? `bg-gradient-to-r ${color} text-white shadow-lg shadow-primary/20`
                    : 'text-sidebar-foreground/70 hover:bg-white/5 hover:text-sidebar-foreground',
                )
              }
            >
              <span className="relative">
                <Icon className="h-5 w-5" />
                {renderBadge(badge)}
              </span>
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-white/10 space-y-1">
          <NotificationSettings
            trigger={
              <Button variant="ghost" className="w-full justify-start text-sidebar-foreground/70 hover:text-white hover:bg-white/5">
                <Bell className="h-5 w-5 mr-3" />
                Notifications
              </Button>
            }
          />
          <Button
            variant="ghost"
            className="w-full justify-start text-sidebar-foreground/70 hover:text-white hover:bg-white/5"
            onClick={handleSignOut}
          >
            <LogOut className="h-5 w-5 mr-3" />
            Sign out
          </Button>
        </div>
      </aside>

      {/* Mobile bottom nav — horizontally scrollable */}
      <nav
        className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-xl border-t border-border/50 lg:hidden z-50"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex overflow-x-auto scrollbar-hide py-2 px-1 gap-0.5">
          {navItems.map(({ to, icon: Icon, label, badge, color }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-0.5 min-w-[64px] px-2 py-1.5 text-[10px] font-medium transition-all duration-200 rounded-xl shrink-0',
                  isActive
                    ? `bg-gradient-to-b ${color} text-white shadow-md`
                    : 'text-muted-foreground hover:text-foreground',
                )
              }
            >
              <span className="relative">
                <Icon className="h-5 w-5" />
                {renderBadge(badge)}
              </span>
              {label}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Main content */}
      <main className="lg:ml-64 min-h-screen pb-24 lg:pb-0">
        {children}
      </main>
    </div>
  );
};
