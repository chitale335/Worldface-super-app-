export type FeatureStatus = "live" | "demo" | "development" | "planned";

export interface ToolItem {
  label: string;
  route?: string;
  status: FeatureStatus;
}

export interface ToolSection {
  id: string;
  emoji: string;
  title: string;
  group: "profile" | "pages" | "tools" | "settings";
  items: ToolItem[];
}

const L = (label: string, route: string): ToolItem => ({ label, route, status: "live" });
const D = (label: string, route?: string): ToolItem => ({ label, route, status: "demo" });
const P = (label: string): ToolItem => ({ label, status: "planned" });

export const STATUS_META: Record<FeatureStatus, { label: string; dot: string }> = {
  live: { label: "LIVE", dot: "bg-emerald" },
  demo: { label: "DEMO", dot: "bg-muted-foreground" },
  development: { label: "DEVELOPMENT", dot: "bg-amber" },
  planned: { label: "PLANNED", dot: "bg-violet" },
};

export const SUPER_TOOLS: ToolSection[] = [
  { id: "profile", emoji: "👤", title: "My Profile", group: "profile", items: [
    L("Personal Profile", "/profile"), L("Profile ID", "/me"), L("Username", "/me"), L("Profile Code", "/me"),
    L("Profile QR", "/me"), L("Followers / Following", "/people"), L("Posts", "/profile"), L("Reels / Videos", "/"),
    P("Reviews & Ratings"), L("Badges / Verification", "/rewards"), L("Referral", "/me"), L("Earnings", "/payouts"),
    L("Analytics", "/payouts/analytics"),
  ]},
  { id: "creator-page", emoji: "🎥", title: "Creator Page", group: "pages", items: [
    L("Content", "/profile"), L("Reels", "/studio"), L("Live", "/live"), P("Subscribers"), P("Memberships"),
    L("Creator Analytics", "/payouts/analytics"), P("Sponsorships"), L("Ads / Promotions", "/ads"), L("Creator Earnings", "/payouts"),
  ]},
  { id: "business-page", emoji: "🏪", title: "Business Page", group: "pages", items: [
    D("Products", "/marketplace"), P("Services"), P("Orders"), P("Customers"), P("Leads"), P("Offers"),
    P("Reviews"), P("Business Analytics"), P("Business Earnings"),
  ]},
  { id: "developer-page", emoji: "💻", title: "Developer Page", group: "pages", items: [
    D("Apps", "/appstore"), P("Projects"), P("APIs"), P("SDKs"), P("Documentation"), P("Developer Tools"), P("API Usage"), P("Developer Earnings"),
  ]},
  { id: "company-page", emoji: "🏢", title: "Company Page", group: "pages", items: [
    P("About"), P("Products"), P("Services"), P("Team"), P("Locations"), P("Jobs"), L("News", "/news"), P("Reviews"), P("Company Analytics"),
  ]},
  { id: "enterprise-page", emoji: "🏭", title: "Enterprise Page", group: "pages", items: [
    P("Organization"), P("Departments"), P("Employees"), P("Locations"), P("Teams"), P("Admins"), P("Roles"),
    P("Permissions"), P("Enterprise Analytics"), P("APIs / Integrations"), P("Enterprise Billing"),
  ]},
  { id: "ai", emoji: "🤖", title: "AI Tools", group: "tools", items: [
    L("K-AGI", "/ai"), L("AI Assistant", "/assistant"), L("AI Writer", "/founder"), L("AI Image", "/studio"), P("AI Video"),
    P("AI Reel Creator"), P("AI Design"), L("AI Translation", "/ai"), L("AI Research", "/ai"), P("AI Automation"),
  ]},
  { id: "creator-tools", emoji: "🎬", title: "Creator Tools", group: "tools", items: [
    L("Reel Creator", "/studio"), L("Video Editor", "/studio"), L("Photo Editor", "/studio"), L("Live Streaming", "/live"),
    L("Stories", "/profile"), L("Music", "/music"), P("Captions"), P("Thumbnails"), P("Content Scheduler"),
  ]},
  { id: "business-tools", emoji: "💼", title: "Business Tools", group: "tools", items: [
    D("Store", "/marketplace"), D("Products", "/marketplace"), P("Services"), P("Orders"), P("Invoices"),
    P("Customers"), P("Leads"), L("Promotions", "/ads"), P("Business Analytics"),
  ]},
  { id: "developer-tools", emoji: "🛠️", title: "Developer Tools", group: "tools", items: [
    P("API Manager"), P("API Keys"), P("Webhooks"), L("OAuth", "/settings"), P("SDK"), P("App Builder"),
    P("APK Builder"), P("Testing"), P("Developer Analytics"),
  ]},
  { id: "communication", emoji: "💬", title: "Communication", group: "tools", items: [
    L("Messenger", "/messages"), L("Groups", "/communities"), P("Channels"), L("Voice Calls", "/messages"),
    L("Video Calls", "/messages"), P("Meetings"), L("Inbox", "/messages"), L("Notifications", "/notifications"),
  ]},
  { id: "money", emoji: "💰", title: "Money & Earnings", group: "tools", items: [
    L("Earnings Dashboard", "/payouts/analytics"), L("Wallet", "/wallet"), L("WorldFace Coins", "/wallet"), L("Balance", "/wallet"),
    L("Transactions", "/wallet"), L("Withdraw", "/payouts"), L("Payout Methods", "/payouts"), P("Payment Links"),
    P("Invoices"), P("Subscriptions"), L("Creator Earnings", "/payouts"), P("Business Earnings"), P("Developer Earnings"),
    P("Referral Earnings"), P("Enterprise Billing"),
  ]},
  { id: "referral", emoji: "🎁", title: "Referral & Rewards", group: "tools", items: [
    L("Referral Code", "/me"), L("Referral Link", "/me"), P("Invited Users"), P("Joined Users"),
    P("Referral Earnings"), L("Rewards", "/rewards"), P("Referral Analytics"),
  ]},
  { id: "trust", emoji: "⭐", title: "Reviews & Trust", group: "tools", items: [
    P("Reviews"), P("Ratings"), P("Reputation"), L("Verification", "/settings"), L("Badges", "/rewards"), P("Trust Score"),
  ]},
  { id: "analytics", emoji: "📊", title: "Analytics", group: "tools", items: [
    L("Profile Analytics", "/profile"), P("Page Analytics"), L("Content Analytics", "/profile"), P("Visitor Analytics"),
    P("Referral Analytics"), L("Earnings Analytics", "/payouts/analytics"), L("Revenue Analytics", "/payouts/analytics"), P("Global Analytics"),
  ]},
  { id: "marketing", emoji: "📣", title: "Marketing", group: "tools", items: [
    L("Ads", "/ads"), L("Campaigns", "/ads"), P("Boost"), L("Promotions", "/ads"), L("Audience", "/ads"),
    L("Campaign Analytics", "/ads"), P("Marketing Automation"),
  ]},
  { id: "sharing", emoji: "🔗", title: "Sharing & Discovery", group: "tools", items: [
    L("Share Profile", "/me"), P("Share Page"), L("Share Post", "/"), L("Copy Link", "/me"), L("QR Code", "/me"),
    L("SEO", "/kotekule"), L("Open Graph", "/kotekule"), L("Twitter/X Cards", "/kotekule"), L("Google Metadata", "/kotekule"), P("Deep Links"),
  ]},
  { id: "integrations", emoji: "🔌", title: "Integrations", group: "tools", items: [
    L("Google", "/auth"), P("Microsoft"), P("Facebook"), P("Instagram"), P("TikTok"), P("X"), P("YouTube"),
    P("WhatsApp"), P("GitHub"), P("Websites"), P("APIs"), L("MCP", "/settings"), P("Webhooks"),
  ]},
  { id: "security", emoji: "🔐", title: "Security", group: "tools", items: [
    P("2FA"), L("Login Security", "/settings"), L("Sessions", "/settings"), L("Devices", "/settings"),
    L("Permissions", "/settings"), L("Privacy", "/settings"), L("Account Recovery", "/reset-password"), P("Security Logs"),
  ]},
  { id: "settings", emoji: "⚙️", title: "Settings", group: "settings", items: [
    L("Profile Settings", "/settings"), P("Page Settings"), L("Super Tools: Enable / Disable / Configure", "/tools"),
    L("Notifications", "/settings"), L("Privacy", "/settings"), L("Security", "/settings"), L("Payments", "/payments"),
    L("Earnings", "/payouts"), L("Payouts", "/payouts"), P("Connected Apps"), P("API / Developer"),
    P("Team & Permissions"), L("Account", "/settings"),
  ]},
];

export const GROUP_TITLES: Record<ToolSection["group"], string> = {
  profile: "My Profile",
  pages: "My Pages",
  tools: "Super Tools",
  settings: "Settings",
};

const DISABLED_KEY = "wf_disabled_tools";
export const getDisabledTools = (): string[] => {
  try { return JSON.parse(localStorage.getItem(DISABLED_KEY) ?? "[]"); } catch { return []; }
};
export const setDisabledTools = (ids: string[]) => localStorage.setItem(DISABLED_KEY, JSON.stringify(ids));
