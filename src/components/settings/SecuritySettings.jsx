import { useEffect, useState } from "react";
import { Shield, Save } from "lucide-react";

import { supabase } from "../../lib/supabase";

import { showToast } from "../../components/Toast";

export default function SecuritySettings() {
  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [form, setForm] = useState({
    session_timeout_minutes: 60,
    enable_activity_logs: "true",
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
        session_timeout_minutes:
          Number(
            settings.session_timeout_minutes
          ) || 60,

        enable_activity_logs:
          settings.enable_activity_logs ||
          "true",
      });
    } catch (error) {
      console.error(error);

      showToast(
        "فشل تحميل إعدادات الأمان"
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
        "تم حفظ إعدادات الأمان"
      );
    } catch (error) {
      console.error(error);

      showToast(
        "فشل حفظ الإعدادات"
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
        <Shield size={22} />
        <h2>الأمان</h2>
      </div>

      <div className="settings-grid">

        <div className="field-group">
          <label>
            مهلة الجلسة (دقيقة)
          </label>

          <input
            type="number"
            value={
              form.session_timeout_minutes
            }
            onChange={(e) =>
              updateField(
                "session_timeout_minutes",
                e.target.value
              )
            }
          />
        </div>

        <div className="field-group">
          <label>
            سجل النشاطات
          </label>

          <select
            value={
              form.enable_activity_logs
            }
            onChange={(e) =>
              updateField(
                "enable_activity_logs",
                e.target.value
              )
            }
          >
            <option value="true">
              مفعل
            </option>

            <option value="false">
              غير مفعل
            </option>
          </select>
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