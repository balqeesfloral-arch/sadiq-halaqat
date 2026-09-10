// src/layouts/TeacherLayout.jsx

import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  BookOpen,
  Gift,
  TrendingUp,
  ClipboardCheck,
  BellRing,
  BarChart3,
  UserCircle,
  Settings,
} from "lucide-react";

import {
  NavLink,
  Outlet,
} from "react-router-dom";

const menu = [
  {
    title: "الرئيسية",
    path: "/teacher",
    icon: LayoutDashboard,
  },
  {
    title: "طلابي",
    path: "/teacher/students",
    icon: Users,
  },
  {
    title: "الحضور",
    path: "/teacher/attendance",
    icon: CalendarCheck,
  },
  {
    title: "التسميع",
    path: "/teacher/recitations",
    icon: BookOpen,
  },
  {
    title: "المنح والخصومات",
    path: "/teacher/points",
    icon: Gift,
  },
  {
    title: "الإنجاز الشهري",
    path: "/teacher/monthly-achievement",
    icon: TrendingUp,
  },
  {
    title: "الاختبارات",
    path: "/teacher/exams",
    icon: ClipboardCheck,
  },
  {
    title: "الإشعارات",
    path: "/teacher/notifications",
    icon: BellRing,
  },
  {
    title: "التقارير",
    path: "/teacher/reports",
    icon: BarChart3,
  },
  {
    title: "الملف الشخصي",
    path: "/teacher/profile",
    icon: UserCircle,
  },
  {
    title: "الإعدادات",
    path: "/teacher/settings",
    icon: Settings,
  },
];

export default function TeacherLayout() {
  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "#F8FAFC",
      }}
    >
      <aside
        style={{
          width: "290px",
          background: "#FFFFFF",
          borderLeft: "1px solid #E5E7EB",
          padding: "24px",
          boxShadow:
            "0 10px 25px rgba(0,0,0,.05)",
        }}
      >
        <div
          style={{
            textAlign: "center",
            marginBottom: "30px",
          }}
        >
          <img
            src="/logo.png"
            alt=""
            style={{
              width: "90px",
            }}
          />

          <h2
            style={{
              color: "#0F5132",
              marginTop: "10px",
              marginBottom: "4px",
            }}
          >
            الصديق
          </h2>

          <div
            style={{
              color: "#64748B",
              fontSize: "13px",
            }}
          >
            بوابة المعلم
          </div>
        </div>

        {menu.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              style={({ isActive }) => ({
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "14px",
                borderRadius: "14px",
                marginBottom: "8px",
                textDecoration: "none",
                color: isActive
                  ? "#FFFFFF"
                  : "#374151",
                background: isActive
                  ? "#0F5132"
                  : "transparent",
                fontWeight: 600,
              })}
            >
              <Icon size={20} />
              {item.title}
            </NavLink>
          );
        })}
      </aside>

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <header
          style={{
            background: "#FFFFFF",
            padding: "20px 32px",
            borderBottom:
              "1px solid #E5E7EB",
          }}
        >
          <div
            style={{
              fontSize: "22px",
              fontWeight: "700",
              color: "#0F5132",
            }}
          >
            السلام عليكم
          </div>

          <div
            style={{
              color: "#64748B",
              marginTop: "4px",
            }}
          >
            مرحباً بك في لوحة المعلم
          </div>
        </header>

        <main
          style={{
            flex: 1,
            padding: "32px",
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}