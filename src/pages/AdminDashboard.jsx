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
   <div
  style={{
    position: "relative",
    overflow: "hidden",
    borderRadius: "32px",
    marginBottom: "32px",
    background:
      "linear-gradient(135deg,#0F4C45 0%,#0A2F2A 100%)",
    boxShadow:
      "0 25px 50px rgba(15,76,69,.25)"
  }}
>
  <div
  style={{
    position:"absolute",
    inset:0,
    opacity:0.08,
    pointerEvents:"none"
  }}
>
  <svg
    width="100%"
    height="100%"
    preserveAspectRatio="none"
    viewBox="0 0 1200 400"
  >
    <defs>
      <pattern
        id="islamicPattern"
        width="120"
        height="120"
        patternUnits="userSpaceOnUse"
      >
        <path
          d="
          M60 0
          L75 45
          L120 60
          L75 75
          L60 120
          L45 75
          L0 60
          L45 45
          Z
          "
          fill="none"
          stroke="#D4AF37"
          strokeWidth="1"
        />

        <circle
          cx="60"
          cy="60"
          r="25"
          fill="none"
          stroke="#D4AF37"
          strokeWidth="1"
        />
      </pattern>
    </defs>

    <rect
      width="100%"
      height="100%"
      fill="url(#islamicPattern)"
    />
  </svg>
</div>

  <div
    style={{
      display: "grid",
      gridTemplateColumns: "420px 1fr",
      minHeight: "340px",
      position: "relative",
      zIndex: 2
    }}
  >
    {/* جهة الصورة */}
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        padding: "20px"
      }}
    >
      <img
        src="/hero-mosque.png"
        alt="مسجد"
        style={{
          width: "100%",
          maxWidth: "380px",
          objectFit: "contain"
        }}
      />
    </div>

    {/* جهة النص */}
    <div
      style={{
        padding: "60px 70px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        textAlign: "right"
      }}
    >
      <h1
        style={{
          margin: 0,
          fontSize: "72px",
          fontWeight: "900",
          color: "#D4AF37",
          lineHeight: 1
        }}
      >
        الصِّدِيق
      </h1>

      <div
        style={{
          marginTop: "20px",
          fontSize: "30px",
          fontWeight: "800",
          color: "#FFFFFF"
        }}
      >
        منصة متكاملة لإدارة حلقات تحفيظ القرآن الكريم
      </div>

      <div
        style={{
          width: "140px",
          height: "5px",
          borderRadius: "999px",
          background: "#D4AF37",
          marginTop: "20px",
          marginBottom: "20px"
        }}
      />

      <p
        style={{
          margin: 0,
          color: "rgba(255,255,255,.88)",
          fontSize: "18px",
          lineHeight: "2"
        }}
      >
        نظام مركزي متطور لإدارة المساجد والحلقات
        والمعلمين والطلاب والحضور والتسميع
        والاختبارات والتقارير التشغيلية من
        لوحة تحكم موحدة.
      </p>
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
    </AppPage>
  );
}