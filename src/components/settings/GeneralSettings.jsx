import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { supabase } from "../../lib/supabase";

import { showToast } from "../../components/Toast";

export default function GeneralSettings() {
  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [form, setForm] = useState({
    program_name: "",
    mosque_name: "",
    phone: "",
    email: "",
    address: "",
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
          item.setting_value || "";
      });

      setForm({
        program_name:
          settings.program_name || "",
        mosque_name:
          settings.mosque_name || "",
        phone:
          settings.phone || "",
        email:
          settings.email || "",
        address:
          settings.address || "",
      });
    } catch (error) {
      console.error(error);

      showToast(
        "فشل تحميل البيانات"
      );
    } finally {
      setLoading(false);
    }
  }

  async function saveAll() {
    try {
      setSaving(true);

      const updates =
        Object.entries(form).map(
          ([key, value]) => ({
            setting_key: key,
            setting_value: value,
          })
        );

      for (const item of updates) {
        await supabase
          .from("system_settings")
          .update({
            setting_value:
              item.setting_value,
          })
          .eq(
            "setting_key",
            item.setting_key
          );
      }

      showToast(
        "تم حفظ الإعدادات بنجاح"
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

  function handleChange(
    field,
    value
  ) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  if (loading) {
    return (
      <div className="settings-card">
        جاري تحميل البيانات...
      </div>
    );
  }

  return (
    <div className="settings-card">
      <h2>
        الإعدادات العامة
      </h2>

      <div className="settings-grid">
        <div className="field-group">
          <label>
            اسم البرنامج
          </label>

          <input
            value={
              form.program_name
            }
            onChange={(e) =>
              handleChange(
                "program_name",
                e.target.value
              )
            }
          />
        </div>

        <div className="field-group">
          <label>
            اسم المسجد
          </label>

          <input
            value={
              form.mosque_name
            }
            onChange={(e) =>
              handleChange(
                "mosque_name",
                e.target.value
              )
            }
          />
        </div>

        <div className="field-group">
          <label>
            رقم الجوال
          </label>

          <input
            value={form.phone}
            onChange={(e) =>
              handleChange(
                "phone",
                e.target.value
              )
            }
          />
        </div>

        <div className="field-group">
          <label>
            البريد الإلكتروني
          </label>

          <input
            value={form.email}
            onChange={(e) =>
              handleChange(
                "email",
                e.target.value
              )
            }
          />
        </div>

        <div className="field-group full-width">
          <label>
            العنوان
          </label>

          <input
            value={form.address}
            onChange={(e) =>
              handleChange(
                "address",
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