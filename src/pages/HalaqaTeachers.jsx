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
      background: "#F4F7F5",
      padding: "30px",
      direction: "rtl",
    }}
  >
    {/* Header */}
    <div
      style={{
        background:
          "linear-gradient(135deg,#556B2F,#3E5A22)",
        borderRadius: "28px",
        padding: "40px",
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
          padding: "10px 18px",
          borderRadius: "12px",
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
          fontSize: "42px",
          fontWeight: 900,
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <GraduationCap size={42} />
        معلمو الحلقة
      </h1>

      <div
        style={{
          marginTop: 12,
          fontSize: "22px",
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
        gap: "20px",
        marginBottom: "25px",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "20px",
          padding: "24px",
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
            fontSize: "38px",
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
          borderRadius: "20px",
          padding: "24px",
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
            fontSize: "20px",
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
        borderRadius: "24px",
        overflow: "hidden",
        border: "1px solid #E5E7EB",
      }}
    >
      <div
        style={{
          padding: "22px",
          borderBottom:
            "1px solid #E5E7EB",
          fontWeight: 800,
          fontSize: "18px",
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
              padding: "18px 22px",
              borderBottom:
                "1px solid #F1F5F9",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "15px",
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
                    fontSize: "16px",
                  }}
                >
                  {teacher.full_name}
                </div>

                <div
                  style={{
                    fontSize: "13px",
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
                  "8px 14px",
                borderRadius:
                  "999px",
                fontWeight: 700,
                fontSize: "13px",
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
            padding: "60px",
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