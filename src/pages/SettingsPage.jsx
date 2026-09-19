import { useEffect, useMemo, useState } from "react";
import {
  Settings, SlidersHorizontal, Palette, Tv, Quote, ShieldCheck, Info,
  Check, RotateCcw, Type, LayoutGrid, Sparkles, MonitorCog, Save,
  ChevronLeft, UserCog
} from "lucide-react";

import GeneralSettings from "../components/settings/GeneralSettings";
import TVSettings from "../components/settings/TVSettings";
import QuoteManager from "../components/settings/QuoteManager";
import SecuritySettings from "../components/settings/SecuritySettings";
import AboutSystem from "../components/settings/AboutSystem";
import "./SettingsPage.css";
import { applyAppAppearance, readAppAppearance, saveAppAppearance } from "../lib/appearance";

const TABS = [
  { key: "general", label: "الحساب والإدارة", desc: "بيانات حساب مدير النظام الظاهرة فعليًا داخل الواجهة", icon: UserCog },
  { key: "appearance", label: "المظهر والتجربة", desc: "لون الواجهة وحجم الخط وكثافة العرض على هذا الجهاز", icon: Palette },
  { key: "tv", label: "شاشة العرض", desc: "مدة الصفحات وعدد الطلاب ومنصة التتويج والعبارات", icon: Tv },
  { key: "quotes", label: "العبارات التحفيزية", desc: "إدارة العبارات المستخدمة فعليًا في شاشة العرض", icon: Quote },
  { key: "security", label: "الحساب والأمان", desc: "بيانات تسجيل الدخول وتغيير كلمة المرور", icon: ShieldCheck },
  { key: "about", label: "معلومات النظام", desc: "إحصاءات حقيقية وحالة الاتصال بقاعدة البيانات", icon: Info },
];

const THEMES = [
  { id: "sadiq", name: "أخضر الصِّدّيق", color: "#0B5D4B" },
  { id: "olive", name: "الزيتوني", color: "#596B37" },
  { id: "emerald", name: "الزمردي", color: "#087F5B" },
  { id: "navy", name: "الكحلي", color: "#27445D" },
  { id: "burgundy", name: "العنابي", color: "#713B46" },
  { id: "gold", name: "الذهبي المعتّق", color: "#9A7425" },
];
const FONT_SIZES = [
  { id: "compact", label: "صغير", value: 14 },
  { id: "normal", label: "متوسط", value: 16 },
  { id: "large", label: "كبير", value: 18 },
];
const DENSITIES = [
  { id: "compact", label: "مضغوط", scale: .92 },
  { id: "comfortable", label: "مريح", scale: 1 },
  { id: "spacious", label: "واسع", scale: 1.06 },
];
const DEFAULT_APPEARANCE = {
  theme: "sadiq", customColor: "#0B5D4B", fontSize: "normal",
  density: "comfortable", rounded: true, subtleOrnaments: true,
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general");
  const [appearance, setAppearance] = useState(readAppAppearance);
  const [savedAppearance, setSavedAppearance] = useState(readAppAppearance);
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => { applyAppAppearance(appearance); }, [appearance]);
  useEffect(() => () => { applyAppAppearance(savedAppearance); }, [savedAppearance]);
  const activeMeta = useMemo(() => TABS.find((x) => x.key === activeTab) || TABS[0], [activeTab]);
  const dirty = JSON.stringify(appearance) !== JSON.stringify(savedAppearance);

  function saveAppearance() {
    saveAppAppearance(appearance);
    setSavedAppearance(appearance);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1600);
  }

  function renderContent() {
    if (activeTab === "general") return <GeneralSettings />;
    if (activeTab === "tv") return <TVSettings />;
    if (activeTab === "quotes") return <QuoteManager />;
    if (activeTab === "security") return <SecuritySettings />;
    if (activeTab === "about") return <AboutSystem />;
    return <AppearanceSettings value={appearance} onChange={setAppearance}
      onSave={saveAppearance} onReset={() => setAppearance(DEFAULT_APPEARANCE)}
      dirty={dirty} savedFlash={savedFlash} />;
  }

  return (
    <div className="settings-page-pro" dir="rtl">
      <IslamicBackdrop />
      <header className="settings-hero-pro">
        <div className="settings-hero-copy">
          <span className="settings-eyebrow"><Settings size={14}/> مركز إدارة النظام</span>
          <div className="settings-hero-title">
            <span className="settings-hero-icon"><MonitorCog size={24}/></span>
            <div>
              <h1>الإعدادات</h1>
              <p>إعدادات فعلية مرتبطة بالحساب والواجهة وشاشة العرض وبيانات النظام.</p>
            </div>
          </div>
        </div>
        <div className="settings-hero-seal" aria-hidden="true"><IslamicSeal /></div>
      </header>

      <div className="settings-layout-pro">
        <aside className="settings-nav-pro">
          <div className="settings-nav-head">
            <div><span>مركز التحكم</span><small>{TABS.length} أقسام</small></div>
            <Sparkles size={16}/>
          </div>
          <nav>
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return <button key={tab.key} type="button"
                className={`settings-nav-item ${activeTab === tab.key ? "active" : ""}`}
                onClick={() => setActiveTab(tab.key)}>
                <span className="settings-nav-icon"><Icon size={17}/></span>
                <span className="settings-nav-text"><strong>{tab.label}</strong><small>{tab.desc}</small></span>
                <ChevronLeft size={15} className="settings-nav-arrow"/>
              </button>;
            })}
          </nav>
          <div className="settings-nav-foot">
            <ShieldCheck size={16}/>
            <div><strong>إعدادات حقيقية</strong><small>لا توجد إعدادات نقاط أو مكافآت في هذه الصفحة.</small></div>
          </div>
        </aside>

        <main className="settings-workspace">
          <div className="settings-workspace-head">
            <span className="settings-workspace-icon"><activeMeta.icon size={19}/></span>
            <div><span>إعدادات النظام</span><h2>{activeMeta.label}</h2><p>{activeMeta.desc}</p></div>
          </div>
          <div className="settings-component-surface">{renderContent()}</div>
        </main>
      </div>
    </div>
  );
}

function AppearanceSettings({ value, onChange, onSave, onReset, dirty, savedFlash }) {
  const set = (patch) => onChange({ ...value, ...patch });
  return <div className="appearance-settings">
    <section className="settings-panel-intro">
      <span className="settings-panel-intro__icon"><Palette size={21}/></span>
      <div><small>الهوية البصرية</small><h3>المظهر وتجربة الاستخدام</h3>
        <p>هذه الخيارات تغيّر واجهة النظام على هذا الجهاز مباشرة، وليست حقولًا شكلية.</p></div>
      <span className="real-badge">فعّال</span>
    </section>

    <section className="setting-pro-section">
      <div className="setting-pro-heading"><div><Palette size={17}/><span><strong>لون النظام</strong><small>يُطبّق على متغير اللون الرئيسي للواجهة</small></span></div></div>
      <div className="theme-swatches">
        {THEMES.map((theme) => <button type="button" key={theme.id}
          className={`theme-swatch ${value.theme === theme.id ? "selected" : ""}`}
          onClick={() => set({ theme: theme.id })}>
          <i style={{background:theme.color}}/><span><strong>{theme.name}</strong><small>{theme.color}</small></span>
          {value.theme === theme.id && <Check size={15}/>}
        </button>)}
        <label className={`theme-swatch ${value.theme === "custom" ? "selected" : ""}`}>
          <input type="color" value={value.customColor}
            onChange={(e)=>set({theme:"custom",customColor:e.target.value})}/>
          <span><strong>لون مخصص</strong><small>{value.customColor}</small></span>
          {value.theme === "custom" && <Check size={15}/>}
        </label>
      </div>
    </section>

    <div className="appearance-two-col">
      <section className="setting-pro-section">
        <div className="setting-pro-heading"><div><Type size={17}/><span><strong>حجم الخط</strong><small>حجم النص الأساسي للنظام</small></span></div></div>
        <div className="segmented-setting">
          {FONT_SIZES.map(x=><button type="button" key={x.id} className={value.fontSize===x.id?"active":""} onClick={()=>set({fontSize:x.id})}><span>{x.label}</span><small>{x.value}px</small></button>)}
        </div>
      </section>
      <section className="setting-pro-section">
        <div className="setting-pro-heading"><div><LayoutGrid size={17}/><span><strong>كثافة الواجهة</strong><small>المسافات بين عناصر الواجهة</small></span></div></div>
        <div className="segmented-setting">
          {DENSITIES.map(x=><button type="button" key={x.id} className={value.density===x.id?"active":""} onClick={()=>set({density:x.id})}><span>{x.label}</span><small>{Math.round(x.scale*100)}%</small></button>)}
        </div>
      </section>
    </div>

    <div className="settings-actions-pro">
      <button type="button" className="btn-secondary" onClick={onReset}><RotateCcw size={15}/> استعادة الافتراضي</button>
      <button type="button" className="btn-primary" disabled={!dirty} onClick={onSave}><Save size={15}/>{savedFlash?"تم الحفظ":"حفظ المظهر"}</button>
    </div>
  </div>;
}

function IslamicBackdrop(){
  return <svg className="settings-islamic-bg" viewBox="0 0 600 600" aria-hidden="true">
    <defs><pattern id="sadiqGeo" width="72" height="72" patternUnits="userSpaceOnUse">
      <path d="M36 3 46 26 69 36 46 46 36 69 26 46 3 36 26 26Z" fill="none" stroke="currentColor" strokeWidth="1"/>
      <circle cx="36" cy="36" r="13" fill="none" stroke="currentColor" strokeWidth=".7"/>
    </pattern></defs><rect width="600" height="600" fill="url(#sadiqGeo)"/>
  </svg>;
}
function IslamicSeal(){
  return <svg viewBox="0 0 100 100"><path d="M50 4 61 27 86 14 73 39 96 50 73 61 86 86 61 73 50 96 39 73 14 86 27 61 4 50 27 39 14 14 39 27Z" fill="none" stroke="currentColor" strokeWidth="2"/><circle cx="50" cy="50" r="25" fill="none" stroke="currentColor"/><circle cx="50" cy="50" r="4" fill="currentColor"/></svg>;
}
