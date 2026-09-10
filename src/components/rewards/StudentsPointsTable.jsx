import {
  Gift,
  MinusCircle,
  History,
  UserCheck,
  UserX,
} from "lucide-react";

import { Users } from "lucide-react";

export default function StudentsPointsTable({

  students = [],

  onGrant,

  onPenalty,

  onHistory,

}) {

  return (

    <div
      style={{
        background:"#fff",
        borderRadius:"24px",
        overflow:"hidden",
        border:"1px solid #E2E8F0",
        boxShadow:
          "0 10px 30px rgba(15,23,42,.05)"
      }}
    >

      {/* HEADER */}

      <div
        style={{
          padding:"28px 32px",
          borderBottom:
            "1px solid #E2E8F0",
          display:"flex",
          alignItems:"center",
          justifyContent:"space-between"
        }}
      >

        <div>

          <div
            style={{
              fontSize:"20px",
              fontWeight:"900"
            }}
          >
            الطلاب
          </div>

          <div
            style={{
              color:"#64748B",
              marginTop:"4px"
            }}
          >
            إدارة المنح والخصومات
          </div>

        </div>

        <div
  style={{
    display:"flex",
    alignItems:"center",
    gap:"10px",

    background:"#ECFDF5",

    color:"#0F766E",

    padding:"12px 18px",

    borderRadius:"14px",

    fontWeight:"900",

    border:"1px solid #A7F3D0"
  }}
>
  <Users size={18} />

  {students.length} طالب
</div>

      </div>

      {/* TABLE */}

      <div
        style={{
          overflowX:"auto"
        }}
      >

  <div
  style={{
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fill,minmax(360px,1fr))",
    gap: "20px",
    padding: "24px",
  }}
>

  {students.map((student) => {

    const absent =
      student.attendance !==
      "present";

    return (

      <div
        key={student.id}
        style={{
          background: "#fff",
          border: "1px solid #E2E8F0",
          borderRadius: "24px",
          padding: "24px",
          boxShadow:
            "0 8px 24px rgba(15,23,42,.05)",
        }}
      >

        {/* الطالب */}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "14px",
            marginBottom: "20px",
          }}
        >

          <div
            style={{
              width: "54px",
              height: "54px",
              borderRadius: "50%",
              background:
                "linear-gradient(135deg,#0F766E,#115E59)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "900",
            }}
          >
            {student.full_name?.charAt(0)}
          </div>

          <div>

            <div
              style={{
                fontWeight: "900",
                fontSize: "18px",
              }}
            >
              {student.full_name}
            </div>

            <div
              style={{
                color: "#94A3B8",
                fontSize: "13px",
              }}
            >
              طالب حلقة
            </div>

          </div>

        </div>

        {/* الحضور والنقاط */}

        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            marginBottom: "20px",
          }}
        >

          <div>

            <div
              style={{
                color: "#64748B",
                marginBottom: "8px",
              }}
            >
              الحضور
            </div>

            {absent ? (
              <span
                style={{
                  color: "#DC2626",
                  fontWeight: "800",
                }}
              >
                غائب
              </span>
            ) : (
              <span
                style={{
                  color: "#16A34A",
                  fontWeight: "800",
                }}
              >
                حاضر
              </span>
            )}

          </div>

          <div
            style={{
              textAlign: "center",
            }}
          >

            <div
              style={{
                color: "#64748B",
                marginBottom: "8px",
              }}
            >
              النقاط
            </div>

            <div
              style={{
                background: "#ECFDF5",
                color: "#059669",
                borderRadius: "999px",
                padding: "8px 16px",
                fontWeight: "900",
              }}
            >
              {student.total_points}
            </div>

          </div>

        </div>

        {/* الأزرار */}

        <div
          style={{
            display: "flex",
            gap: "12px",
          }}
        >

          <button
            onClick={() =>
              onGrant(student)
            }
            disabled={absent}
            style={{
              flex: 1,
              height: "48px",
              border: "none",
              borderRadius: "14px",
              background: "#DCFCE7",
              color: "#16A34A",
              fontWeight: "800",
              cursor: "pointer",
            }}
          >
            منح
          </button>

          <button
            onClick={() =>
              onPenalty(student)
            }
            disabled={absent}
            style={{
              flex: 1,
              height: "48px",
              border: "none",
              borderRadius: "14px",
              background: "#FEE2E2",
              color: "#DC2626",
              fontWeight: "800",
              cursor: "pointer",
            }}
          >
            خصم
          </button>

          <button
            onClick={() =>
              onHistory(student)
            }
            style={{
              width: "56px",
              border: "none",
              borderRadius: "14px",
              background: "#EFF6FF",
              color: "#2563EB",
              cursor: "pointer",
            }}
          >
            <History size={18}/>
          </button>

        </div>

      </div>

    );

  })}

</div>

      </div>

    </div>

  );

}