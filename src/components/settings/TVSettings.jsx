import { useEffect, useState } from "react";
import { Save, Tv } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { showToast } from "../../components/Toast";

export default function TVSettings() {
  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [form, setForm] = useState({
    tv_page_duration: 40,
    tv_first_page_count: 10,
    tv_other_pages_count: 20,
    tv_show_podium: "true",
    tv_show_quotes: "true",
    tv_primary_color: "#14532d",
    tv_secondary_color: "#D4AF37",
  });

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const { data, error } =
        await supabase
          .from("system_settings")
          .select("*");

      if (error) throw error;

      const settings = {};

      data.forEach((item) => {
        settings[item.setting_key] =
          item.setting_value;
      });

      setForm({
        tv_page_duration:
          Number(
            settings.tv_page_duration
          ) || 40,

        tv_first_page_count:
          Number(
            settings.tv_first_page_count
          ) || 10,

        tv_other_pages_count:
          Number(
            settings.tv_other_pages_count
          ) || 20,

        tv_show_podium:
          settings.tv_show_podium ||
          "true",

        tv_show_quotes:
          settings.tv_show_quotes ||
          "true",

        tv_primary_color:
          settings.tv_primary_color ||
          "#14532d",

        tv_secondary_color:
          settings.tv_secondary_color ||
          "#D4AF37",
      });
    } catch (error) {
      console.error(error);

      showToast(
        "فشل تحميل إعدادات التلفزيون"
      );
    } finally {
      setLoading(false);
    }
  }

  function updateField(
    field,
    value
  ) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  async function saveAll() {
    try {
      setSaving(true);

      for (const [key, value] of Object.entries(form)) {
        await supabase
          .from("system_settings")
          .update({
            setting_value: String(value),
          })
          .eq("setting_key", key);
      }

      showToast(
        "تم حفظ إعدادات شاشة التلفزيون"
      );
    } catch (error) {
      console.error(error);

      showToast(
        "حدث خطأ أثناء الحفظ"
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="settings-card">
        جاري التحميل...
      </div>
    );
  }

  return (
    <div className="settings-card">
      <div className="section-title">
        <Tv size={22} />
        <h2>
          إعدادات شاشة التلفزيون
        </h2>
      </div>

      <div className="settings-grid">

        <div className="field-group">
          <label>
            مدة التنقل (ثانية)
          </label>

          <input
            type="number"
            value={
              form.tv_page_duration
            }
            onChange={(e) =>
              updateField(
                "tv_page_duration",
                e.target.value
              )
            }
          />
        </div>

        <div className="field-group">
          <label>
            عدد الصفحة الأولى
          </label>

          <input
            type="number"
            value={
              form.tv_first_page_count
            }
            onChange={(e) =>
              updateField(
                "tv_first_page_count",
                e.target.value
              )
            }
          />
        </div>

        <div className="field-group">
          <label>
            عدد الصفحات التالية
          </label>

          <input
            type="number"
            value={
              form.tv_other_pages_count
            }
            onChange={(e) =>
              updateField(
                "tv_other_pages_count",
                e.target.value
              )
            }
          />
        </div>

        <div className="field-group">
          <label>
            إظهار منصة التتويج
          </label>

          <select
            value={
              form.tv_show_podium
            }
            onChange={(e) =>
              updateField(
                "tv_show_podium",
                e.target.value
              )
            }
          >
            <option value="true">
              نعم
            </option>

            <option value="false">
              لا
            </option>
          </select>
        </div>

        <div className="field-group">
          <label>
            إظهار الكلمات التحفيزية
          </label>

          <select
            value={
              form.tv_show_quotes
            }
            onChange={(e) =>
              updateField(
                "tv_show_quotes",
                e.target.value
              )
            }
          >
            <option value="true">
              نعم
            </option>

            <option value="false">
              لا
            </option>
          </select>
        </div>

        <div className="field-group">
          <label>
            اللون الرئيسي
          </label>

          <input
            type="color"
            value={
              form.tv_primary_color
            }
            onChange={(e) =>
              updateField(
                "tv_primary_color",
                e.target.value
              )
            }
          />
        </div>

        <div className="field-group">
          <label>
            اللون الذهبي
          </label>

          <input
            type="color"
            value={
              form.tv_secondary_color
            }
            onChange={(e) =>
              updateField(
                "tv_secondary_color",
                e.target.value
              )
            }
          />
        </div>

      </div>

      <div className="settings-actions">
        <button
          className="save-btn"
          onClick={saveAll}
          disabled={saving}
        >
          <Save size={18} />

          {saving
            ? "جاري الحفظ..."
            : "حفظ الإعدادات"}
        </button>
      </div>
    </div>
  );
}