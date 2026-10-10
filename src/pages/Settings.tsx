import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ExternalLink, Shield, FileText, Bell, Globe, ShoppingBag, Crown,
  Moon, Lock, Wifi, Code2, KeyRound, Languages, User, MessageCircle,
  Image as ImageIcon, Palette, Sparkles, Briefcase, LifeBuoy, ChevronRight,
  UserCircle2, AtSign, Eye, Smartphone, Download, Volume2, Paintbrush, HelpCircle, Mail
} from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { NotificationSettings } from '@/components/NotificationSettings';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';

type AppSettings = {
  darkMode: boolean;
  language: 'en' | 'sw';
  privacy: boolean;
  twoFactor: boolean;
  wifiOnly: boolean;
  developerMode: boolean;
  autoplayVideos: boolean;
  highQualityUploads: boolean;
  readReceipts: boolean;
  showOnlineStatus: boolean;
  reduceMotion: boolean;
  compactMode: boolean;
};

const DEFAULTS: AppSettings = {
  darkMode: true,
  language: 'en',
  privacy: true,
  twoFactor: false,
  wifiOnly: false,
  developerMode: false,
  autoplayVideos: true,
  highQualityUploads: false,
  readReceipts: true,
  showOnlineStatus: true,
  reduceMotion: false,
  compactMode: false,
};

const STORAGE_KEY = 'worldface.appSettings';

const APPROVED_LINKS = [
  { name: 'WorldFace', url: 'https://worldface.base44.app', icon: Globe, color: 'from-primary to-violet' },
  { name: 'King Misori', url: 'https://kingmisori.link', icon: Crown, color: 'from-amber to-amber-600' },
  { name: 'NexaStore', url: 'https://nexastore-app.base44.app', icon: ShoppingBag, color: 'from-emerald to-cyan' },
];

const Settings = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { setLang } = useLanguage();
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
    } catch {
      return DEFAULTS;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    document.documentElement.classList.toggle('dark', settings.darkMode);
    document.documentElement.lang = settings.language;
    window.dispatchEvent(new Event('worldface:settings-changed'));
  }, [settings]);

  const update = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings((s) => ({ ...s, [key]: value }));
    if (key === 'language') setLang(value as 'en' | 'sw');
  };

  const ToggleRow = ({
    icon: Icon, color, label, desc, settingKey, onTrueToast,
  }: {
    icon: typeof Moon; color: string; label: string; desc: string;
    settingKey: keyof AppSettings; onTrueToast?: { title: string; description: string };
  }) => (
    <div className="flex items-center gap-3 p-4">
      <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center shrink-0`}>
        <Icon className="h-4 w-4 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <Label htmlFor={settingKey} className="font-medium cursor-pointer text-sm">{label}</Label>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <Switch
        id={settingKey}
        checked={Boolean(settings[settingKey])}
        onCheckedChange={(v) => {
          update(settingKey, v as never);
          if (v && onTrueToast) toast(onTrueToast);
        }}
      />
    </div>
  );

  const LinkRow = ({
    to, icon: Icon, color, label, desc, external,
  }: {
    to: string; icon: typeof User; color: string; label: string; desc?: string; external?: boolean;
  }) => {
    const inner = (
      <>
        <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center shrink-0`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{label}</p>
          {desc && <p className="text-xs text-muted-foreground truncate">{desc}</p>}
        </div>
        {external ? <ExternalLink className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
      </>
    );
    return external ? (
      <a href={to} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 hover:bg-muted/40 transition-colors">
        {inner}
      </a>
    ) : (
      <Link to={to} className="flex items-center gap-3 p-4 hover:bg-muted/40 transition-colors">
        {inner}
      </Link>
    );
  };


  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto p-4 space-y-6">
        <header className="pt-2">
          <h1 className="text-3xl font-heading font-bold gradient-text">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your account, privacy, and preferences</p>
        </header>

        <Accordion type="multiple" className="space-y-3">
          {/* Account Center */}
          <AccordionItem value="account" className="border rounded-xl px-1 bg-card">
            <AccordionTrigger className="px-3 hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-violet flex items-center justify-center">
                  <UserCircle2 className="h-4 w-4 text-white" />
                </div>
                <span className="font-semibold text-sm">Account Center</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <Card className="divide-y divide-border">
                {user && <LinkRow to={`/u/${user.id}`} icon={User} color="from-primary to-violet" label="My Account" desc={user.email ?? ''} />}
                <LinkRow to="/wallet" icon={Briefcase} color="from-amber to-emerald" label="Wallet & Payments" desc="NexaPay account, balance" />
                <LinkRow to="/rewards" icon={Sparkles} color="from-amber to-rose" label="Rewards" desc="Coins, achievements" />
              </Card>
            </AccordionContent>
          </AccordionItem>

          {/* Profile */}
          <AccordionItem value="profile" className="border rounded-xl px-1 bg-card">
            <AccordionTrigger className="px-3 hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan to-primary flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <span className="font-semibold text-sm">Profile</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <Card className="divide-y divide-border">
                <LinkRow to="/profile" icon={User} color="from-primary to-violet" label="Edit Profile" desc="Name, bio, photo" />
                <LinkRow to="/profile" icon={AtSign} color="from-cyan to-primary" label="Username & Links" desc="Social handles" />
              </Card>
            </AccordionContent>
          </AccordionItem>

          {/* Privacy */}
          <AccordionItem value="privacy" className="border rounded-xl px-1 bg-card">
            <AccordionTrigger className="px-3 hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-rose to-amber flex items-center justify-center">
                  <Lock className="h-4 w-4 text-white" />
                </div>
                <span className="font-semibold text-sm">Privacy</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <Card className="divide-y divide-border">
                <ToggleRow icon={Lock} color="from-rose to-amber" label="Private Account" desc="Hide activity from non-followers" settingKey="privacy" />
                <ToggleRow icon={Eye} color="from-violet to-primary" label="Show Online Status" desc="Let others see when you're active" settingKey="showOnlineStatus" />
                <LinkRow to="/privacy" icon={Shield} color="from-emerald to-cyan" label="Privacy Policy" desc="How we handle your data" />
              </Card>
            </AccordionContent>
          </AccordionItem>

          {/* Security */}
          <AccordionItem value="security" className="border rounded-xl px-1 bg-card">
            <AccordionTrigger className="px-3 hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald to-cyan flex items-center justify-center">
                  <Shield className="h-4 w-4 text-white" />
                </div>
                <span className="font-semibold text-sm">Security</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <Card className="divide-y divide-border">
                <ToggleRow
                  icon={KeyRound} color="from-emerald to-cyan"
                  label="Two-Factor Authentication" desc="Extra layer of security on login"
                  settingKey="twoFactor"
                  onTrueToast={{ title: '2FA setup', description: 'Two-factor setup will be available soon.' }}
                />
              </Card>
            </AccordionContent>
          </AccordionItem>

          {/* Notifications */}
          <AccordionItem value="notifications" className="border rounded-xl px-1 bg-card">
            <AccordionTrigger className="px-3 hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-rose to-amber flex items-center justify-center">
                  <Bell className="h-4 w-4 text-white" />
                </div>
                <span className="font-semibold text-sm">Notifications</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <Card className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-sm">Notification preferences</p>
                    <p className="text-xs text-muted-foreground">Sound, vibration, quiet hours</p>
                  </div>
                  <NotificationSettings trigger={<Button size="sm" variant="outline">Configure</Button>} />
                </div>
              </Card>
            </AccordionContent>
          </AccordionItem>

          {/* Messages */}
          <AccordionItem value="messages" className="border rounded-xl px-1 bg-card">
            <AccordionTrigger className="px-3 hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald to-cyan flex items-center justify-center">
                  <MessageCircle className="h-4 w-4 text-white" />
                </div>
                <span className="font-semibold text-sm">Messages</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <Card className="divide-y divide-border">
                <ToggleRow icon={Eye} color="from-emerald to-cyan" label="Read Receipts" desc="Show others when you've read messages" settingKey="readReceipts" />
                <LinkRow to="/messages" icon={MessageCircle} color="from-emerald to-cyan" label="Inbox" desc="View your conversations" />
              </Card>
            </AccordionContent>
          </AccordionItem>

          {/* Content & Media */}
          <AccordionItem value="content" className="border rounded-xl px-1 bg-card">
            <AccordionTrigger className="px-3 hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet to-rose flex items-center justify-center">
                  <ImageIcon className="h-4 w-4 text-white" />
                </div>
                <span className="font-semibold text-sm">Content & Media</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <Card className="divide-y divide-border">
                <ToggleRow icon={Volume2} color="from-violet to-rose" label="Autoplay Videos" desc="Play videos automatically in feed" settingKey="autoplayVideos" />
                <ToggleRow icon={Download} color="from-cyan to-primary" label="High-Quality Uploads" desc="Upload media at full resolution" settingKey="highQualityUploads" />
                <ToggleRow icon={Wifi} color="from-cyan to-primary" label="WiFi Downloads Only" desc="Save mobile data on media" settingKey="wifiOnly" />
              </Card>
            </AccordionContent>
          </AccordionItem>

          {/* Appearance */}
          <AccordionItem value="appearance" className="border rounded-xl px-1 bg-card">
            <AccordionTrigger className="px-3 hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-violet flex items-center justify-center">
                  <Palette className="h-4 w-4 text-white" />
                </div>
                <span className="font-semibold text-sm">Appearance</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <Card className="divide-y divide-border">
                <ToggleRow icon={Moon} color="from-primary to-violet" label="Dark Mode" desc="Reduce eye strain in low light" settingKey="darkMode" />
                <ToggleRow icon={Paintbrush} color="from-rose to-amber" label="Reduce Motion" desc="Minimize animations" settingKey="reduceMotion" />
                <ToggleRow icon={Smartphone} color="from-cyan to-primary" label="Compact Mode" desc="Denser layout, more on screen" settingKey="compactMode" />
              </Card>
            </AccordionContent>
          </AccordionItem>

          {/* Language */}
          <AccordionItem value="language" className="border rounded-xl px-1 bg-card">
            <AccordionTrigger className="px-3 hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet to-primary flex items-center justify-center">
                  <Languages className="h-4 w-4 text-white" />
                </div>
                <span className="font-semibold text-sm">Language</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <Card className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <Label className="font-medium text-sm">App language</Label>
                    <p className="text-xs text-muted-foreground">Choose your preferred language</p>
                  </div>
                  <Select value={settings.language} onValueChange={(v: 'en' | 'sw') => update('language', v)}>
                    <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="sw">Kiswahili</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </Card>
            </AccordionContent>
          </AccordionItem>

          {/* Creator Tools */}
          <AccordionItem value="creator" className="border rounded-xl px-1 bg-card">
            <AccordionTrigger className="px-3 hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-rose to-violet flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <span className="font-semibold text-sm">Creator Tools</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <Card className="divide-y divide-border">
                <LinkRow to="/studio" icon={Sparkles} color="from-rose to-violet" label="Studio" desc="Create reels, edit media" />
                <LinkRow to="/live" icon={Volume2} color="from-red-500 to-amber" label="Go Live" desc="Start a live stream" />
                <LinkRow to="/ai" icon={Sparkles} color="from-violet to-cyan" label="NexaAI" desc="AI assistant for creators" />
              </Card>
            </AccordionContent>
          </AccordionItem>

          {/* Business Tools */}
          <AccordionItem value="business" className="border rounded-xl px-1 bg-card">
            <AccordionTrigger className="px-3 hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber to-emerald flex items-center justify-center">
                  <Briefcase className="h-4 w-4 text-white" />
                </div>
                <span className="font-semibold text-sm">Business Tools</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <Card className="divide-y divide-border">
                <LinkRow to="/payments" icon={Briefcase} color="from-amber to-emerald" label="Payments" desc="NexaPay business" />
                <LinkRow to="/wallet" icon={Briefcase} color="from-amber to-emerald" label="Wallet" desc="Balance, transactions" />
              </Card>
            </AccordionContent>
          </AccordionItem>

          {/* Developer Tools */}
          <AccordionItem value="developer" className="border rounded-xl px-1 bg-card">
            <AccordionTrigger className="px-3 hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber to-rose flex items-center justify-center">
                  <Code2 className="h-4 w-4 text-white" />
                </div>
                <span className="font-semibold text-sm">Developer Tools</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <Card className="divide-y divide-border">
                <ToggleRow icon={Code2} color="from-amber to-rose" label="Developer Mode" desc="Show debug info and advanced options" settingKey="developerMode" />
              </Card>
            </AccordionContent>
          </AccordionItem>

          {/* Help & Support */}
          <AccordionItem value="help" className="border rounded-xl px-1 bg-card">
            <AccordionTrigger className="px-3 hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan to-emerald flex items-center justify-center">
                  <LifeBuoy className="h-4 w-4 text-white" />
                </div>
                <span className="font-semibold text-sm">Help & Support</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <Card className="divide-y divide-border">
                <LinkRow to="/blog" icon={HelpCircle} color="from-cyan to-emerald" label="Help Center" desc="Guides and FAQs" />
                <LinkRow to="mailto:support@worldface.app" icon={Mail} color="from-primary to-cyan" label="Contact Support" desc="support@worldface.app" external />
                <LinkRow to="/terms" icon={FileText} color="from-cyan to-primary" label="Terms & Conditions" desc="Rules for using WorldFace" />
                <LinkRow to="/privacy" icon={Shield} color="from-emerald to-cyan" label="Privacy Policy" desc="How we handle your data" />
              </Card>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Approved links */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">
            Approved links
          </h2>
          <Card className="divide-y divide-border">
            {APPROVED_LINKS.map((link) => (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 hover:bg-muted/40 transition-colors"
              >
                <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${link.color} flex items-center justify-center shrink-0`}>
                  <link.icon className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{link.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{link.url}</p>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
              </a>
            ))}
          </Card>
          <p className="text-xs text-muted-foreground px-1">
            ✓ These links are officially approved by WorldFace.
          </p>
        </section>

        <p className="text-center text-xs text-muted-foreground pt-4">
          WorldFace · NexaFace ecosystem
        </p>
      </div>
    </AppLayout>
  );
};

export default Settings;
