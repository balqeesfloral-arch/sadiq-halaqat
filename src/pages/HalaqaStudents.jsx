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
        }}
      >
        طلاب الحلقة
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
        إدارة ومتابعة طلاب الحلقة
      </p>
    </div>

    {/* Stats */}
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
            marginBottom: 10,
          }}
        >
          عدد الطلاب
        </div>

        <div
          style={{
            fontSize: "38px",
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
          borderRadius: "20px",
          padding: "24px",
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
            fontSize: "20px",
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
        borderRadius: "20px",
        padding: "18px",
        marginBottom: "25px",
        border: "1px solid #E5E7EB",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
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
            fontSize: "15px",
          }}
        />
      </div>
    </div>

    {/* Students Table */}
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
                    fontSize: "13px",
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
            padding: "50px",
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