import { useEffect, useState } from "react";
import { Save, Trophy } from "lucide-react";

import { supabase } from "../../lib/supabase";

import { showToast } from "../../components/Toast";

export default function PointsSettings() {
  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [form, setForm] = useState({
    attendance_points: 5,
    discipline_points: 3,
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
        attendance_points:
          Number(
            settings.attendance_points
          ) || 5,

        discipline_points:
          Number(
            settings.discipline_points
          ) || 3,
      });
    } catch (error) {
      console.error(error);

      showToast(
        "فشل تحميل إعدادات النقاط"
      );
    } finally {
      setLoading(false);
    }
  }

  async function saveAll() {
    try {
      setSaving(true);

      await supabase
        .from("system_settings")
        .update({
          setting_value:
            form.attendance_points,
        })
        .eq(
          "setting_key",
          "attendance_points"
        );

      await supabase
        .from("system_settings")
        .update({
          setting_value:
            form.discipline_points,
        })
        .eq(
          "setting_key",
          "discipline_points"
        );

      showToast(
        "تم حفظ إعدادات النقاط"
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

  function updateField(
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
        جاري التحميل...
      </div>
    );
  }

  return (
    <div className="settings-card">
      <div className="section-title">
        <Trophy size={22} />
        <h2>
          إعدادات النقاط
        </h2>
      </div>

      <div className="settings-grid">
        <div className="field-group">
          <label>
            نقاط الحضور
          </label>

          <input
            type="number"
            value={
              form.attendance_points
            }
            onChange={(e) =>
              updateField(
                "attendance_points",
                e.target.value
              )
            }
          />
        </div>

        <div className="field-group">
          <label>
            نقاط الانضباط
          </label>

          <input
            type="number"
            value={
              form.discipline_points
            }
            onChange={(e) =>
              updateField(
                "discipline_points",
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