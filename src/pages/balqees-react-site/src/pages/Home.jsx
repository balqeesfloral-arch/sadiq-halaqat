import { ArrowUpRight, Flower2, Trees, Sprout, Leaf, ShieldCheck, Sparkles, RefreshCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import SectionTitle from '../components/SectionTitle';
import Ornament from '../components/Ornament';
import { copy, services, projects } from '../lib/content';

const icons = { Flower2, Trees, Sprout, Leaf };

export default function Home({ lang }) {
  const t = copy[lang];
  const ar = lang === 'ar';
  return <>
    <section className="hero shell">
      <div className="hero-copy">
        <span className="eyebrow">{t.heroEyebrow}</span>
        <h1>{t.heroTitle}</h1>
        <p>{t.heroBody}</p>
        <div className="hero-actions">
          <Link className="btn primary" to="/services">{t.explore}<ArrowUpRight size={18}/></Link>
          <a className="btn ghost" href="#contact">{t.contact}</a>
        </div>
        <div className="hero-proof">
          <span><ShieldCheck size={17}/>{ar ? 'توريد موثوق' : 'Reliable supply'}</span>
          <span><Sparkles size={17}/>{ar ? 'تنسيق راقٍ' : 'Refined styling'}</span>
          <span><RefreshCcw size={17}/>{ar ? 'عناية مستمرة' : 'Ongoing care'}</span>
        </div>
      </div>
      <div className="hero-art" aria-hidden="true">
        <div className="arch-frame">
          <div className="botanical-scene">
            <span className="stem s1"/><span className="stem s2"/><span className="stem s3"/>
            <span className="leaf l1"/><span className="leaf l2"/><span className="leaf l3"/><span className="leaf l4"/><span className="leaf l5"/>
            <span className="bloom b1"/><span className="bloom b2"/><span className="bloom b3"/>
            <div className="vase"/>
          </div>
          <Ornament className="hero-ornament" />
        </div>
        <div className="hero-caption"><b>BALQEES</b><small>BOTANICAL HOSPITALITY</small></div>
      </div>
    </section>

    <section className="section shell">
      <SectionTitle eyebrow={ar ? 'ما نقدمه' : 'What we do'} title={t.whatWeDo} body={t.whatWeDoBody}/>
      <div className="service-grid">
        {services.map(s => { const Icon = icons[s.icon]; return (
          <article className="service-card" key={s.key}>
            <div className="service-icon"><Icon size={25}/></div>
            <span className="service-index">0{services.indexOf(s)+1}</span>
            <h3>{ar ? s.ar : s.en}</h3><p>{ar ? s.descAr : s.descEn}</p>
            <Link to="/services" className="text-link">{t.request}<ArrowUpRight size={16}/></Link>
          </article>
        )})}
      </div>
    </section>

    <section className="hospitality-band">
      <div className="shell hospitality-grid">
        <div>
          <span className="eyebrow">{ar ? 'Balqees Hospitality' : 'Balqees Hospitality'}</span>
          <h2>{t.hospitality}</h2><p>{t.hospitalityBody}</p>
        </div>
        <div className="stats-row">
          <div><b>01</b><span>{ar ? 'معاينة وفهم الموقع' : 'Site assessment'}</span></div>
          <div><b>02</b><span>{ar ? 'اختيار وتنفيذ' : 'Selection & delivery'}</span></div>
          <div><b>03</b><span>{ar ? 'متابعة وعناية' : 'Care & follow-up'}</span></div>
        </div>
      </div>
    </section>

    <section className="section shell">
      <SectionTitle eyebrow={ar ? 'منهجنا' : 'Our approach'} title={t.why}/>
      <div className="reason-grid">
        {[['01',t.reason1,t.reason1b],['02',t.reason2,t.reason2b],['03',t.reason3,t.reason3b]].map(([n,a,b]) => <div className="reason" key={n}><span>{n}</span><h3>{a}</h3><p>{b}</p></div>)}
      </div>
    </section>

    <section className="section shell">
      <SectionTitle eyebrow={ar ? 'المشاريع' : 'Selected fields'} title={t.work} body={t.workBody}/>
      <div className="project-preview">
        {projects.slice(0,4).map((p,i) => <article className={`project-tile project-${i+1}`} key={i}>
          <div className="project-visual"><Ornament/></div>
          <div><small>{ar ? p.categoryAr : p.categoryEn}</small><h3>{ar ? p.titleAr : p.titleEn}</h3></div>
        </article>)}
      </div>
      <div className="center-action"><Link className="btn ghost" to="/projects">{ar ? 'عرض جميع المجالات' : 'View all work'}</Link></div>
    </section>

    <section className="section shell story-section">
      <div className="story-art"><div className="story-arch"><Ornament/></div></div>
      <div className="story-copy"><span className="eyebrow">BALQEES FLORAL</span><h2>{t.aboutTitle}</h2><p>{t.aboutBody}</p><Link to="/about" className="text-link">{ar ? 'تعرف على بلقيس' : 'Discover Balqees'}<ArrowUpRight size={16}/></Link></div>
    </section>

    <section id="contact" className="cta shell">
      <Ornament className="cta-ornament"/>
      <div><span className="eyebrow">{ar ? 'ابدأ مشروعك' : 'Start your project'}</span><h2>{ar ? 'خلّ الطبيعة تصبح جزءاً من هوية المكان.' : 'Make nature part of the space identity.'}</h2></div>
      <a className="btn light" href="https://wa.me/966583799559" target="_blank" rel="noreferrer">{t.contact}<ArrowUpRight size={18}/></a>
    </section>
  </>;
}
