import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Users, ArrowRight, Search } from "lucide-react";

export default function HalaqaStudents() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [halaqa, setHalaqa] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    const { data: halaqaData } = await supabase
      .from("halaqat")
      .select("*")
      .eq("id", id)
      .single();

    setHalaqa(halaqaData);

    const { data } = await supabase
      .from("student_halaqat")
      .select(`
        *,
        profiles (
          id,
          full_name
        )
      `)
      .eq("halaqa_id", id)
      .eq("is_current", true);

    setStudents(data || []);
  }

  const filteredStudents = students.filter(
    (s) =>
      s.profiles?.full_name
        ?.toLowerCase()
        .includes(search.toLowerCase())
  );

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
          left: "-50px",
          top: "-50px",
          width: "180px",
          height: "180px",
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
        }}
      >
        طلاب الحلقة
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
        إدارة ومتابعة طلاب الحلقة
      </p>
    </div>

    {/* Stats */}
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
            marginBottom: 10,
          }}
        >
          عدد الطلاب
        </div>

        <div
          style={{
            fontSize: "calc(38px * var(--app-font-scale,1))",
            fontWeight: 800,
            color: "#1F2937",
          }}
        >
          {filteredStudents.length}
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
            marginBottom: 10,
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

    {/* Search */}
    <div
      style={{
        background: "#fff",
        borderRadius: "calc(20px * var(--app-radius-scale,1))",
        padding: "calc(18px * var(--app-density,1))",
        marginBottom: "25px",
        border: "1px solid #E5E7EB",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "calc(10px * var(--app-density,1))",
        }}
      >
        <Search size={20} />

        <input
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          placeholder="بحث عن طالب..."
          style={{
            flex: 1,
            border: "none",
            outline: "none",
            fontSize: "calc(15px * var(--app-font-scale,1))",
          }}
        />
      </div>
    </div>

    {/* Students Table */}
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
        قائمة الطلاب
      </div>

      {filteredStudents.map(
        (student, index) => (
          <div
            key={student.id}
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
                  width: "45px",
                  height: "45px",
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
                  }}
                >
                  {
                    student.profiles
                      ?.full_name
                  }
                </div>

                <div
                  style={{
                    fontSize: "calc(13px * var(--app-font-scale,1))",
                    color: "#6B7280",
                  }}
                >
                  طالب مسجل بالحلقة
                </div>
              </div>
            </div>

            <Users
              size={20}
              color="#556B2F"
            />
          </div>
        )
      )}

      {filteredStudents.length === 0 && (
        <div
          style={{
            padding: "calc(50px * var(--app-density,1))",
            textAlign: "center",
            color: "#6B7280",
          }}
        >
          لا يوجد طلاب
        </div>
      )}
    </div>
  </div>
);
}