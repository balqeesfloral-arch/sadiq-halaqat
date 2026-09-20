import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import {
  GraduationCap,
  ArrowRight,
} from "lucide-react";

export default function HalaqaTeachers() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [halaqa, setHalaqa] = useState(null);

  const [teachers, setTeachers] =
    useState([]);

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    const { data: halaqaData } =
      await supabase
        .from("halaqat")
        .select("*")
        .eq("id", id)
        .single();

    setHalaqa(halaqaData);

    const teacherIds = [
      halaqaData?.main_teacher_id,
      halaqaData?.assistant_teacher_id,
    ].filter(Boolean);

    if (teacherIds.length === 0) {
      setTeachers([]);
      return;
    }

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .in("id", teacherIds);

    setTeachers(data || []);
  }

  return (
  <div
    style={{
      minHeight: "100vh",
      background: "var(--app-color-f4f7f5,#F4F7F5)",
      padding: "calc(30px * var(--app-density,1))",
      direction: "rtl",
    }}
  >
    {/* Header */}
    <div
      style={{
        background:
          "linear-gradient(135deg,#556B2F,#3E5A22)",
        borderRadius: "calc(28px * var(--app-radius-scale,1))",
        padding: "calc(40px * var(--app-density,1))",
        color: "#fff",
        marginBottom: "30px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: "-60px",
          top: "-60px",
          width: "220px",
          height: "220px",
          borderRadius: "50%",
          background:
            "rgba(212,175,55,0.08)",
        }}
      />

      <button
        onClick={() =>
          navigate("/admin/halaqat")
        }
        style={{
          background: "#D4AF37",
          border: "none",
          padding: "calc(10px * var(--app-density,1)) calc(18px * var(--app-density,1))",
          borderRadius: "calc(12px * var(--app-radius-scale,1))",
          cursor: "pointer",
          marginBottom: "25px",
          fontWeight: 700,
        }}
      >
        <ArrowRight size={18} />
        رجوع للحلقات
      </button>

      <h1
        style={{
          margin: 0,
          fontSize: "calc(42px * var(--app-font-scale,1))",
          fontWeight: 900,
          display: "flex",
          alignItems: "center",
          gap: "calc(12px * var(--app-density,1))",
        }}
      >
        <GraduationCap size={42} />
        معلمو الحلقة
      </h1>

      <div
        style={{
          marginTop: 12,
          fontSize: "calc(22px * var(--app-font-scale,1))",
          color: "#F7E6A5",
        }}
      >
        {halaqa?.name || "جاري التحميل..."}
      </div>

      <p
        style={{
          marginTop: 10,
          opacity: 0.9,
        }}
      >
        إدارة ومتابعة معلمي الحلقة
      </p>
    </div>

    {/* Statistics */}
    <div
      style={{
        display: "grid",
        gridTemplateColumns:
          "repeat(auto-fit,minmax(250px,1fr))",
        gap: "calc(20px * var(--app-density,1))",
        marginBottom: "25px",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "calc(20px * var(--app-radius-scale,1))",
          padding: "calc(24px * var(--app-density,1))",
          border: "1px solid #E5E7EB",
        }}
      >
        <div
          style={{
            color: "#6B7280",
            marginBottom: "10px",
          }}
        >
          عدد المعلمين
        </div>

        <div
          style={{
            fontSize: "calc(38px * var(--app-font-scale,1))",
            fontWeight: 800,
            color: "#1F2937",
          }}
        >
          {teachers.length}
        </div>
      </div>

      <div
        style={{
          background: "#fff",
          borderRadius: "calc(20px * var(--app-radius-scale,1))",
          padding: "calc(24px * var(--app-density,1))",
          border: "1px solid #E5E7EB",
        }}
      >
        <div
          style={{
            color: "#6B7280",
            marginBottom: "10px",
          }}
        >
          حالة الحلقة
        </div>

        <div
          style={{
            fontSize: "calc(20px * var(--app-font-scale,1))",
            fontWeight: 700,
            color: "#16A34A",
          }}
        >
          نشطة
        </div>
      </div>
    </div>

    {/* Teachers List */}
    <div
      style={{
        background: "#fff",
        borderRadius: "calc(24px * var(--app-radius-scale,1))",
        overflow: "hidden",
        border: "1px solid #E5E7EB",
      }}
    >
      <div
        style={{
          padding: "calc(22px * var(--app-density,1))",
          borderBottom:
            "1px solid #E5E7EB",
          fontWeight: 800,
          fontSize: "calc(18px * var(--app-font-scale,1))",
        }}
      >
        قائمة المعلمين
      </div>

      {teachers.map(
        (teacher, index) => (
          <div
            key={teacher.id}
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "center",
              padding: "calc(18px * var(--app-density,1)) calc(22px * var(--app-density,1))",
              borderBottom:
                "1px solid #F1F5F9",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "calc(15px * var(--app-density,1))",
              }}
            >
              <div
                style={{
                  width: "50px",
                  height: "50px",
                  borderRadius: "50%",
                  background: "#EEF4EE",
                  display: "flex",
                  alignItems: "center",
                  justifyContent:
                    "center",
                  fontWeight: 800,
                  color: "#556B2F",
                }}
              >
                {index + 1}
              </div>

              <div>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: "calc(16px * var(--app-font-scale,1))",
                  }}
                >
                  {teacher.full_name}
                </div>

                <div
                  style={{
                    fontSize: "calc(13px * var(--app-font-scale,1))",
                    color: "#6B7280",
                  }}
                >
                  معلم معتمد بالحلقات
                </div>
              </div>
            </div>

            <div
              style={{
                background:
                  "#EEF4EE",
                color: "#556B2F",
                padding:
                  "calc(8px * var(--app-density,1)) calc(14px * var(--app-density,1))",
                borderRadius:
                  "999px",
                fontWeight: 700,
                fontSize: "calc(13px * var(--app-font-scale,1))",
              }}
            >
              معلم
            </div>
          </div>
        )
      )}

      {teachers.length === 0 && (
        <div
          style={{
            padding: "calc(60px * var(--app-density,1))",
            textAlign: "center",
            color: "#6B7280",
          }}
        >
          لا يوجد معلمون مرتبطون بهذه الحلقة
        </div>
      )}
    </div>
  </div>
);
}