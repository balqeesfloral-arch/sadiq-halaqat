import { useEffect, useMemo, useState } from "react";
import {
  Settings, SlidersHorizontal, Palette, Coins, Tv, Quote,
  ShieldCheck, Info, Check, RotateCcw, Type, LayoutGrid,
  Sparkles, MonitorCog, Save, SunMedium, MoonStar, Gauge,
  ChevronLeft
} from "lucide-react";

import GeneralSettings from "../components/settings/GeneralSettings";
import PointsSettings from "../components/settings/PointsSettings";
import TVSettings from "../components/settings/TVSettings";
import QuoteManager from "../components/settings/QuoteManager";
import SecuritySettings from "../components/settings/SecuritySettings";
import AboutSystem from "../components/settings/AboutSystem";

import "./SettingsPage.css";

const TABS = [
  { key: "general", label: "الإعدادات العامة", desc: "هوية النظام والبيانات الأساسية", icon: SlidersHorizontal },
  { key: "appearance", label: "المظهر والتجربة", desc: "اللون والخط وكثافة الواجهة", icon: Palette },
  { key: "points", label: "النقاط والمكافآت", desc: "قواعد التحفيز واحتساب النقاط", icon: Coins },
  { key: "tv", label: "العرض على التلفزيون", desc: "خيارات شاشة العرض ولوحة الشرف", icon: Tv },
  { key: "quotes", label: "الكلمات التحفيزية", desc: "إدارة العبارات المعروضة", icon: Quote },
  { key: "security", label: "الأمان", desc: "خيارات الحماية والوصول", icon: ShieldCheck },
  { key: "about", label: "حول النظام", desc: "معلومات وإحصاءات النظام", icon: Info },
];

const THEMES = [
  { id: "sadiq", name: "أخضر الصِّدّيق", color: "#0B5D4B", soft: "#EAF4F0" },
  { id: "olive", name: "الزيتوني", color: "#596B37", soft: "#F0F3E9" },
  { id: "emerald", name: "الزمردي", color: "#087F5B", soft: "#E8F6F0" },
  { id: "navy", name: "الكحلي", color: "#27445D", soft: "#EDF2F6" },
  { id: "burgundy", name: "العنابي", color: "#713B46", soft: "#F6ECEE" },
  { id: "gold", name: "الذهبي المعتّق", color: "#9A7425", soft: "#F8F2E4" },
];

const FONT_SIZES = [
  { id: "compact", label: "صغير", value: 14 },
  { id: "normal", label: "متوسط", value: 16 },
  { id: "large", label: "كبير", value: 18 },
];

const DENSITIES = [
  { id: "compact", label: "مضغوط", scale: .90 },
  { id: "comfortable", label: "مريح", scale: 1 },
  { id: "spacious", label: "واسع", scale: 1.08 },
];

const DEFAULT_APPEARANCE = {
  theme: "sadiq",
  customColor: "#0B5D4B",
  fontSize: "normal",
  density: "comfortable",
  mode: "light",
  rounded: true,
  subtleOrnaments: true,
};

function readAppearance() {
  try {
    const saved = JSON.parse(localStorage.getItem("sadiq_appearance") || "null");
    return { ...DEFAULT_APPEARANCE, ...(saved || {}) };
  } catch {
    return DEFAULT_APPEARANCE;
  }
}

function applyAppearance(value) {
  const root = document.documentElement;
  const selected = THEMES.find((t) => t.id === value.theme);
  const primary = value.theme === "custom" ? value.customColor : (selected?.color || DEFAULT_APPEARANCE.customColor);
  const font = FONT_SIZES.find((x) => x.id === value.fontSize)?.value || 16;
  const density = DENSITIES.find((x) => x.id === value.density)?.scale || 1;

  root.style.setProperty("--app-primary", primary);
  root.style.setProperty("--app-font-size", `${font}px`);
  root.style.setProperty("--app-density", density);
  root.dataset.appMode = value.mode;
  root.dataset.appCorners = value.rounded ? "rounded" : "soft";
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general");
  const [appearance, setAppearance] = useState(readAppearance);
  const [savedAppearance, setSavedAppearance] = useState(readAppearance);
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => { applyAppearance(savedAppearance); }, [savedAppearance]);

  const activeMeta = useMemo(
    () => TABS.find((tab) => tab.key === activeTab) || TABS[0],
    [activeTab]
  );

  const dirty = JSON.stringify(appearance) !== JSON.stringify(savedAppearance);

  function saveAppearance() {
    localStorage.setItem("sadiq_appearance", JSON.stringify(appearance));
    setSavedAppearance(appearance);
    applyAppearance(appearance);
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 1800);
  }

  function resetAppearance() {
    setAppearance(DEFAULT_APPEARANCE);
  }

  function renderContent() {
    switch (activeTab) {
      case "general": return <GeneralSettings />;
      case "appearance":
        return (
          <AppearanceSettings
            value={appearance}
            onChange={setAppearance}
            onSave={saveAppearance}
            onReset={resetAppearance}
            dirty={dirty}
            savedFlash={savedFlash}
          />
        );
      case "points": return <PointsSettings />;
      case "tv": return <TVSettings />;
      case "quotes": return <QuoteManager />;
      case "security": return <SecuritySettings />;
      case "about": return <AboutSystem />;
      default: return <GeneralSettings />;
    }
  }

  return (
    <div className="settings-page-pro" dir="rtl">
      <div className="settings-vegetal settings-vegetal--top" aria-hidden="true">
        <VegetalOrnament />
      </div>
      <div className="settings-vegetal settings-vegetal--bottom" aria-hidden="true">
        <VegetalOrnament />
      </div>

      <section className="settings-hero-pro">
        <div className="settings-hero-copy">
          <span className="settings-eyebrow"><Settings size={14}/> مركز التحكم بالنظام</span>
          <div className="settings-hero-title">
            <div className="settings-hero-icon"><MonitorCog size={25}/></div>
            <div>
              <h1>إعدادات الصِّدّيق</h1>
              <p>إدارة الهوية، تجربة الاستخدام، النقاط، العرض، الأمان وإعدادات النظام من مركز واحد.</p>
            </div>
          </div>
        </div>
        <div className="settings-hero-status">
          <span><ShieldCheck size={15}/> حالة النظام</span>
          <strong>الإعدادات جاهزة</strong>
          <small>يمكنك تخصيص النظام بما يناسب بيئة الحلقات</small>
        </div>
      </section>

      <div className="settings-command-bar">
        <div>
          <span>القسم الحالي</span>
          <strong>{activeMeta.label}</strong>
        </div>
        <div className="settings-command-note">
          <Sparkles size={15}/>
          <span>{activeMeta.desc}</span>
        </div>
      </div>

      <div className="settings-layout-pro">
        <aside className="settings-nav-pro">
          <div className="settings-nav-head">
            <span>أقسام الإعدادات</span>
            <small>{TABS.length} أقسام</small>
          </div>
          <nav>
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  type="button"
                  className={`settings-nav-item ${activeTab === tab.key ? "active" : ""}`}
                  onClick={() => setActiveTab(tab.key)}
                >
                  <span className="settings-nav-icon"><Icon size={17}/></span>
                  <span className="settings-nav-text">
                    <strong>{tab.label}</strong>
                    <small>{tab.desc}</small>
                  </span>
                  <ChevronLeft size={15} className="settings-nav-arrow"/>
                </button>
              );
            })}
          </nav>
          <div className="settings-nav-foot">
            <ShieldCheck size={16}/>
            <div><strong>إعدادات مركزية</strong><small>التغييرات المرئية تحفظ على هذا الجهاز حاليًا.</small></div>
          </div>
        </aside>

        <main className="settings-workspace">
          <div className="settings-workspace-head">
            <div className="settings-workspace-icon"><activeMeta.icon size={19}/></div>
            <div>
              <span>إعدادات النظام</span>
              <h2>{activeMeta.label}</h2>
              <p>{activeMeta.desc}</p>
            </div>
          </div>
          <div className="settings-component-surface">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}

function AppearanceSettings({ value, onChange, onSave, onReset, dirty, savedFlash }) {
  const set = (patch) => onChange({ ...value, ...patch });

  return (
    <div className="appearance-settings">
      <section className="appearance-intro">
        <div className="appearance-intro-icon"><Palette size={21}/></div>
        <div>
          <span>الهوية البصرية</span>
          <h3>المظهر وتجربة الاستخدام</h3>
          <p>خصص اللون الأساسي وحجم النص وكثافة العناصر. تظهر المعاينة مباشرة داخل هذه الصفحة قبل الحفظ.</p>
        </div>
      </section>

      <section className="setting-pro-section">
        <div className="setting-pro-heading">
          <div><Palette size={17}/><span><strong>لون النظام</strong><small>اللون الرئيسي للأزرار والعناصر النشطة</small></span></div>
          <span className="setting-badge">الهوية</span>
        </div>
        <div className="theme-swatches">
          {THEMES.map((theme) => (
            <button
              type="button"
              key={theme.id}
              className={`theme-swatch ${value.theme === theme.id ? "selected" : ""}`}
              onClick={() => set({ theme: theme.id })}
            >
              <i style={{ background: theme.color }} />
              <span><strong>{theme.name}</strong><small>{theme.color}</small></span>
              {value.theme === theme.id && <Check size={15}/>}
            </button>
          ))}
          <label className={`theme-swatch custom ${value.theme === "custom" ? "selected" : ""}`}>
            <input
              type="color"
              value={value.customColor}
              onChange={(e) => set({ theme: "custom", customColor: e.target.value })}
            />
            <span><strong>لون مخصص</strong><small>{value.customColor}</small></span>
            {value.theme === "custom" && <Check size={15}/>}
          </label>
        </div>
      </section>

      <div className="appearance-two-col">
        <section className="setting-pro-section">
          <div className="setting-pro-heading">
            <div><Type size={17}/><span><strong>حجم الخط</strong><small>الحجم الأساسي للنصوص في النظام</small></span></div>
          </div>
          <div className="segmented-setting">
            {FONT_SIZES.map((item) => (
              <button key={item.id} type="button" className={value.fontSize === item.id ? "active" : ""} onClick={() => set({ fontSize: item.id })}>
                <span style={{ fontSize: item.value }}>{item.label}</span>
                <small>{item.value}px</small>
              </button>
            ))}
          </div>
        </section>

        <section className="setting-pro-section">
          <div className="setting-pro-heading">
            <div><Gauge size={17}/><span><strong>كثافة الواجهة</strong><small>المسافات بين البطاقات والحقول</small></span></div>
          </div>
          <div className="segmented-setting">
            {DENSITIES.map((item) => (
              <button key={item.id} type="button" className={value.density === item.id ? "active" : ""} onClick={() => set({ density: item.id })}>
                <LayoutGrid size={16}/><span>{item.label}</span>
              </button>
            ))}
          </div>
        </section>
      </div>

      <section className="setting-pro-section">
        <div className="setting-pro-heading">
          <div><SunMedium size={17}/><span><strong>خيارات العرض</strong><small>تفضيلات إضافية لراحة الاستخدام</small></span></div>
        </div>
        <div className="setting-switches">
          <ToggleRow
            icon={value.mode === "dark" ? <MoonStar size={17}/> : <SunMedium size={17}/>}
            title="الوضع الداكن"
            desc="استخدام واجهة داكنة عند تفعيل دعمها في بقية صفحات النظام"
            checked={value.mode === "dark"}
            onChange={(checked) => set({ mode: checked ? "dark" : "light" })}
          />
          <ToggleRow
            icon={<LayoutGrid size={17}/>}
            title="الحواف المستديرة"
            desc="استخدام بطاقات وحقول بحواف أكثر نعومة"
            checked={value.rounded}
            onChange={(checked) => set({ rounded: checked })}
          />
          <ToggleRow
            icon={<Sparkles size={17}/>}
            title="الزخارف الإسلامية الخفيفة"
            desc="إظهار عناصر التوريق النباتي الهادئة في الصفحات الداعمة"
            checked={value.subtleOrnaments}
            onChange={(checked) => set({ subtleOrnaments: checked })}
          />
        </div>
      </section>

      <section className="appearance-preview">
        <div className="preview-head"><span>معاينة مباشرة</span><small>قبل تطبيق الإعدادات</small></div>
        <div
          className="preview-panel"
          style={{
            "--preview-primary": value.theme === "custom" ? value.customColor : (THEMES.find(t => t.id === value.theme)?.color || "#0B5D4B"),
            "--preview-font": `${FONT_SIZES.find(x => x.id === value.fontSize)?.value || 16}px`,
            "--preview-scale": DENSITIES.find(x => x.id === value.density)?.scale || 1,
          }}
        >
          <div className="preview-top"><i/><span>لوحة الصِّدّيق</span><button>إجراء رئيسي</button></div>
          <div className="preview-cards">
            <div><small>الطلاب</small><strong>128</strong><span>مؤشر تجريبي</span></div>
            <div><small>الحلقات</small><strong>12</strong><span>مؤشر تجريبي</span></div>
            <div><small>نسبة الإنجاز</small><strong>86%</strong><span>مؤشر تجريبي</span></div>
          </div>
        </div>
      </section>

      <div className="appearance-actions">
        <button type="button" className="appearance-reset" onClick={onReset}><RotateCcw size={16}/> استعادة الافتراضي</button>
        <div className="appearance-save-wrap">
          {dirty && <span className="unsaved-dot">تغييرات غير محفوظة</span>}
          <button type="button" className={`appearance-save ${savedFlash ? "saved" : ""}`} onClick={onSave} disabled={!dirty && !savedFlash}>
            {savedFlash ? <Check size={17}/> : <Save size={17}/>}
            {savedFlash ? "تم الحفظ" : "حفظ المظهر"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ToggleRow({ icon, title, desc, checked, onChange }) {
  return (
    <label className="toggle-row">
      <span className="toggle-row-icon">{icon}</span>
      <span className="toggle-row-copy"><strong>{title}</strong><small>{desc}</small></span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)}/>
      <span className="toggle-ui"><i/></span>
    </label>
  );
}

function VegetalOrnament() {
  return (
    <svg viewBox="0 0 180 180" aria-hidden="true">
      <path d="M177 5C126 8 91 24 61 53C34 79 20 116 8 174" className="v-stroke"/>
      <path d="M151 12c-7 25-20 40-40 50-18 9-35 12-48 28-14 17-16 38-19 56" className="v-stroke"/>
      <path d="M130 27c-15-1-25 6-31 20 15 2 26-4 31-20ZM106 53c-14-4-25 1-33 14 14 5 26 0 33-14ZM78 78c-13-6-25-3-35 8 12 8 24 5 35-8ZM54 107c-11-8-23-8-34 0 10 10 22 10 34 0Z" className="v-fill"/>
      <path d="M141 41c1 14 8 24 21 29 2-14-5-24-21-29ZM113 66c3 13 10 21 22 24 1-12-6-21-22-24ZM85 91c4 12 12 19 24 21 0-12-8-20-24-21Z" className="v-fill"/>
      <circle cx="111" cy="61" r="2.5" className="v-dot"/><circle cx="75" cy="87" r="2.1" className="v-dot"/><circle cx="45" cy="116" r="2.2" className="v-dot"/>
    </svg>
  );
}
