import { useEffect, useMemo, useState } from "react";
import {
  Save, Building2, Phone, Mail, MapPin, BadgeCheck,
  RefreshCw, Info, CheckCircle2, AlertCircle
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { showToast } from "../../components/Toast";

const FIELDS = [
  { key: "program_name", label: "اسم المنصة", placeholder: "الصِّدّيق", icon: BadgeCheck, type: "text" },
  { key: "phone", label: "رقم التواصل", placeholder: "05xxxxxxxx", icon: Phone, type: "tel", dir: "ltr" },
  { key: "email", label: "البريد الرسمي", placeholder: "name@example.com", icon: Mail, type: "email", dir: "ltr" },
  { key: "address", label: "العنوان العام", placeholder: "المدينة، الحي، العنوان", icon: MapPin, type: "text", full: true },
];

const EMPTY = Object.fromEntries(FIELDS.map((field) => [field.key, ""]));

export default function GeneralSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saved, setSaved] = useState(EMPTY);
  const [availableKeys, setAvailableKeys] = useState(new Set());
  const [loadError, setLoadError] = useState("");

  const dirty = useMemo(
    () => FIELDS.some(({ key }) => String(form[key] ?? "") !== String(saved[key] ?? "")),
    [form, saved]
  );

  useEffect(() => { loadSettings(); }, []);

  async function loadSettings() {
    try {
      setLoading(true);
      setLoadError("");

      const { data, error } = await supabase
        .from("system_settings")
        .select("setting_key, setting_value");

      if (error) throw error;

      const map = {};
      const keys = new Set();
      (data || []).forEach((item) => {
        keys.add(item.setting_key);
        map[item.setting_key] = item.setting_value ?? "";
      });

      const next = { ...EMPTY };
      FIELDS.forEach(({ key }) => { next[key] = map[key] ?? ""; });
      setForm(next);
      setSaved(next);
      setAvailableKeys(keys);
    } catch (error) {
      console.error("General settings load:", error);
      setLoadError("تعذر تحميل الإعدادات العامة من قاعدة البيانات.");
      showToast("فشل تحميل الإعدادات العامة");
    } finally {
      setLoading(false);
    }
  }

  async function saveAll() {
    if (!dirty || saving) return;

    const changed = FIELDS.filter(({ key }) => form[key] !== saved[key]);
    const missing = changed.filter(({ key }) => !availableKeys.has(key));

    if (missing.length) {
      showToast(`الإعداد غير مهيأ في قاعدة البيانات: ${missing.map(x => x.label).join("، ")}`);
      return;
    }

    try {
      setSaving(true);
      for (const { key } of changed) {
        const { error } = await supabase
          .from("system_settings")
          .update({ setting_value: String(form[key] ?? "").trim() })
          .eq("setting_key", key);
        if (error) throw error;
      }

      const normalized = Object.fromEntries(
        Object.entries(form).map(([key, value]) => [key, String(value ?? "").trim()])
      );
      setForm(normalized);
      setSaved(normalized);
      showToast("تم حفظ الإعدادات العامة بنجاح");
    } catch (error) {
      console.error("General settings save:", error);
      showToast("حدث خطأ أثناء حفظ الإعدادات");
    } finally {
      setSaving(false);
    }
  }

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  if (loading) {
    return (
      <div className="general-settings-state">
        <RefreshCw size={20} className="settings-spin" />
        <div><strong>جاري تحميل الإعدادات</strong><span>يتم جلب القيم الحالية من قاعدة البيانات</span></div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="general-settings-state error">
        <AlertCircle size={22}/>
        <div><strong>تعذر تحميل الإعدادات</strong><span>{loadError}</span></div>
        <button type="button" onClick={loadSettings}>إعادة المحاولة</button>
      </div>
    );
  }

  return (
    <div className="general-settings-pro">
      <section className="general-settings-overview">
        <div className="general-settings-overview__icon"><Building2 size={23}/></div>
        <div>
          <span>الإعدادات الأساسية</span>
          <h3>بيانات المنصة والتواصل</h3>
          <p>هذه القيم مرتبطة بجدول إعدادات النظام وتحفظ فعليًا في قاعدة البيانات.</p>
        </div>
        <div className="general-settings-live"><CheckCircle2 size={15}/> مرتبط بالنظام</div>
      </section>

      <section className="general-settings-section">
        <div className="general-settings-section__head">
          <div>
            <strong>الهوية وبيانات التواصل</strong>
            <span>البيانات العامة المستخدمة لتعريف المنصة والتواصل الإداري</span>
          </div>
          <span className="general-settings-count">{FIELDS.length} حقول</span>
        </div>

        <div className="general-settings-grid">
          {FIELDS.map((field) => {
            const Icon = field.icon;
            return (
              <label key={field.key} className={`general-field ${field.full ? "full" : ""}`}>
                <span className="general-field__label"><Icon size={15}/>{field.label}</span>
                <input
                  type={field.type}
                  dir={field.dir || "rtl"}
                  value={form[field.key]}
                  placeholder={field.placeholder}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                />
              </label>
            );
          })}
        </div>
      </section>

      <aside className="general-settings-note">
        <Info size={18}/>
        <div>
          <strong>بيانات المساجد ليست إعدادًا عامًا</strong>
          <span>اسم المسجد وقسم رجال/نساء والعنوان الخاص بكل مسجد تُدار من صفحة «المساجد» حتى لا تختلط بيانات المساجد المتعددة.</span>
        </div>
      </aside>

      <div className="general-settings-actions">
        <div className={`general-settings-change-state ${dirty ? "dirty" : ""}`}>
          <i/>{dirty ? "لديك تغييرات غير محفوظة" : "جميع التغييرات محفوظة"}
        </div>
        <div className="general-settings-buttons">
          <button type="button" className="general-settings-reload" onClick={loadSettings} disabled={saving}>
            <RefreshCw size={15}/> تحديث
          </button>
          <button type="button" className="general-settings-save" onClick={saveAll} disabled={saving || !dirty}>
            {saving ? <RefreshCw size={16} className="settings-spin"/> : <Save size={16}/>} 
            {saving ? "جاري الحفظ..." : "حفظ التغييرات"}
          </button>
        </div>
      </div>
    </div>
  );
}
