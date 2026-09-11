import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

import AppPage from "../components/AppPage";
import PageHero from "../components/PageHero";
import StatCard from "../components/StatCard";
import SectionCard from "../components/SectionCard";
import ActionCard from "../components/ActionCard";

import {
  Users,
  GraduationCap,
  BookOpen,
  Building2,
  ClipboardCheck,
  Mic2,
  CheckCircle2,
  XCircle,
  Clock3,
  Activity,
} from "lucide-react";

const todayHijri =
new Intl.DateTimeFormat(
  "ar-SA-u-ca-islamic",
  {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }
).format(new Date());

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    students: 0,
    teachers: 0,
    halaqat: 0,
    mosques: 0,
  });

  const [attendance, setAttendance] =
    useState({
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
    });

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    const today =
      new Date().toISOString().split("T")[0];

    const [
      students,
      teachers,
      halaqat,
      mosques,
      attendanceData,
    ] = await Promise.all([
      supabase
        .from("profiles")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq("role", "student"),

      supabase
        .from("profiles")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq("role", "teacher"),

      supabase
        .from("halaqat")
        .select("*", {
          count: "exact",
          head: true,
        }),

      supabase
        .from("mosques")
        .select("*", {
          count: "exact",
          head: true,
        }),

      supabase
        .from("attendance")
        .select("status")
        .eq("attendance_date", today),
    ]);

    setStats({
      students: students.count || 0,
      teachers: teachers.count || 0,
      halaqat: halaqat.count || 0,
      mosques: mosques.count || 0,
    });

    const rows =
      attendanceData.data || [];

    setAttendance({
      present: rows.filter(
        (x) => x.status === "present"
      ).length,

      absent: rows.filter(
        (x) => x.status === "absent"
      ).length,

      late: rows.filter(
        (x) => x.status === "late"
      ).length,

      excused: rows.filter(
        (x) => x.status === "excused"
      ).length,
    });
  }

  return (

    <AppPage>
<div className="responsive-container">
   <div
  style={{
    position: "relative",
    overflow: "hidden",
    borderRadius: "24px",
    marginBottom: "28px",
    background:
      "linear-gradient(135deg,#0F4C45,#0A2F2A)",
    padding: "28px 36px",
    boxShadow:
      "0 12px 35px rgba(15,76,69,.18)",
  }}
>
  {/* الزخرفة */}
  <img
    src="/assets/Z-6.png"
    alt=""
    style={{
      position: "absolute",
      left: "-40px",
      top: "-40px",
      width: "180px",
      opacity: 0.06,
      pointerEvents: "none",
    }}
  />

  <img
    src="/assets/Z-4.png"
    alt=""
    style={{
      position: "absolute",
      right: "-40px",
      bottom: "-40px",
      width: "180px",
      opacity: 0.06,
      pointerEvents: "none",
    }}
  />

  <div
    style={{
      position: "relative",
      zIndex: 2,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "20px",
      flexWrap: "wrap",
    }}
  >
    <div>
      <div
        style={{
          color: "#D4AF37",
          fontSize: "14px",
          fontWeight: "800",
          marginBottom: "8px",
        }}
      >
        مرحباً بك في
      </div>

      <h1
        style={{
          margin: 0,
          color: "#fff",
          fontSize: "38px",
          fontWeight: "900",
        }}
      >
        الصِّدِيق
      </h1>

      <div
        style={{
          marginTop: "8px",
          color: "rgba(255,255,255,.8)",
          fontSize: "15px",
        }}
      >
        منصة إدارة حلقات تحفيظ القرآن الكريم
      </div>
    </div>

    <div
      style={{
        background: "rgba(255,255,255,.08)",
        border: "1px solid rgba(255,255,255,.1)",
        backdropFilter: "blur(10px)",
        borderRadius: "18px",
        padding: "14px 18px",
        color: "#fff",
      }}
    >
      <div
        style={{
          fontSize: "13px",
          opacity: 0.8,
        }}
      >
        اليوم
      </div>

      <div
        style={{
          fontWeight: "800",
          marginTop: "4px",
        }}
      >
        {todayHijri}
      </div>
    </div>
  </div>
</div>
 <div
  style={{
    background: "#ffffff",
    border: "1px solid #d9e3da",
    borderRadius: "18px",
    padding: "18px 24px",
    marginBottom: "24px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
  }}
>
  <div>
    <h2
      style={{
        margin: 0,
        color: "#2F4F1E",
        fontSize: "28px",
        fontWeight: 800,
      }}
    >
      لوحة التحكم
    </h2>

    <p
      style={{
        margin: "6px 0 0",
        color: "#6B7280",
        fontSize: "14px",
      }}
    >
      متابعة شاملة للحلقات والطلاب والمعلمين والإحصائيات التشغيلية.
    </p>
  </div>

  <div
    style={{
      background:
        "linear-gradient(135deg,#556B2F,#7A8F3B)",
      color: "#D4AF37",
      padding: "12px 20px",
      borderRadius: "14px",
      fontWeight: 700,
      fontSize: "14px",
    }}
  >
    استكشف
  </div>
</div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(260px,1fr))",
          gap: 20,
        }}
      >
        <StatCard
          title="الطلاب"
          value={stats.students}
          icon={Users}
        />

        <StatCard
          title="المعلمين"
          value={stats.teachers}
          icon={GraduationCap}
        />

        <StatCard
          title="الحلقات"
          value={stats.halaqat}
          icon={BookOpen}
        />

        <StatCard
          title="المساجد"
          value={stats.mosques}
          icon={Building2}
        />
      </div>

      <SectionCard
        title="الحضور اليوم"
        subtitle="ملخص حضور الطلاب"
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(220px,1fr))",
            gap: 20,
          }}
        >
          <StatCard
            title="حاضر"
            value={attendance.present}
            icon={CheckCircle2}
          />

          <StatCard
            title="غائب"
            value={attendance.absent}
            icon={XCircle}
          />

          <StatCard
            title="متأخر"
            value={attendance.late}
            icon={Clock3}
          />

          <StatCard
            title="معتذر"
            value={attendance.excused}
            icon={Activity}
          />
        </div>
      </SectionCard>

      <SectionCard
        title="الوصول السريع"
        subtitle="أهم العمليات المستخدمة يومياً"
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(250px,1fr))",
            gap: 16,
          }}
        >
          <ActionCard
  title="إدارة الطلاب"
  description="عرض وإدارة الطلاب"
  icon={Users}
  onClick={() =>
    navigate("/admin/students")
  }
/>

<ActionCard
  title="إدارة المعلمين"
  description="عرض وإدارة المعلمين"
  icon={GraduationCap}
  onClick={() =>
    navigate("/admin/teachers")
  }
/>

<ActionCard
  title="إدارة الحلقات"
  description="عرض وإدارة الحلقات"
  icon={BookOpen}
  onClick={() =>
    navigate("/admin/halaqat")
  }
/>

<ActionCard
  title="الحضور والغياب"
  description="متابعة الحضور"
  icon={ClipboardCheck}
  onClick={() =>
    navigate("/admin/attendance")
  }
/>

<ActionCard
  title="التسميع اليومي"
  description="إدارة التسميع"
  icon={Mic2}
  onClick={() =>
    navigate("/admin/recitations")
  }
/>
        </div>
      </SectionCard>
    </div>
    </AppPage>
  );
}