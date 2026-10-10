// Mock data for new WorldFace sections (Music, AppStore, Marketplace, News)

export type Artist = {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  cover: string;
  bio: string;
  genres: string[];
  followers: number;
  verified: boolean;
  songs: Song[];
};

export type Song = {
  id: string;
  title: string;
  duration: string;
  releaseYear: number;
  plays: number;
  likes: number;
  comments: number;
  shares: number;
  lyrics: string;
  cover: string;
};

export const FEATURED_ARTIST_ID = 'king-misori';

export const MOCK_ARTISTS: Artist[] = [
  {
    id: 'king-misori', name: 'King Misori', handle: '@kingmisori', verified: true,
    avatar: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400',
    cover: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=1200',
    bio: 'Founder of WorldFace. East African hitmaker blending Bongo Flava, Afrobeats and Gospel. Official featured artist of the platform.',
    genres: ['Bongo Flava', 'Afrobeats', 'Gospel'], followers: 2_350_000,
    songs: [
      { id: 'km1', title: 'WorldFace Anthem', duration: '3:55', releaseYear: 2026, plays: 9_800_000, likes: 312000, comments: 12400, shares: 28000,
        lyrics: 'Tuko pamoja WorldFace\nDunia moja, sauti moja\nKing Misori anaongoza...\n\nFrom Nairobi to Dar es Salaam\nKampala na Kigali\nTunaungana hapa WorldFace',
        cover: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400' },
      { id: 'km2', title: 'Misori Wave', duration: '4:12', releaseYear: 2026, plays: 5_400_000, likes: 198000, comments: 7800, shares: 15200,
        lyrics: 'Misori wave, Misori wave\nKila mtu anacheza\nTunalipua dunia nzima...', cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400' },
      { id: 'km3', title: 'Asante Mungu', duration: '4:48', releaseYear: 2025, plays: 7_200_000, likes: 254000, comments: 9100, shares: 21000,
        lyrics: 'Asante Mungu kwa kila kitu\nUmenipa nguvu, umenipa upendo\nKwa rehema zako nimefika hapa...', cover: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400' },
      { id: 'km4', title: 'Bongo Kings', duration: '3:32', releaseYear: 2025, plays: 4_100_000, likes: 142000, comments: 5600, shares: 11800,
        lyrics: 'We are the Bongo Kings\nFrom the heart of Africa\nMusic in our veins...', cover: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400' },
    ],
  },
  {
    id: 'a1', name: 'Diamond Platnumz', handle: '@diamond', verified: true,
    avatar: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400',
    cover: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200',
    bio: 'Tanzanian Bongo Flava sensation. CEO of WCB Wasafi.',
    genres: ['Bongo Flava', 'Afrobeats'], followers: 12_400_000,
    songs: [
      { id: 's1', title: 'Jeje', duration: '3:42', releaseYear: 2024, plays: 8_200_000, likes: 124000, comments: 4200, shares: 9800,
        lyrics: 'Jeje mpenzi wangu\nNakupenda sana\nMoyo wangu wote ni wako tu...', cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400' },
      { id: 's2', title: 'Komasava', duration: '4:01', releaseYear: 2023, plays: 15_300_000, likes: 230000, comments: 8100, shares: 18000,
        lyrics: 'Komasava komasava\nLove me baby...', cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400' },
    ],
  },
  {
    id: 'a2', name: 'Harmonize', handle: '@harmonize', verified: true,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
    cover: 'https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=1200',
    bio: 'Konde Boy. Founder of Konde Music Worldwide.', genres: ['Bongo Flava'],
    followers: 6_800_000,
    songs: [
      { id: 's3', title: 'Single Again', duration: '3:25', releaseYear: 2024, plays: 4_500_000, likes: 89000, comments: 2100, shares: 5400,
        lyrics: 'I am single again\nFree like the wind...', cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400' },
    ],
  },
  {
    id: 'a3', name: 'Zuchu', handle: '@zuchu', verified: true,
    avatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400',
    cover: 'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=1200',
    bio: 'Bongo Flava queen. WCB Wasafi.', genres: ['Bongo Flava', 'R&B'],
    followers: 4_200_000,
    songs: [
      { id: 's4', title: 'Sukari', duration: '3:18', releaseYear: 2024, plays: 6_700_000, likes: 142000, comments: 3800, shares: 9100,
        lyrics: 'Sukari yangu tamu...', cover: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400' },
    ],
  },
];

export type AppItem = {
  id: string;
  name: string;
  developer: string;
  icon: string;
  category: string;
  rating: number;
  reviews: number;
  downloads: number;
  size: string;
  version: string;
  description: string;
  screenshots: string[];
  versionHistory: { version: string; date: string; notes: string }[];
  reviewsList: { user: string; rating: number; text: string; date: string }[];
};

export const MOCK_APPS: AppItem[] = [
  {
    id: 'app1', name: 'NexaPay Mobile', developer: 'NexaFace Inc.',
    icon: 'https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?w=200',
    category: 'Finance', rating: 4.8, reviews: 12400, downloads: 850000, size: '24 MB', version: '2.4.1',
    description: 'Send money, pay bills, and manage your NexaPay wallet from anywhere.',
    screenshots: [
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600',
      'https://images.unsplash.com/photo-1556742044-3c52d6e88c62?w=600',
    ],
    versionHistory: [
      { version: '2.4.1', date: '2026-05-20', notes: 'Bug fixes and performance improvements' },
      { version: '2.4.0', date: '2026-04-12', notes: 'New dark mode, faster transfers' },
    ],
    reviewsList: [
      { user: 'Jane M.', rating: 5, text: 'Super fast and easy to use!', date: '2 days ago' },
      { user: 'Peter K.', rating: 4, text: 'Great app, needs more languages.', date: '1 week ago' },
    ],
  },
  {
    id: 'app2', name: 'WorldFace Studio', developer: 'WorldFace Labs',
    icon: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=200',
    category: 'Creativity', rating: 4.6, reviews: 5200, downloads: 230000, size: '78 MB', version: '1.8.0',
    description: 'Professional reel editor with AI-powered effects.',
    screenshots: ['https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=600'],
    versionHistory: [{ version: '1.8.0', date: '2026-06-01', notes: 'AI background removal' }],
    reviewsList: [{ user: 'Sara N.', rating: 5, text: 'Best editor I have used.', date: '3 days ago' }],
  },
  {
    id: 'app3', name: 'NexaStore', developer: 'NexaFace Inc.',
    icon: 'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=200',
    category: 'Shopping', rating: 4.4, reviews: 8900, downloads: 540000, size: '42 MB', version: '3.1.2',
    description: 'Shop electronics, fashion and more, pay with NexaPay.',
    screenshots: ['https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600'],
    versionHistory: [{ version: '3.1.2', date: '2026-05-28', notes: 'Faster checkout' }],
    reviewsList: [{ user: 'Mike T.', rating: 4, text: 'Wide selection, good prices.', date: '5 days ago' }],
  },
];

export type Listing = {
  id: string;
  title: string;
  price: number;
  currency: 'KES' | 'USD' | 'TZS';
  category: 'Electronics' | 'Fashion' | 'Services' | 'Vehicles' | 'Home';
  location: string;
  description: string;
  images: string[];
  seller: { name: string; avatar: string; rating: number; userId: string };
  postedAt: string;
};

export const MOCK_LISTINGS: Listing[] = [
  {
    id: 'l1', title: 'iPhone 15 Pro Max - 256GB', price: 165000, currency: 'KES', category: 'Electronics',
    location: 'Nairobi, Kenya', description: 'Brand new, sealed box. 1 year warranty.',
    images: ['https://images.unsplash.com/photo-1592286927505-1def25115558?w=800'],
    seller: { name: 'TechHub KE', avatar: 'https://i.pravatar.cc/100?img=12', rating: 4.9, userId: 'u1' },
    postedAt: '2 hours ago',
  },
  {
    id: 'l2', title: 'Designer Ankara Dress', price: 4500, currency: 'KES', category: 'Fashion',
    location: 'Mombasa, Kenya', description: 'Custom tailored, all sizes available.',
    images: ['https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800'],
    seller: { name: 'Amina Styles', avatar: 'https://i.pravatar.cc/100?img=45', rating: 4.7, userId: 'u2' },
    postedAt: '1 day ago',
  },
  {
    id: 'l3', title: 'Professional Web Design Service', price: 25000, currency: 'KES', category: 'Services',
    location: 'Remote', description: 'Modern responsive websites delivered in 7 days.',
    images: ['https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=800'],
    seller: { name: 'Pixel Crafters', avatar: 'https://i.pravatar.cc/100?img=33', rating: 5.0, userId: 'u3' },
    postedAt: '3 days ago',
  },
  {
    id: 'l4', title: 'Toyota Premio 2018', price: 1850000, currency: 'KES', category: 'Vehicles',
    location: 'Dar es Salaam, TZ', description: 'Low mileage, well maintained, KCB hire purchase OK.',
    images: ['https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800'],
    seller: { name: 'Auto Bazaar', avatar: 'https://i.pravatar.cc/100?img=22', rating: 4.6, userId: 'u4' },
    postedAt: '5 days ago',
  },
];

export type Article = {
  id: string;
  title: string;
  excerpt: string;
  body: string;
  category: 'Music' | 'Business' | 'Technology' | 'Lifestyle' | 'Sports';
  cover: string;
  author: { name: string; avatar: string };
  publishedAt: string;
  readMinutes: number;
};

export const MOCK_ARTICLES: Article[] = [
  {
    id: 'n1', title: 'Diamond Platnumz Drops New Album "Mtoto wa Mama"',
    excerpt: 'The Bongo Flava star surprises fans with a 15-track album featuring continental collaborations.',
    body: 'Diamond Platnumz has officially released his highly anticipated album...\n\nThe project includes collaborations with Tems, Davido, and Burna Boy. Early streaming numbers indicate this could be his biggest release yet.\n\nFans have flooded social media praising the production quality and lyrical depth.',
    category: 'Music',
    cover: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200',
    author: { name: 'Sarah Editor', avatar: 'https://i.pravatar.cc/100?img=5' },
    publishedAt: '2 hours ago', readMinutes: 4,
  },
  {
    id: 'n2', title: 'NexaPay Hits 1 Million Users in East Africa',
    excerpt: 'WorldFace\'s in-app wallet has officially crossed the 1M user milestone, with Kenya leading.',
    body: 'NexaPay, the integrated wallet feature inside WorldFace, has reached 1 million active users...\n\nKenya accounts for 42% of users, followed by Tanzania (28%) and Uganda (18%). The platform processed over $50M in transactions last quarter.',
    category: 'Business',
    cover: 'https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?w=1200',
    author: { name: 'James Tech', avatar: 'https://i.pravatar.cc/100?img=8' },
    publishedAt: '1 day ago', readMinutes: 3,
  },
  {
    id: 'n3', title: 'AI in 2026: How NexaAI is Changing African Content Creation',
    excerpt: 'A deep dive into how creators are using NexaAI to generate captions, hashtags and post ideas.',
    body: 'Artificial Intelligence has become inseparable from modern social media...\n\nNexaAI, WorldFace\'s built-in assistant, now powers over 60% of creator posts on the platform — from hashtag suggestions to full caption generation.',
    category: 'Technology',
    cover: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200',
    author: { name: 'Aisha Writer', avatar: 'https://i.pravatar.cc/100?img=15' },
    publishedAt: '3 days ago', readMinutes: 6,
  },
  {
    id: 'n4', title: 'Top 5 Side Hustles to Start on WorldFace Marketplace',
    excerpt: 'From digital services to thrift fashion — the trending categories making money on Marketplace.',
    body: 'WorldFace Marketplace has opened new income streams for entrepreneurs...\n\n1. Digital design services\n2. Thrift fashion\n3. Phone accessories\n4. Mobile car wash booking\n5. Tutoring',
    category: 'Business',
    cover: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200',
    author: { name: 'Brian Money', avatar: 'https://i.pravatar.cc/100?img=11' },
    publishedAt: '1 week ago', readMinutes: 5,
  },
  {
    id: 'n5', title: 'Manchester United Eye Star African Striker',
    excerpt: 'Reports link the Premier League giants with a $40M bid for the breakout TPL forward.',
    body: 'Manchester United are reportedly weighing a January bid...',
    category: 'Sports',
    cover: 'https://images.unsplash.com/photo-1551958219-acbc608c6377?w=1200',
    author: { name: 'Kevin Sports', avatar: 'https://i.pravatar.cc/100?img=18' },
    publishedAt: '2 weeks ago', readMinutes: 3,
  },
];

export const NEWS_CATEGORIES = ['All', 'Music', 'Business', 'Technology', 'Lifestyle', 'Sports'] as const;

export const formatNumber = (n: number) => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toString();
};
