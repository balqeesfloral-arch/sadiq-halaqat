import { BadgeCheck, Building2, MapPin, FileText, ReceiptText, Phone, Mail, Instagram } from 'lucide-react';
import { business, copy } from '../lib/content';
import Ornament from '../components/Ornament';
export default function Certification({lang}) {
 const t=copy[lang], ar=lang==='ar';
 const rows=[
   [Building2, ar?'اسم المؤسسة':'Business name', ar?business.nameAr:business.nameEn],
   [MapPin,t.location, ar?business.locationAr:business.locationEn],
   [FileText,t.cr,business.cr],[ReceiptText,t.vat,business.vat],
   [Phone,t.phones,business.phones.join(' · ')],[Mail,t.email,business.email]
 ];
 return <section className="page-section shell cert-page">
   <div className="cert-hero"><Ornament/><BadgeCheck size={40}/><span>{ar?'مرجع رقمي رسمي':'Official digital reference'}</span><h1>{t.certTitle}</h1><p>{t.certBody}</p></div>
   <div className="cert-grid">
     {rows.map(([Icon,label,val])=><div className="cert-item" key={label}><Icon/><span>{label}</span><b>{val}</b></div>)}
   </div>
   <div className="social-strip"><Instagram/><span>{business.instagram}</span><span>{business.tiktok}</span><span>{business.facebook}</span><span>{business.snapchat}</span></div>
   <div className="digital-seal"><BadgeCheck/><div><b>{ar?'معتمد إلكترونياً':'Digitally Certified'}</b><span>{business.nameEn} · Makkah · Saudi Arabia</span></div></div>
 </section>
}
