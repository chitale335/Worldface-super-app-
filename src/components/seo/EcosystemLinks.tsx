import { Link } from 'react-router-dom';

const links = [
  { to: '/kotekule', label: 'KOTEKULE — kitovu cha apps zote za WorldFace' },
  { to: '/', label: 'WorldFace Feed — posts, reels na stories' },
  { to: '/explore', label: 'Explore WorldFace — watu, hashtags na trending' },
  { to: '/communities', label: 'WorldFace Communities — vikundi vya umma na binafsi' },
  { to: '/culturalverse', label: 'WorldFace CulturalVerse — ramani ya tamaduni na museums' },
  { to: '/messages', label: 'NexaChat — chat, sauti na video calls' },
  { to: '/live', label: 'WorldFace Live — livestream na gifts' },
  { to: '/wallet', label: 'NexaPay Wallet — malipo na mobile money' },
  { to: '/payouts', label: 'WorldFace Payouts — creators wapokee mapato' },
  { to: '/rewards', label: 'WorldFace Rewards — coins na zawadi' },
  { to: '/ai', label: 'NexaAI Core — AI ya WorldFace' },
  { to: '/assistant', label: 'WorldFace AI Assistant — sauti na tafsiri' },
  { to: '/studio', label: 'WorldFace Studio — video na media za AI' },
  { to: '/music', label: 'WorldFace Music — wasanii, nyimbo na lyrics' },
  { to: '/appstore', label: 'WorldFace AppStore — apps na APK' },
  { to: '/marketplace', label: 'WorldFace Marketplace — nunua na uza' },
  { to: '/ads', label: 'WorldFace Ads Manager — matangazo ya ndani ya app' },
  { to: '/news', label: 'WorldFace News — habari na makala' },
  { to: '/blog', label: 'WorldFace Blog — mafunzo na updates' },
  { to: '/founder', label: 'King Misori — mwanzilishi wa WorldFace' },
];

/**
 * Sitewide internal-link block with descriptive anchor text so crawlers and AI
 * agents can reach every WorldFace route from any page, always via /kotekule.
 */
export const EcosystemLinks = () => (
  <nav aria-label="WorldFace ecosystem" className="border-t border-border/40 px-4 py-6 text-xs text-muted-foreground">
    <h2 className="mb-3 font-heading text-sm font-semibold text-foreground">
      <Link to="/kotekule" className="hover:text-primary">KOTEKULE — center ya apps zote za WorldFace</Link>
    </h2>
    <ul className="flex flex-wrap gap-x-4 gap-y-2">
      {links.map((l) => (
        <li key={l.to}>
          <Link to={l.to} title={l.label} className="hover:text-foreground">
            {l.label}
          </Link>
        </li>
      ))}
    </ul>
  </nav>
);
