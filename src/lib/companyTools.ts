import {
  Aperture,
  Radio,
  Bot,
  Wand2,
  Trophy,
  BarChart3,
  Users,
  Music2,
  Globe2,
  ShoppingBag,
  Megaphone,
  Wallet,
  CreditCard,
  Banknote,
  MessageCircle,
  Newspaper,
  Code2,
  Package,
  BookOpen,
  Shield,
  Settings as SettingsIcon,
  UserRound,
  Landmark,
  type LucideIcon,
} from 'lucide-react';

export type CompanyKind = 'creator' | 'business' | 'development' | 'enterprise';
export type ToolCategory = CompanyKind;

export interface CompanyTool {
  key: string;
  name: string;
  desc: string;
  icon: LucideIcon;
  link: string;
  category: ToolCategory;
  color: string;
}

export const COMPANY_KINDS: { value: CompanyKind; label: string; blurb: string }[] = [
  { value: 'creator', label: 'Creator', blurb: 'Msanii au mtu binafsi — tengeneza, kua, na kupata mapato.' },
  { value: 'business', label: 'Business', blurb: 'Biashara — uza bidhaa, dhibiti wateja na mauzo.' },
  { value: 'development', label: 'Development', blurb: 'Msanidi au studio — jenga na kusambaza apps.' },
  { value: 'enterprise', label: 'Enterprise', blurb: 'Kampuni kubwa — timu, matangazo na usimamizi.' },
];

export const TOOL_CATEGORIES: { value: ToolCategory; label: string; blurb: string }[] = [
  { value: 'creator', label: 'Creator Tools', blurb: 'Tengeneza maudhui, kua, na kufuatilia mapato yako.' },
  { value: 'business', label: 'Business Tools', blurb: 'Uza, dhibiti wateja, na endesha kampeni za mauzo.' },
  { value: 'development', label: 'Development Tools', blurb: 'Jenga, sambaza, na kusimamia bidhaa za kidijitali.' },
  { value: 'enterprise', label: 'Enterprise Tools', blurb: 'Timu, usimamizi, na uchanganuzi wa shirika zima.' },
];

export const COMPANY_TOOLS: CompanyTool[] = [
  // ── Creator ───────────────────────────────────────────────────────────────
  { key: 'studio', name: 'Studio', desc: 'Hariri video, picha na maudhui ya muda mfupi.', icon: Aperture, link: '/studio', category: 'creator', color: 'from-violet-600 to-purple-600' },
  { key: 'live', name: 'Go Live', desc: 'Anzisha livestream na ujenge hadhira moja kwa moja.', icon: Radio, link: '/live', category: 'creator', color: 'from-red-500 to-orange-500' },
  { key: 'nexa-ai', name: 'NexaAI', desc: 'AI assistant kwa maudhui, mawazo na msaada.', icon: Bot, link: '/ai', category: 'creator', color: 'from-cyan-500 to-blue-500' },
  { key: 'ai-helper', name: 'AI Helper', desc: 'Msaidizi wa haraka kwa kazi za kila siku.', icon: Wand2, link: '/assistant', category: 'creator', color: 'from-violet-500 to-cyan-500' },
  { key: 'rewards', name: 'Rewards', desc: 'Coins, XP na hatua za mafanikio ya mbunifu.', icon: Trophy, link: '/rewards', category: 'creator', color: 'from-amber-500 to-yellow-500' },
  { key: 'creator-analytics', name: 'Creator Analytics', desc: 'Ufikiaji, mwingiliano na ukuaji wa hadhira.', icon: BarChart3, link: '/payouts/analytics', category: 'creator', color: 'from-emerald-500 to-teal-500' },
  { key: 'creator-communities', name: 'Communities', desc: 'Jenga jamii na mashabiki wa brand yako.', icon: Users, link: '/communities', category: 'creator', color: 'from-pink-500 to-rose-500' },
  { key: 'music', name: 'Music Studio', desc: 'Sambaza nyimbo na dhibiti wasanii.', icon: Music2, link: '/music', category: 'creator', color: 'from-rose-500 to-violet-500' },
  { key: 'culturalverse', name: 'CulturalVerse', desc: 'Maudhui ya kitamaduni, makumbusho na urithi.', icon: Globe2, link: '/culturalverse', category: 'creator', color: 'from-cyan-500 to-emerald-500' },

  // ── Business ──────────────────────────────────────────────────────────────
  { key: 'marketplace', name: 'Marketplace Store', desc: 'Orodhesha na uza bidhaa zako.', icon: ShoppingBag, link: '/marketplace', category: 'business', color: 'from-amber-600 to-emerald-600' },
  { key: 'ads', name: 'Ad Campaigns', desc: 'Endesha matangazo yaliyolengwa.', icon: Megaphone, link: '/ads', category: 'business', color: 'from-amber-500 to-rose-500' },
  { key: 'wallet', name: 'Wallet', desc: 'Salio, coins na muamala wa kampuni.', icon: Wallet, link: '/wallet', category: 'business', color: 'from-amber-500 to-emerald-500' },
  { key: 'payments', name: 'Payments', desc: 'Pokea na kutuma malipo.', icon: CreditCard, link: '/payments', category: 'business', color: 'from-blue-600 to-cyan-600' },
  { key: 'payouts', name: 'Payouts', desc: 'Toa mapato na ufuatilie malipo.', icon: Banknote, link: '/payouts', category: 'business', color: 'from-emerald-600 to-teal-600' },
  { key: 'customers', name: 'Customers', desc: 'Dhibiti wateja na mawasiliano.', icon: UserRound, link: '/people', category: 'business', color: 'from-orange-600 to-red-600' },
  { key: 'inbox', name: 'Inbox', desc: 'Majibu ya wateja na ujumbe wa timu.', icon: MessageCircle, link: '/messages', category: 'business', color: 'from-emerald-500 to-cyan-500' },
  { key: 'news', name: 'News & Updates', desc: 'Tangaza habari na matoleo mapya.', icon: Newspaper, link: '/news', category: 'business', color: 'from-cyan-600 to-emerald-500' },

  // ── Development ───────────────────────────────────────────────────────────
  { key: 'developer-tools', name: 'Developer Tools', desc: 'API, webhooks na mazingira ya kujenga.', icon: Code2, link: '/developer-tools', category: 'development', color: 'from-slate-600 to-slate-800' },
  { key: 'appstore', name: 'AppStore', desc: 'Sambaza na kusimamia apps zako.', icon: Package, link: '/appstore', category: 'development', color: 'from-cyan-600 to-primary' },
  { key: 'creator-tools-hub', name: 'Creator Tools Hub', desc: 'Kituo kimoja cha zana zote za mbunifu.', icon: Aperture, link: '/creator-tools', category: 'development', color: 'from-violet-600 to-primary' },
  { key: 'business-tools-hub', name: 'Business Tools Hub', desc: 'Kituo kimoja cha zana za biashara.', icon: ShoppingBag, link: '/business-tools', category: 'development', color: 'from-blue-600 to-cyan-600' },
  { key: 'dev-communities', name: 'Developer Communities', desc: 'Jamii za wasanidi na michango ya kanuni.', icon: Users, link: '/communities', category: 'development', color: 'from-pink-600 to-violet-600' },
  { key: 'blog', name: 'Engineering Blog', desc: 'Andika nyaraka na matangazo ya kiufundi.', icon: BookOpen, link: '/blog', category: 'development', color: 'from-cyan-600 to-emerald-600' },

  // ── Enterprise ────────────────────────────────────────────────────────────
  { key: 'admin', name: 'Admin Console', desc: 'Usimamizi wa shirika na udhibiti.', icon: Shield, link: '/admin', category: 'enterprise', color: 'from-rose-600 to-amber-600' },
  { key: 'team', name: 'Team Directory', desc: 'Wanachama, majukumu na ruhusa.', icon: Users, link: '/people', category: 'enterprise', color: 'from-purple-600 to-pink-600' },
  { key: 'ads-manager', name: 'Ads Manager', desc: 'Bajeti, CPM na ufikiaji wa matangazo.', icon: Megaphone, link: '/ads', category: 'enterprise', color: 'from-amber-600 to-orange-600' },
  { key: 'enterprise-analytics', name: 'Enterprise Analytics', desc: 'Ripoti za mapato na utendaji.', icon: BarChart3, link: '/payouts/analytics', category: 'enterprise', color: 'from-emerald-600 to-cyan-600' },
  { key: 'treasury', name: 'Treasury Wallet', desc: 'Fedha za shirika na idhini za malipo.', icon: Landmark, link: '/wallet', category: 'enterprise', color: 'from-amber-600 to-yellow-600' },
  { key: 'workspace', name: 'Workspace Settings', desc: 'Mipangilio ya kampuni na timu.', icon: SettingsIcon, link: '/settings', category: 'enterprise', color: 'from-slate-500 to-slate-700' },
];

export const toolsForKind = (kind: CompanyKind): string[] =>
  kind === 'enterprise'
    ? COMPANY_TOOLS.map((t) => t.key)
    : COMPANY_TOOLS.filter((t) => t.category === kind).map((t) => t.key);

export const toolsByCategory = (activeKeys?: string[] | null) => {
  const active = activeKeys && activeKeys.length ? new Set(activeKeys) : null;
  return TOOL_CATEGORIES.map((cat) => ({
    ...cat,
    tools: COMPANY_TOOLS.filter((t) => t.category === cat.value && (!active || active.has(t.key))),
  })).filter((c) => c.tools.length > 0);
};

export const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'company';
