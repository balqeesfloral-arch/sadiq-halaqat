import { NavLink, useLocation } from 'react-router-dom';
import { Home, Store, Images, Info, UserRound, Languages, BadgeCheck, MessageCircle } from 'lucide-react';
import BrandMark from './BrandMark';
import Ornament from './Ornament';
import { getSaudiSeason } from '../lib/season';
import { business, copy } from '../lib/content';

const nav = [
  ['/', Home, 'home'],
  ['/services', Store, 'services'],
  ['/projects', Images, 'projects'],
  ['/about', Info, 'about'],
  ['/account', UserRound, 'account']
];

export default function Layout({ lang, setLang, children }) {
  const location = useLocation();
  const t = copy[lang];
  const season = getSaudiSeason();
  const isAr = lang === 'ar';

  return (
    <div className={`app season-${season.key}`} dir={isAr ? 'rtl' : 'ltr'}>
      <div className="site-noise" />
      <Ornament className="ambient-ornament ambient-one" />
      <Ornament className="ambient-ornament ambient-two" />

      <header className="topbar shell">
        <NavLink to="/" className="brand-link"><BrandMark /></NavLink>
        <div className="top-actions">
          {season.key !== 'default' && <div className="season-chip"><span className="season-dot" />{isAr ? season.ar : season.en}</div>}
          <button className="icon-button" onClick={() => setLang(isAr ? 'en' : 'ar')} aria-label="Switch language">
            <Languages size={18}/><span>{isAr ? 'EN' : 'AR'}</span>
          </button>
        </div>
      </header>

      <main key={location.pathname} className="page-enter">{children}</main>

      <div className="floating-stack">
        <NavLink to="/certification" className="floating-action certification-fab" aria-label={t.certified}><BadgeCheck size={20}/><span>{t.certified}</span></NavLink>
        <a className="floating-action whatsapp-fab" href={`https://wa.me/966${business.whatsapp.slice(1)}`} target="_blank" rel="noreferrer" aria-label="WhatsApp"><MessageCircle size={22}/><span>WhatsApp</span></a>
      </div>

      <nav className="bottom-nav" aria-label="Primary navigation">
        <div className="bottom-nav-glass">
          {nav.map(([href, Icon, key]) => (
            <NavLink key={href} to={href} end={href === '/'} className={({isActive}) => `bottom-link ${isActive ? 'active' : ''}`}>
              <span className="bottom-icon"><Icon size={20}/></span><small>{t[key]}</small>
            </NavLink>
          ))}
        </div>
      </nav>

      <footer className="footer shell">
        <div className="footer-brand"><BrandMark/><p>{t.footerTag}</p></div>
        <div className="footer-meta"><span>{business.locationAr}</span><span>{business.phones.join(' · ')}</span><span>{business.email}</span></div>
        <div className="footer-copy">© {new Date().getFullYear()} {business.nameEn}</div>
      </footer>
    </div>
  );
}
