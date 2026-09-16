import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import AppPage from "../components/AppPage";

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
  FileCheck,
  Trophy,
  BarChart3,
  Gift,
  ArrowUpLeft,
  Sparkles,
  UserRoundCheck,
} from "lucide-react";

/* =========================================================
   Helpers
========================================================= */

function formatHijri(date) {
  try {
    return new Intl.DateTimeFormat(
      "ar-SA-u-ca-islamic-umalqura",
      {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    ).format(date);
  } catch {
    return "";
  }
}

function formatGregorian(date) {
  try {
    return new Intl.DateTimeFormat(
      "ar-SA-u-ca-gregory",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    ).format(date);
  } catch {
    return "";
  }
}

function percent(value, total) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

function average(values = []) {
  if (!values.length) return 0;
  return Math.round(
    values.reduce((sum, item) => sum + Number(item || 0), 0) /
      values.length
  );
}

function LanternIcon() {
  return (
    <svg
      width="24"
      height="34"
      viewBox="0 0 24 34"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M9 3H15"
        stroke="#D4AF37"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M12 3V7"
        stroke="#D4AF37"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M7 8H17L16 12V24L12 29L8 24V12L7 8Z"
        fill="rgba(212,175,55,.15)"
        stroke="#D4AF37"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M8 12H16"
        stroke="#D4AF37"
        strokeWidth="1.4"
      />
      <path
        d="M9.5 15.5H14.5V21.5H9.5V15.5Z"
        fill="#D4AF37"
        fillOpacity="0.35"
        stroke="#D4AF37"
        strokeWidth="1.1"
      />
    </svg>
  );
}

function CrescentIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M18.6 5.2C16.8 4.6 14.8 4.5 12.9 5.1C8 6.6 5.2 11.8 6.8 16.7C8.4 21.6 13.6 24.3 18.5 22.7C20.6 22 22.3 20.7 23.5 19.1C21.7 19.7 19.7 19.8 17.8 19.2C12.9 17.6 10.2 12.4 11.8 7.5C12.3 6 13.2 4.7 14.3 3.7C15.8 3.8 17.3 4.3 18.6 5.2Z"
        fill="rgba(212,175,55,.24)"
        stroke="#D4AF37"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 22 22"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M11 2.7L12.9 8.1L18.7 8.3L14 11.8L15.7 17.3L11 13.9L6.3 17.3L8 11.8L3.3 8.3L9.1 8.1L11 2.7Z"
        fill="rgba(212,175,55,.24)"
        stroke="#D4AF37"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CornerOrnament({ top, right, bottom, left, rotate = 0 }) {
  return (
    <div
      style={{
        position: "absolute",
        top,
        right,
        bottom,
        left,
        opacity: 0.18,
        pointerEvents: "none",
        transform: `rotate(${rotate}deg)`,
      }}
    >
      <svg
        width="150"
        height="150"
        viewBox="0 0 150 150"
        fill="none"
      >
        <path
          d="M8 60C28 60 44 44 44 24V8"
          stroke="#D4AF37"
          strokeWidth="2"
        />
        <path
          d="M20 60C38 60 52 46 52 28V20"
          stroke="#D4AF37"
          strokeWidth="1.5"
        />
        <path
          d="M8 84C28 84 44 100 44 120V136"
          stroke="#D4AF37"
          strokeWidth="2"
        />
        <circle
          cx="44"
          cy="44"
          r="8"
          stroke="#D4AF37"
          strokeWidth="2"
        />
        <circle
          cx="68"
          cy="44"
          r="5"
          stroke="#D4AF37"
          strokeWidth="1.6"
        />
        <path
          d="M44 36L48 44L44 52L40 44L44 36Z"
          fill="#D4AF37"
          fillOpacity=".3"
        />
      </svg>
    </div>
  );
}

function HangingDecoration({
  left,
  top = 0,
  type = "lantern",
}) {
  return (
    <div
      style={{
        position: "absolute",
        top,
        left,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "6px",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          width: "1.5px",
          height: "36px",
          background:
            "linear-gradient(180deg,rgba(212,175,55,.9),rgba(212,175,55,.25))",
        }}
      />

      <div
        style={{
          width: "40px",
          height: "40px",
          borderRadius: "999px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(255,255,255,.05)",
          border: "1px solid rgba(212,175,55,.18)",
          boxShadow: "0 8px 20px rgba(0,0,0,.08)",
        }}
      >
        {type === "lantern" ? (
          <LanternIcon />
        ) : type === "crescent" ? (
          <CrescentIcon />
        ) : (
          <StarIcon />
        )}
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon: Icon,
  color,
  subtitle,
  note,
}) {
  return (
    <div className="dashboard-metric-card">
      <div
        className="dashboard-metric-topline"
        style={{ background: color }}
      />

      <div className="dashboard-metric-head">
        <div>
          <div className="dashboard-metric-title">
            {title}
          </div>

          <div className="dashboard-metric-subtitle">
            {subtitle}
          </div>
        </div>

        <div
          className="dashboard-metric-icon"
          style={{
            color,
            background: `${color}14`,
            border: `1px solid ${color}20`,
          }}
        >
          <Icon size={22} />
        </div>
      </div>

      <div
        className="dashboard-metric-value"
        style={{ color }}
      >
        {value}
      </div>

      <div className="dashboard-metric-note">
        {note}
      </div>
    </div>
  );
}

function StatusCard({
  title,
  value,
  color,
  icon: Icon,
}) {
  return (
    <div className="dashboard-status-card">
      <div
        className="dashboard-status-icon"
        style={{
          color,
          background: `${color}15`,
          border: `1px solid ${color}22`,
        }}
      >
        <Icon size={18} />
      </div>

      <div className="dashboard-status-copy">
        <span>{title}</span>
        <strong style={{ color }}>
          {value}
        </strong>
      </div>
    </div>
  );
}

function HealthIndicator({
  title,
  value,
  color,
  description,
}) {
  return (
    <div className="dashboard-health-card">
      <div className="dashboard-health-head">
        <strong>{title}</strong>
        <span style={{ color }}>
          {value}%
        </span>
      </div>

      <div className="dashboard-health-bar">
        <div
          className="dashboard-health-bar-fill"
          style={{
            width: `${Math.max(
              0,
              Math.min(100, value)
            )}%`,
            background: color,
          }}
        />
      </div>

      <div className="dashboard-health-description">
        {description}
      </div>
    </div>
  );
}

function QuickActionCard({
  title,
  description,
  icon: Icon,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="dashboard-action-card"
    >
      <div className="dashboard-action-icon">
        <Icon size={20} />
      </div>

      <div className="dashboard-action-copy">
        <strong>{title}</strong>
        <span>{description}</span>
      </div>

      <div className="dashboard-action-arrow">
        <ArrowUpLeft size={18} />
      </div>
    </button>
  );
}

/* =========================================================
   Page
========================================================= */

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [loading, setLoading] =
    useState(true);

  const [overview, setOverview] =
    useState({
      students: 0,
      teachers: 0,
      halaqat: 0,
      activeHalaqat: 0,
      mosques: 0,
      recitationsToday: 0,
      scheduledExams: 0,
      pointsToday: 0,
      monthlyApproved: 0,
      monthlyTotal: 0,
    });

  const [attendance, setAttendance] =
    useState({
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
      total: 0,
    });

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      setLoading(true);

      const now = new Date();
      const today = now
        .toISOString()
        .split("T")[0];

      const monthStartDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        1
      );

      const nextMonthStartDate = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        1
      );

      const monthStart = monthStartDate
        .toISOString()
        .split("T")[0];

      const nextMonthStart =
        nextMonthStartDate
          .toISOString()
          .split("T")[0];

      const [
        studentsRes,
        teachersRes,
        halaqatRes,
        activeHalaqatRes,
        mosquesRes,
        attendanceRes,
        recitationsTodayRes,
        scheduledExamsRes,
        pointsTodayRes,
        monthlyProgressRes,
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
          .from("halaqat")
          .select("*", {
            count: "exact",
            head: true,
          })
          .eq("status", "active"),

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

        supabase
          .from("recitations")
          .select("*", {
            count: "exact",
            head: true,
          })
          .eq("recitation_date", today),

        supabase
          .from("exams")
          .select("*", {
            count: "exact",
            head: true,
          })
          .eq("status", "scheduled"),

        supabase
          .from("points_transactions")
          .select("*", {
            count: "exact",
            head: true,
          })
          .eq("transaction_date", today),

        supabase
          .from("monthly_progress")
          .select("id,approved")
          .gte("progress_month", monthStart)
          .lt("progress_month", nextMonthStart),
      ]);

      const attendanceRows =
        attendanceRes.data || [];

      const monthlyRows =
        monthlyProgressRes.data || [];

      const present =
        attendanceRows.filter(
          (x) => x.status === "present"
        ).length;

      const absent =
        attendanceRows.filter(
          (x) => x.status === "absent"
        ).length;

      const late =
        attendanceRows.filter(
          (x) => x.status === "late"
        ).length;

      const excused =
        attendanceRows.filter(
          (x) => x.status === "excused"
        ).length;

      const monthlyApproved =
        monthlyRows.filter(
          (x) => x.approved === true
        ).length;

      setOverview({
        students:
          studentsRes.count || 0,
        teachers:
          teachersRes.count || 0,
        halaqat:
          halaqatRes.count || 0,
        activeHalaqat:
          activeHalaqatRes.count || 0,
        mosques:
          mosquesRes.count || 0,
        recitationsToday:
          recitationsTodayRes.count || 0,
        scheduledExams:
          scheduledExamsRes.count || 0,
        pointsToday:
          pointsTodayRes.count || 0,
        monthlyApproved,
        monthlyTotal:
          monthlyRows.length || 0,
      });

      setAttendance({
        present,
        absent,
        late,
        excused,
        total:
          attendanceRows.length || 0,
      });
    } catch (error) {
      console.error(
        "Dashboard error:",
        error
      );
    } finally {
      setLoading(false);
    }
  }

  const todayHijri = formatHijri(
    new Date()
  );
  const todayGregorian =
    formatGregorian(new Date());

  const attendanceRate = percent(
    attendance.present,
    attendance.total
  );

  const recitationCoverage =
    percent(
      overview.recitationsToday,
      overview.students
    );

  const halaqatVitality = percent(
    overview.activeHalaqat,
    overview.halaqat
  );

  const monthlyCompletionRate =
    percent(
      overview.monthlyApproved,
      overview.monthlyTotal
    );

  const dashboardVitalIndex =
    average([
      attendanceRate,
      recitationCoverage,
      halaqatVitality,
      monthlyCompletionRate,
    ]);

  const quickActions = useMemo(
    () => [
      {
        title: "الطلاب",
        description:
          "إدارة بيانات الطلاب ومتابعتهم",
        icon: Users,
        path: "/admin/students",
      },
      {
        title: "المعلمون",
        description:
          "عرض المعلمين وربطهم بالحلقات",
        icon: GraduationCap,
        path: "/admin/teachers",
      },
      {
        title: "طلبات الالتحاق",
        description:
          "اعتماد طلبات المعلمين والطلاب",
        icon: UserRoundCheck,
        path: "/admin/join-requests",
      },
      {
        title: "الحلقات",
        description:
          "إدارة الحلقات ومواعيدها",
        icon: BookOpen,
        path: "/admin/halaqat",
      },
      {
        title: "الحضور",
        description:
          "متابعة الحضور والغياب اليومي",
        icon: ClipboardCheck,
        path: "/admin/attendance",
      },
      {
        title: "التسميع",
        description:
          "إدارة سجلات التسميع والمراجعة",
        icon: Mic2,
        path: "/admin/recitations",
      },
      {
        title: "الاختبارات",
        description:
          "الاختبارات والنتائج والاعتماد",
        icon: FileCheck,
        path: "/admin/exams",
      },
      {
        title: "الإنجاز الشهري",
        description:
          "متابعة الإنجاز الفعلي للطلاب",
        icon: Trophy,
        path: "/admin/monthly-achievement",
      },
      {
        title: "النقاط",
        description:
          "إدارة المنح والخصومات",
        icon: Gift,
        path: "/admin/points-transactions",
      },
      {
        title: "التقارير",
        description:
          "تقارير تشغيلية وإدارية",
        icon: BarChart3,
        path: "/admin/reports",
      },
    ],
    []
  );

  return (
    <AppPage>
      <div
        className="supervisor-dashboard"
        dir="rtl"
      >
        {/* HERO */}
        <section className="supervisor-hero">
          <CornerOrnament
            top="-8px"
            right="-8px"
          />

          <CornerOrnament
            bottom="-8px"
            left="-8px"
            rotate={180}
          />

          <HangingDecoration
            left="8%"
            type="lantern"
          />

          <HangingDecoration
            left="16%"
            type="crescent"
            top={10}
          />

          <HangingDecoration
            left="24%"
            type="star"
            top={4}
          />

          <div className="supervisor-hero-grid">
            <div className="supervisor-hero-content">
              <div className="supervisor-hero-badge">
                <Sparkles size={16} />
                لوحة إشراف احترافية
              </div>

              <h1 className="supervisor-hero-title">
                لوحة التحكم
              </h1>

              <p className="supervisor-hero-text">
                متابعة تشغيلية متقدمة للحلقات
                والطلاب والمعلمين والاختبارات
                والتسميع والإنجاز الشهري من
                واجهة واحدة واضحة وسريعة.
              </p>

              <div className="supervisor-hero-tags">
                <span>
                  متابعة يومية
                </span>
                <span>
                  مؤشرات حيوية
                </span>
                <span>
                  تقارير مباشرة
                </span>
              </div>
            </div>

            <div className="supervisor-hero-side">
              <div className="supervisor-date-card">
                <span>تاريخ اليوم</span>
                <strong>
                  {todayHijri}
                </strong>
                <small>
                  {todayGregorian}
                </small>
              </div>

              <div className="supervisor-vital-card">
                <div className="supervisor-vital-head">
                  <span>
                    المؤشر الحيوي
                  </span>
                  <strong>
                    {loading
                      ? "..."
                      : `${dashboardVitalIndex}%`}
                  </strong>
                </div>

                <div className="supervisor-vital-bar">
                  <div
                    className="supervisor-vital-fill"
                    style={{
                      width: `${dashboardVitalIndex}%`,
                    }}
                  />
                </div>

                <p>
                  يعكس مستوى النشاط العام
                  بناءً على الحضور والتسميع
                  والإنجاز الشهري وحيوية
                  الحلقات.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* OVERVIEW STATS */}
        <section className="dashboard-section">
          <div className="dashboard-section-head">
            <div>
              <h2>
                الإحصائيات الرئيسية
              </h2>
              <p>
                نظرة سريعة على أهم مؤشرات
                النظام
              </p>
            </div>
          </div>

          <div className="dashboard-grid metrics-4">
            <MetricCard
              title="الطلاب"
              value={
                loading
                  ? "..."
                  : overview.students
              }
              icon={Users}
              color="#2563EB"
              subtitle="إجمالي الطلاب"
              note="قاعدة المستفيدين من الحلقات"
            />

            <MetricCard
              title="المعلمون"
              value={
                loading
                  ? "..."
                  : overview.teachers
              }
              icon={GraduationCap}
              color="#0F766E"
              subtitle="إجمالي المعلمين"
              note="الكادر التعليمي المرتبط بالنظام"
            />

            <MetricCard
              title="الحلقات"
              value={
                loading
                  ? "..."
                  : overview.halaqat
              }
              icon={BookOpen}
              color="#7C3AED"
              subtitle="إجمالي الحلقات"
              note={`النشط منها: ${overview.activeHalaqat}`}
            />

            <MetricCard
              title="المساجد"
              value={
                loading
                  ? "..."
                  : overview.mosques
              }
              icon={Building2}
              color="#B45309"
              subtitle="المواقع التابعة"
              note="المساجد المسجلة داخل النظام"
            />
          </div>
        </section>

        {/* ACTIVITY STATS */}
        <section className="dashboard-section">
          <div className="dashboard-section-head">
            <div>
              <h2>
                النشاط اليومي والتشغيلي
              </h2>
              <p>
                مؤشرات مرتبطة بالصفحات التي
                تم بناؤها في النظام
              </p>
            </div>
          </div>

          <div className="dashboard-grid metrics-4">
            <MetricCard
              title="الحضور اليوم"
              value={
                loading
                  ? "..."
                  : attendance.total
              }
              icon={ClipboardCheck}
              color="#0F766E"
              subtitle="سجلات الحضور"
              note="إجمالي الطلاب الذين تم التعامل مع حضورهم اليوم"
            />

            <MetricCard
              title="التسميع اليوم"
              value={
                loading
                  ? "..."
                  : overview.recitationsToday
              }
              icon={Mic2}
              color="#0891B2"
              subtitle="سجلات التسميع"
              note="عدد سجلات التسميع المسجلة اليوم"
            />

            <MetricCard
              title="اختبارات مجدولة"
              value={
                loading
                  ? "..."
                  : overview.scheduledExams
              }
              icon={FileCheck}
              color="#DC2626"
              subtitle="الحالة: مجدول"
              note="عدد الاختبارات الجاهزة أو المعلقة"
            />

            <MetricCard
              title="عمليات النقاط"
              value={
                loading
                  ? "..."
                  : overview.pointsToday
              }
              icon={Gift}
              color="#16A34A"
              subtitle="عمليات اليوم"
              note="منح وخصومات مسجلة خلال اليوم"
            />
          </div>
        </section>

        {/* ATTENDANCE STATUS */}
        <section className="dashboard-section">
          <div className="dashboard-section-head">
            <div>
              <h2>ملخص الحضور اليوم</h2>
              <p>
                توزيع مباشر لحالة الطلاب في
                سجلات الحضور
              </p>
            </div>
          </div>

          <div className="dashboard-grid status-4">
            <StatusCard
              title="حاضر"
              value={
                loading
                  ? "..."
                  : attendance.present
              }
              color="#16A34A"
              icon={CheckCircle2}
            />

            <StatusCard
              title="غائب"
              value={
                loading
                  ? "..."
                  : attendance.absent
              }
              color="#DC2626"
              icon={XCircle}
            />

            <StatusCard
              title="متأخر"
              value={
                loading
                  ? "..."
                  : attendance.late
              }
              color="#D97706"
              icon={Clock3}
            />

            <StatusCard
              title="معتذر"
              value={
                loading
                  ? "..."
                  : attendance.excused
              }
              color="#6366F1"
              icon={Activity}
            />
          </div>
        </section>

        {/* HEALTH INDICATORS */}
        <section className="dashboard-section">
          <div className="dashboard-section-head">
            <div>
              <h2>
                المؤشرات الحيوية
              </h2>
              <p>
                قراءة أداء سريعة تساعد المشرف
                على اتخاذ القرار
              </p>
            </div>

            <div className="dashboard-vital-badge">
              {dashboardVitalIndex}%
            </div>
          </div>

          <div className="dashboard-grid health-4">
            <HealthIndicator
              title="نسبة الحضور"
              value={attendanceRate}
              color="#16A34A"
              description="كلما ارتفعت دلّ ذلك على انتظام أكبر لدى الطلاب."
            />

            <HealthIndicator
              title="تغطية التسميع"
              value={recitationCoverage}
              color="#0891B2"
              description="تقيس نسبة التسميعات المسجلة مقارنة بعدد الطلاب."
            />

            <HealthIndicator
              title="حيوية الحلقات"
              value={halaqatVitality}
              color="#7C3AED"
              description="تقيس نسبة الحلقات النشطة من إجمالي الحلقات."
            />

            <HealthIndicator
              title="الإنجاز الشهري"
              value={monthlyCompletionRate}
              color="#D97706"
              description="تقيس نسبة السجلات المعتمدة في الإنجاز الشهري لهذا الشهر."
            />
          </div>
        </section>

        {/* QUICK ACTIONS */}
        <section className="dashboard-section">
          <div className="dashboard-section-head">
            <div>
              <h2>الوصول السريع</h2>
              <p>
                أهم الصفحات المستخدمة يوميًا
              </p>
            </div>
          </div>

          <div className="dashboard-grid actions-3">
            {quickActions.map((item) => (
              <QuickActionCard
                key={item.path}
                title={item.title}
                description={
                  item.description
                }
                icon={item.icon}
                onClick={() =>
                  navigate(item.path)
                }
              />
            ))}
          </div>
        </section>
      </div>

      <style>
        {`
          .supervisor-dashboard {
            display: grid;
            gap: 24px;
          }

          .dashboard-section {
            display: grid;
            gap: 16px;
          }

          .dashboard-section-head {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 14px;
            flex-wrap: wrap;
          }

          .dashboard-section-head h2 {
            margin: 0;
            color: #0F172A;
            font-size: 24px;
            font-weight: 900;
          }

          .dashboard-section-head p {
            margin: 6px 0 0;
            color: #64748B;
            font-size: 14px;
          }

          .dashboard-grid {
            display: grid;
            gap: 18px;
          }

          .metrics-4,
          .status-4,
          .health-4 {
            grid-template-columns: repeat(auto-fit,minmax(240px,1fr));
          }

          .actions-3 {
            grid-template-columns: repeat(auto-fit,minmax(260px,1fr));
          }

          /* HERO */

          .supervisor-hero {
            position: relative;
            overflow: hidden;
            border-radius: 28px;
            background:
              linear-gradient(135deg,#0F4C45 0%,#0A2F2A 100%);
            border: 1px solid rgba(255,255,255,.06);
            box-shadow:
              0 22px 55px rgba(15,76,69,.18);
            padding: 30px;
          }

          .supervisor-hero::after {
            content: "";
            position: absolute;
            inset: 0;
            opacity: .06;
            pointer-events: none;
            background-image:
              radial-gradient(circle,#D4AF37 1.2px,transparent 1.2px);
            background-size: 28px 28px;
          }

          .supervisor-hero-grid {
            position: relative;
            z-index: 2;
            display: grid;
            grid-template-columns: 1.4fr .8fr;
            gap: 24px;
            align-items: center;
            min-height: 220px;
          }

          .supervisor-hero-content {
            display: flex;
            flex-direction: column;
            gap: 14px;
          }

          .supervisor-hero-badge {
            width: fit-content;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: rgba(255,255,255,.08);
            color: #F8E7AF;
            border: 1px solid rgba(212,175,55,.22);
            border-radius: 999px;
            padding: 10px 16px;
            font-size: 13px;
            font-weight: 800;
          }

          .supervisor-hero-title {
            margin: 0;
            color: #FFFFFF;
            font-size: 42px;
            font-weight: 950;
            line-height: 1.1;
          }

          .supervisor-hero-text {
            margin: 0;
            max-width: 760px;
            color: rgba(255,255,255,.82);
            font-size: 16px;
            line-height: 2;
          }

          .supervisor-hero-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-top: 4px;
          }

          .supervisor-hero-tags span {
            padding: 8px 14px;
            border-radius: 999px;
            background: rgba(255,255,255,.07);
            border: 1px solid rgba(255,255,255,.08);
            color: #F8FAFC;
            font-size: 13px;
            font-weight: 700;
          }

          .supervisor-hero-side {
            display: grid;
            gap: 16px;
          }

          .supervisor-date-card,
          .supervisor-vital-card {
            background: rgba(255,255,255,.08);
            border: 1px solid rgba(255,255,255,.10);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 18px;
          }

          .supervisor-date-card span,
          .supervisor-vital-head span {
            display: block;
            color: #F2DE9E;
            font-size: 13px;
            font-weight: 800;
            margin-bottom: 8px;
          }

          .supervisor-date-card strong {
            display: block;
            color: #FFFFFF;
            font-size: 18px;
            font-weight: 900;
            line-height: 1.8;
          }

          .supervisor-date-card small {
            display: block;
            margin-top: 8px;
            color: rgba(255,255,255,.75);
            font-size: 13px;
          }

          .supervisor-vital-head {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
          }

          .supervisor-vital-head strong {
            color: #FFFFFF;
            font-size: 32px;
            font-weight: 950;
          }

          .supervisor-vital-bar {
            width: 100%;
            height: 10px;
            background: rgba(255,255,255,.10);
            border-radius: 999px;
            overflow: hidden;
            margin: 14px 0 12px;
          }

          .supervisor-vital-fill {
            height: 100%;
            border-radius: 999px;
            background:
              linear-gradient(90deg,#D4AF37,#F3D97A);
          }

          .supervisor-vital-card p {
            margin: 0;
            color: rgba(255,255,255,.78);
            font-size: 13px;
            line-height: 1.9;
          }

          /* METRIC CARDS */

          .dashboard-metric-card {
            position: relative;
            overflow: hidden;
            background: #FFFFFF;
            border: 1px solid #E8EEF0;
            border-radius: 24px;
            padding: 22px;
            box-shadow:
              0 12px 35px rgba(15,23,42,.05);
          }

          .dashboard-metric-topline {
            position: absolute;
            top: 0;
            right: 0;
            left: 0;
            height: 4px;
          }

          .dashboard-metric-head {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 14px;
          }

          .dashboard-metric-title {
            color: #0F172A;
            font-size: 15px;
            font-weight: 900;
          }

          .dashboard-metric-subtitle {
            margin-top: 6px;
            color: #64748B;
            font-size: 13px;
          }

          .dashboard-metric-icon {
            width: 54px;
            height: 54px;
            border-radius: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .dashboard-metric-value {
            margin-top: 18px;
            font-size: 38px;
            font-weight: 950;
            letter-spacing: -1px;
            line-height: 1;
          }

          .dashboard-metric-note {
            margin-top: 12px;
            color: #64748B;
            font-size: 13px;
            line-height: 1.8;
          }

          /* STATUS */

          .dashboard-status-card {
            background: #FFFFFF;
            border: 1px solid #E8EEF0;
            border-radius: 22px;
            padding: 18px;
            display: flex;
            align-items: center;
            gap: 14px;
            box-shadow:
              0 8px 25px rgba(15,23,42,.04);
          }

          .dashboard-status-icon {
            width: 48px;
            height: 48px;
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .dashboard-status-copy {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }

          .dashboard-status-copy span {
            color: #64748B;
            font-size: 14px;
            font-weight: 700;
          }

          .dashboard-status-copy strong {
            font-size: 28px;
            font-weight: 950;
            line-height: 1;
          }

          /* HEALTH */

          .dashboard-vital-badge {
            min-width: 86px;
            height: 44px;
            border-radius: 14px;
            background:
              linear-gradient(135deg,#0F766E,#115E59);
            color: #FFFFFF;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 17px;
            font-weight: 900;
            box-shadow:
              0 10px 24px rgba(15,118,110,.22);
          }

          .dashboard-health-card {
            background: #FFFFFF;
            border: 1px solid #E8EEF0;
            border-radius: 22px;
            padding: 20px;
            box-shadow:
              0 8px 24px rgba(15,23,42,.04);
          }

          .dashboard-health-head {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            margin-bottom: 14px;
          }

          .dashboard-health-head strong {
            color: #0F172A;
            font-size: 15px;
            font-weight: 900;
          }

          .dashboard-health-head span {
            font-size: 18px;
            font-weight: 900;
          }

          .dashboard-health-bar {
            width: 100%;
            height: 10px;
            border-radius: 999px;
            background: #EEF2F7;
            overflow: hidden;
          }

          .dashboard-health-bar-fill {
            height: 100%;
            border-radius: 999px;
          }

          .dashboard-health-description {
            margin-top: 12px;
            color: #64748B;
            font-size: 13px;
            line-height: 1.8;
          }

          /* ACTIONS */

          .dashboard-action-card {
            width: 100%;
            border: 1px solid #E8EEF0;
            background: #FFFFFF;
            border-radius: 22px;
            padding: 18px;
            display: flex;
            align-items: center;
            gap: 14px;
            text-align: right;
            cursor: pointer;
            box-shadow:
              0 10px 26px rgba(15,23,42,.04);
            transition:
              transform .18s ease,
              box-shadow .18s ease,
              border-color .18s ease;
          }

          .dashboard-action-card:hover {
            transform: translateY(-3px);
            border-color: #CFE1D6;
            box-shadow:
              0 18px 34px rgba(15,23,42,.07);
          }

          .dashboard-action-icon {
            width: 50px;
            height: 50px;
            flex: 0 0 50px;
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #0F766E;
            background: #ECFDF5;
            border: 1px solid #D1FAE5;
          }

          .dashboard-action-copy {
            min-width: 0;
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 5px;
          }

          .dashboard-action-copy strong {
            color: #0F172A;
            font-size: 15px;
            font-weight: 900;
          }

          .dashboard-action-copy span {
            color: #64748B;
            font-size: 13px;
            line-height: 1.8;
          }

          .dashboard-action-arrow {
            color: #94A3B8;
          }

          /* RESPONSIVE */

          @media (max-width: 1100px) {
            .supervisor-hero-grid {
              grid-template-columns: 1fr;
            }
          }

          @media (max-width: 768px) {
            .supervisor-hero {
              padding: 22px 18px;
              border-radius: 22px;
            }

            .supervisor-hero-title {
              font-size: 30px;
            }

            .supervisor-hero-text {
              font-size: 14px;
              line-height: 1.9;
            }

            .dashboard-section-head h2 {
              font-size: 20px;
            }

            .dashboard-metric-value {
              font-size: 30px;
            }

            .dashboard-status-copy strong {
              font-size: 24px;
            }

            .dashboard-vital-badge {
              width: 100%;
            }
          }

          @media (max-width: 520px) {
            .supervisor-hero-tags {
              gap: 8px;
            }

            .supervisor-hero-tags span {
              font-size: 12px;
              padding: 7px 12px;
            }

            .dashboard-action-card {
              padding: 16px;
            }
          }
        `}
      </style>
    </AppPage>
  );
}