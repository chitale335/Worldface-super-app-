import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Home, Compass, Users as UsersIcon, Globe2, MessageCircle, Wallet, Trophy, Bot,
  Music2, Package, ShoppingBag, Wand2, Megaphone, Newspaper, Aperture, Radio,
  Crown, BookOpen, Sparkles, ArrowRight, ShieldCheck, Brain, Search,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageSEO } from '@/components/seo/PageSEO';

const SITE = 'https://worldface-kotekule.lovable.app';
const SHARE_IMAGE =
  'https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/8c7b9154-aa46-45de-a0f9-c4924c5c85ca/id-preview-744fe58d--302001c2-5c64-4179-858a-40f0b92ef74d.lovable.app-1775734007059.png';

type App = { to: string; icon: typeof Home; name: string; desc: string; grad: string; group: string };

const apps: App[] = [
  { to: '/', icon: Home, name: 'WorldFace Feed', desc: 'Posts, reels na stories za dunia yote.', grad: 'from-primary to-violet', group: 'Social' },
  { to: '/explore', icon: Compass, name: 'Explore', desc: 'Gundua watu, hashtags na trending.', grad: 'from-cyan to-primary', group: 'Social' },
  { to: '/communities', icon: UsersIcon, name: 'Communities', desc: 'Vikundi vya umma, binafsi na siri.', grad: 'from-violet to-primary', group: 'Social' },
  { to: '/culturalverse', icon: Globe2, name: 'CulturalVerse', desc: 'Ramani ya tamaduni, museums na urithi.', grad: 'from-cyan to-violet', group: 'Culture' },
  { to: '/messages', icon: MessageCircle, name: 'NexaChat', desc: 'Chat, sauti na video calls za real-time.', grad: 'from-emerald to-cyan', group: 'Communication' },
  { to: '/live', icon: Radio, name: 'WorldFace Live', desc: 'Livestream na gifts kwa wakati halisi.', grad: 'from-rose to-amber', group: 'Communication' },
  { to: '/wallet', icon: Wallet, name: 'NexaPay', desc: 'Wallet, malipo na mobile money.', grad: 'from-amber to-emerald', group: 'Money' },
  { to: '/payouts', icon: ShieldCheck, name: 'Payouts', desc: 'Creators wapokee mapato kwa usalama.', grad: 'from-emerald to-primary', group: 'Money' },
  { to: '/rewards', icon: Trophy, name: 'Rewards', desc: 'Coins, ngazi na zawadi za kila siku.', grad: 'from-amber to-rose', group: 'Money' },
  { to: '/ai', icon: Bot, name: 'NexaAI', desc: 'AI Core inayoelewa app yote.', grad: 'from-violet to-cyan', group: 'AI' },
  { to: '/assistant', icon: Wand2, name: 'AI Assistant', desc: 'Sauti, tafsiri na msaada wa maandiko.', grad: 'from-violet to-primary', group: 'AI' },
  { to: '/studio', icon: Aperture, name: 'WorldFace Studio', desc: 'Video, thumbnails na media za AI.', grad: 'from-rose to-violet', group: 'Creator' },
  { to: '/music', icon: Music2, name: 'WorldFace Music', desc: 'Wasanii, nyimbo na lyrics.', grad: 'from-rose to-violet', group: 'Creator' },
  { to: '/appstore', icon: Package, name: 'AppStore', desc: 'Apps na APK za ndani ya WorldFace.', grad: 'from-cyan to-primary', group: 'Commerce' },
  { to: '/marketplace', icon: ShoppingBag, name: 'Marketplace', desc: 'Nunua na uza na chat ya muuzaji.', grad: 'from-amber to-emerald', group: 'Commerce' },
  { to: '/ads', icon: Megaphone, name: 'Ads Manager', desc: 'AI inakokotoa bajeti, CPM na reach.', grad: 'from-amber to-rose', group: 'Commerce' },
  { to: '/news', icon: Newspaper, name: 'News', desc: 'Habari na makala zilizopangwa.', grad: 'from-cyan to-emerald', group: 'Knowledge' },
  { to: '/blog', icon: BookOpen, name: 'Blog', desc: 'Mafunzo na updates za WorldFace.', grad: 'from-primary to-cyan', group: 'Knowledge' },
  { to: '/founder', icon: Crown, name: 'King Misori', desc: 'Hadithi ya mwanzilishi wa WorldFace.', grad: 'from-amber to-rose', group: 'Knowledge' },
];

const groups = ['Social', 'Communication', 'AI', 'Money', 'Creator', 'Commerce', 'Culture', 'Knowledge'];

const Kotekule = () => {
  const [q, setQ] = useState('');
  const query = q.trim().toLowerCase();
  const results = useMemo(
    () =>
      query
        ? apps.filter(
            (a) =>
              a.name.toLowerCase().includes(query) ||
              a.desc.toLowerCase().includes(query) ||
              a.group.toLowerCase().includes(query),
          )
        : [],
    [query],
  );

  useEffect(() => {
    const ld = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Organization',
          '@id': `${SITE}/#organization`,
          name: 'KOTEKULE',
          alternateName: ['WorldFace', 'NexaFace'],
          url: SITE,
          logo: `${SITE}/icons/icon-512.png`,
          description:
            'KOTEKULE is the center of the WorldFace super app: social feed, chat, calls, payments, music, marketplace, app store, ads and AI in one connected platform.',
          founder: { '@type': 'Person', name: 'Samwel Misori (King Misori)' },
        },
        {
          '@type': 'WebSite',
          '@id': `${SITE}/#website`,
          url: SITE,
          name: 'KOTEKULE — WorldFace Super App',
          publisher: { '@id': `${SITE}/#organization` },
          inLanguage: ['sw', 'en'],
          potentialAction: {
            '@type': 'SearchAction',
            target: `${SITE}/explore?q={search_term_string}`,
            'query-input': 'required name=search_term_string',
          },
        },
        {
          '@type': 'WebPage',
          '@id': `${SITE}/kotekule#webpage`,
          url: `${SITE}/kotekule`,
          name: 'KOTEKULE — WorldFace Super App Center',
          description:
            'KOTEKULE connects every WorldFace app in one center: social feed, chat and calls, NexaPay wallet, payouts, music, marketplace, app store, ads and AI.',
          isPartOf: { '@id': `${SITE}/#website` },
          about: { '@id': `${SITE}/#organization` },
          primaryImageOfPage: SHARE_IMAGE,
          inLanguage: ['sw', 'en'],
          breadcrumb: { '@id': `${SITE}/kotekule#breadcrumb` },
        },
        {
          '@type': 'BreadcrumbList',
          '@id': `${SITE}/kotekule#breadcrumb`,
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'WorldFace', item: SITE },
            { '@type': 'ListItem', position: 2, name: 'KOTEKULE', item: `${SITE}/kotekule` },
          ],
        },
        {
          '@type': 'ItemList',
          '@id': `${SITE}/kotekule#apps`,
          name: 'KOTEKULE apps',
          numberOfItems: apps.length,
          itemListOrder: 'https://schema.org/ItemListOrderAscending',
          itemListElement: apps.map((a, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            url: `${SITE}${a.to}`,
            item: {
              '@type': 'SoftwareApplication',
              '@id': `${SITE}${a.to}#app`,
              name: a.name,
              description: a.desc,
              url: `${SITE}${a.to}`,
              applicationCategory: a.group,
              applicationSuite: 'WorldFace',
              operatingSystem: 'Web, Android, iOS (PWA)',
              inLanguage: ['sw', 'en'],
              isPartOf: { '@id': `${SITE}/#website` },
              publisher: { '@id': `${SITE}/#organization` },
              offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
            },
          })),
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'What is KOTEKULE?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'KOTEKULE is the central hub of WorldFace that connects every app in one place — social feed, chat and calls, NexaPay wallet and payouts, music, marketplace, app store, ads manager and the WorldFace AI Core.',
              },
            },
            {
              '@type': 'Question',
              name: 'Does WorldFace AI need permission before acting?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Yes. WorldFace AI Core has no control until the user grants each scope (memory, feed, chat, wallet, studio, ads, care). It proposes actions and the user approves them.',
              },
            },
            {
              '@type': 'Question',
              name: 'Can WorldFace be installed as an app?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Yes. WorldFace is an installable PWA with offline support, full-screen display, splash screens and push notifications on Android, iOS and desktop.',
              },
            },
          ],
        },
      ],
    };
    const el = document.createElement('script');
    el.type = 'application/ld+json';
    el.setAttribute('data-kotekule', 'true');
    el.textContent = JSON.stringify(ld);
    document.head.appendChild(el);
    return () => el.remove();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PageSEO
        title="KOTEKULE — WorldFace Super App Center"
        description="KOTEKULE connects every WorldFace app in one center: social feed, chat and calls, NexaPay wallet, payouts, music, marketplace, app store, ads and AI."
        url={`${SITE}/kotekule`}
        image={SHARE_IMAGE}
        imageAlt="KOTEKULE — center ya apps zote za WorldFace"
      />

      {/* Hero */}
      <header className="relative overflow-hidden border-b border-border/40">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-violet/10 to-cyan/20" aria-hidden />
        <div className="container relative mx-auto px-6 py-16 md:py-24">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-xs font-medium backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-cyan" />
            NexaFace Ecosystem · One account, kila kitu
          </div>
          <h1 className="mt-5 max-w-3xl font-heading text-4xl font-bold leading-tight tracking-tight md:text-6xl">
            KOTEKULE — kitovu cha apps zote za WorldFace
          </h1>
          <p className="mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">
            Social, chat na calls, NexaPay, payouts, music, marketplace, app store, matangazo na
            WorldFace AI Core — zote zimeunganishwa sehemu moja, kwa akaunti moja.
          </p>
          {/* Super search */}
          <form
            role="search"
            aria-label="Super search WorldFace"
            className="mt-7 max-w-2xl"
            onSubmit={(e) => e.preventDefault()}
          >
            <label htmlFor="kotekule-search" className="sr-only">Tafuta ndani ya WorldFace</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="kotekule-search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Super search: apps, watu, nyimbo, bidhaa, habari…"
                className="h-12 pl-10 text-base"
              />
            </div>
            {query && (
              <div className="mt-3 rounded-xl border border-border/60 bg-card/80 p-2 backdrop-blur">
                {results.length > 0 ? (
                  <ul className="divide-y divide-border/40">
                    {results.slice(0, 6).map((a) => (
                      <li key={a.to}>
                        <Link to={a.to} className="flex items-center gap-3 rounded-lg p-3 hover:bg-muted/50">
                          <a.icon className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium">{a.name}</span>
                          <span className="truncate text-xs text-muted-foreground">{a.desc}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="p-3 text-sm text-muted-foreground">Hakuna app inayolingana.</p>
                )}
                <div className="flex flex-wrap gap-2 border-t border-border/40 p-2">
                  <Button asChild size="sm" variant="secondary">
                    <Link to={`/explore?q=${encodeURIComponent(q)}`}>Tafuta watu na posts</Link>
                  </Button>
                  <Button asChild size="sm" variant="secondary">
                    <Link to={`/marketplace?q=${encodeURIComponent(q)}`}>Bidhaa</Link>
                  </Button>
                  <Button asChild size="sm" variant="secondary">
                    <Link to={`/music?q=${encodeURIComponent(q)}`}>Nyimbo</Link>
                  </Button>
                  <Button asChild size="sm" variant="secondary">
                    <Link to={`/ai?q=${encodeURIComponent(q)}`}>Uliza AI Core</Link>
                  </Button>
                </div>
              </div>
            )}
          </form>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-gradient-to-r from-primary to-cyan text-primary-foreground border-0">
              <Link to="/">Ingia WorldFace <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/ai">Jaribu AI Core</Link>
            </Button>
          </div>


          <dl className="mt-10 grid max-w-2xl grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { k: `${apps.length}+`, v: 'Apps zilizounganishwa' },
              { k: '8', v: 'AI modules' },
              { k: '8', v: 'Currencies' },
              { k: '24/7', v: 'Premium care' },
            ].map((s) => (
              <div key={s.v} className="rounded-xl border border-border/50 bg-card/60 p-4 backdrop-blur">
                <dt className="font-heading text-2xl font-bold">{s.k}</dt>
                <dd className="text-xs text-muted-foreground">{s.v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </header>

      {/* App grid */}
      <main className="container mx-auto px-6 py-14">
        <section aria-labelledby="apps-heading">
          <h2 id="apps-heading" className="font-heading text-2xl font-bold md:text-3xl">
            Apps zote za WorldFace
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Chagua app — unaingia moja kwa moja bila kutoka kwenye WorldFace.
          </p>

          {groups.map((g) => {
            const items = apps.filter((a) => a.group === g);
            if (!items.length) return null;
            return (
              <div key={g} className="mt-10">
                <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">{g}</h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((a) => (
                    <Link key={a.to} to={a.to} className="group">
                      <Card className="h-full border-border/50 bg-card/70 p-5 transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg">
                        <div className={`mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${a.grad}`}>
                          <a.icon className="h-5 w-5 text-primary-foreground" />
                        </div>
                        <h4 className="font-heading text-base font-semibold">{a.name}</h4>
                        <p className="mt-1 text-sm text-muted-foreground">{a.desc}</p>
                        <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                          Fungua <ArrowRight className="h-3 w-3" />
                        </span>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </section>

        {/* AI + discoverability */}
        <section aria-labelledby="ai-heading" className="mt-16 grid gap-5 md:grid-cols-3">
          <h2 id="ai-heading" className="sr-only">WorldFace AI Core</h2>
          {[
            { icon: Brain, t: 'AI Core kila mahali', d: 'AI moja inaelewa Feed, Chat, NexaPay, Studio, Search, Ads na Care — inajifunza mapendeleo yako pale unaporuhusu.' },
            { icon: ShieldCheck, t: 'Hakuna control bila ruhusa', d: 'Kila scope inawashwa na wewe. AI inapendekeza, wewe unathibitisha — haitumi pesa wala haichapishi yenyewe.' },
            { icon: Search, t: 'Inagunduliwa na AI search', d: 'Structured data, llms.txt na metadata safi husaidia Google, ChatGPT, Perplexity na AI crawlers kuelewa WorldFace.' },
          ].map((c) => (
            <Card key={c.t} className="border-border/50 bg-card/70 p-6">
              <c.icon className="h-6 w-6 text-cyan" />
              <h3 className="mt-3 font-heading text-lg font-semibold">{c.t}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{c.d}</p>
            </Card>
          ))}
        </section>

        <footer className="mt-16 border-t border-border/40 pt-8 text-sm text-muted-foreground">
          <p>KOTEKULE ni kitovu cha NexaFace ecosystem — WorldFace, NexaChat, NexaPay, NexaAI.</p>
          <nav className="mt-3 flex flex-wrap gap-4">
            <Link to="/terms" className="hover:text-foreground">Terms</Link>
            <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link to="/founder" className="hover:text-foreground">Founder</Link>
            <Link to="/news" className="hover:text-foreground">News</Link>
          </nav>
        </footer>
      </main>
    </div>
  );
};

export default Kotekule;
