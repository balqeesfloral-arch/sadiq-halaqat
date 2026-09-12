// src/layouts/TeacherLayout.jsx

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  NavLink,
  Outlet,
  useLocation,
} from "react-router-dom";

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
  Menu,
  X,
  ChevronLeft,
  PanelRightClose,
  PanelRightOpen,
  Layers3,
  Sparkles,
ClipboardList,
HeartHandshake,
} from "lucide-react";

import { supabase } from "../lib/supabase";

import ResponsiveContainer
  from "../components/ResponsiveContainer";

/* =========================================================
   القائمة
========================================================= */

const menuSections = [
  {
    title: "الرئيسية",
    items: [
      {
        title: "لوحة المعلم",
        path: "/teacher",
        icon: LayoutDashboard,
        end: true,
      },
    ],
  },

  {
    title: "الحلقات والطلاب",
    items: [
      {
        title: "حلقاتي",
        path: "/teacher/halaqat",
        icon: Layers3,
      },
      {
        title: "طلابي",
        path: "/teacher/students",
        icon: Users,
      },
    ],
  },

  {
    title: "المتابعة اليومية",
    items: [
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
    ],
  },

  {
    title: "التطوير والتحفيز",
    items: [
      {
        title: "المنح والخصومات",
        path: "/teacher/points",
        icon: Gift,
      },
{
  title: "الخطة الشهرية",
  path: "/teacher/monthly-plan",
  icon: ClipboardList,
},
      {
        title: "الإنجاز الشهري",
        path:
          "/teacher/monthly-achievement",
        icon: TrendingUp,
      },
      {
        title: "الاختبارات",
        path: "/teacher/exams",
        icon: ClipboardCheck,
      },
    ],
  },

  {
    title: "المتابعة والتقارير",
    items: [
   {
  title: "العناية بالطلاب",
  path: "/teacher/notifications",
  icon: HeartHandshake,
},
      {
        title: "التقارير",
        path: "/teacher/reports",
        icon: BarChart3,
      },
    ],
  },

  {
    title: "الحساب",
    items: [
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
    ],
  },
];

/* =========================================================
   Helpers
========================================================= */

const allMenuItems =
  menuSections.flatMap(
    (section) =>
      section.items
  );

function getCurrentPage(
  pathname
) {
  const exact =
    allMenuItems.find(
      (item) =>
        item.end &&
        pathname === item.path
    );

  if (exact) {
    return exact;
  }

  const matches =
    allMenuItems
      .filter(
        (item) =>
          !item.end &&
          pathname.startsWith(
            item.path
          )
      )
      .sort(
        (a, b) =>
          b.path.length -
          a.path.length
      );

  return (
    matches[0] || {
      title: "بوابة المعلم",
      icon: LayoutDashboard,
    }
  );
}

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

const todayGregorian =
  new Intl.DateTimeFormat(
    "ar-SA",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  ).format(new Date());

/* =========================================================
   Layout
========================================================= */

export default function TeacherLayout() {
  const location =
    useLocation();

  const [
    collapsed,
    setCollapsed,
  ] = useState(() => {
    return (
      localStorage.getItem(
        "teacherSidebarCollapsed"
      ) === "true"
    );
  });

  const [
    mobileOpen,
    setMobileOpen,
  ] = useState(false);

  const [
    teacher,
    setTeacher,
  ] = useState(null);

  /* =====================================================
     الصفحة الحالية
  ===================================================== */

  const currentPage =
    useMemo(
      () =>
        getCurrentPage(
          location.pathname
        ),
      [location.pathname]
    );

  const CurrentPageIcon =
    currentPage.icon;

  /* =====================================================
     حفظ حالة السايدبار
  ===================================================== */

  useEffect(() => {
    localStorage.setItem(
      "teacherSidebarCollapsed",
      String(collapsed)
    );
  }, [collapsed]);

  /* =====================================================
     إغلاق Drawer عند تغيير الصفحة
  ===================================================== */

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  /* =====================================================
     منع Scroll خلف القائمة في الجوال
  ===================================================== */

  useEffect(() => {
    if (!mobileOpen) {
      document.body.style.overflow =
        "";
      return;
    }

    document.body.style.overflow =
      "hidden";

    return () => {
      document.body.style.overflow =
        "";
    };
  }, [mobileOpen]);

  /* =====================================================
     بيانات المعلم
  ===================================================== */

  useEffect(() => {
    loadTeacher();
  }, []);

  async function loadTeacher() {
    try {
      const {
        data: authData,
      } =
        await supabase.auth.getUser();

      const user =
        authData?.user;

      if (!user) {
        return;
      }

      const {
        data,
        error,
      } =
        await supabase
          .from("profiles")
          .select(`
            id,
            full_name,
            user_number
          `)
          .eq(
            "auth_user_id",
            user.id
          )
          .eq(
            "role",
            "teacher"
          )
          .maybeSingle();

      if (error) {
        console.error(
          "LOAD TEACHER:",
          error
        );
        return;
      }

      setTeacher(
        data || null
      );
    } catch (error) {
      console.error(
        "LOAD TEACHER:",
        error
      );
    }
  }

  return (
    <div
      className={
        collapsed
          ? "teacher-shell is-collapsed"
          : "teacher-shell"
      }
      dir="rtl"
    >
      {/* =================================================
          CSS
      ================================================= */}

      <style>
        {`
          :root {
            --teacher-green:
              #0f5132;

            --teacher-green-dark:
              #073d2a;

            --teacher-green-soft:
              #edf8f2;

            --teacher-gold:
              #c9a227;

            --teacher-border:
              #e6ece8;

            --teacher-text:
              #0f172a;

            --teacher-muted:
              #64748b;

            --teacher-sidebar:
              292px;

            --teacher-sidebar-small:
              92px;
          }

          * {
            box-sizing:
              border-box;
          }

          .teacher-shell {
            min-height: 100vh;
            display: flex;
            background:
              linear-gradient(
                180deg,
                #f8fafc 0%,
                #f4f8f6 100%
              );
            color:
              var(--teacher-text);
          }

          /* =============================================
             SIDEBAR
          ============================================= */

          .teacher-sidebar {
            width:
              var(--teacher-sidebar);

            flex:
              0 0
              var(--teacher-sidebar);

            position: sticky;
            top: 0;
            height: 100vh;

            display: flex;
            flex-direction: column;

            overflow: hidden;

            background:
              rgba(
                255,
                255,
                255,
                .97
              );

            border-left:
              1px solid
              var(--teacher-border);

            box-shadow:
              -8px 0 35px
              rgba(
                15,
                81,
                50,
                .045
              );

            transition:
              width .28s ease,
              flex-basis .28s ease;

            z-index: 1200;
          }

          .is-collapsed
          .teacher-sidebar {
            width:
              var(--teacher-sidebar-small);

            flex-basis:
              var(--teacher-sidebar-small);
          }

          /* =============================================
             BRAND
          ============================================= */

          .teacher-brand {
            min-height: 104px;

            display: flex;
            align-items: center;

            gap: 13px;

            padding:
              20px 20px 18px;

            border-bottom:
              1px solid
              #eef2f0;

            position: relative;
          }

          .teacher-brand-logo {
            width: 52px;
            height: 52px;

            flex: 0 0 52px;

            border-radius: 17px;

            display: flex;
            align-items: center;
            justify-content: center;

            background:
              linear-gradient(
                145deg,
                #f7fbf9,
                #ffffff
              );

            border:
              1px solid
              rgba(
                15,
                81,
                50,
                .1
              );

            box-shadow:
              0 9px 24px
              rgba(
                15,
                81,
                50,
                .08
              );

            overflow: hidden;
          }

          .teacher-brand-logo img {
            width: 44px;
            height: 44px;
            object-fit: contain;
          }

          .teacher-brand-info {
            min-width: 0;

            transition:
              opacity .2s ease,
              transform .2s ease;
          }

          .teacher-brand-name {
            margin: 0;

            color:
              var(--teacher-green);

            font-size: 20px;
            font-weight: 950;
            line-height: 1.2;
          }

          .teacher-brand-subtitle {
            margin-top: 5px;

            color:
              #84928a;

            font-size: 11px;
            font-weight: 750;
          }

          .is-collapsed
          .teacher-brand {
            justify-content: center;
            padding-left: 10px;
            padding-right: 10px;
          }

          .is-collapsed
          .teacher-brand-info {
            display: none;
          }

          /* =============================================
             SIDEBAR BODY
          ============================================= */

          .teacher-sidebar-scroll {
            flex: 1;

            overflow-y: auto;
            overflow-x: hidden;

            padding:
              17px 14px 20px;

            scrollbar-width: thin;
            scrollbar-color:
              #dbe7e1
              transparent;
          }

          .teacher-sidebar-section {
            margin-bottom: 17px;
          }

          .teacher-sidebar-section-title {
            padding:
              0 11px 7px;

            color: #a1ada7;

            font-size: 10px;
            font-weight: 900;

            letter-spacing:
              .02em;

            white-space: nowrap;
          }

          .is-collapsed
          .teacher-sidebar-section-title {
            height: 1px;
            padding: 0;

            margin:
              7px 9px 10px;

            overflow: hidden;

            background:
              #edf2ef;

            color: transparent;
          }

          /* =============================================
             NAV ITEM
          ============================================= */

          .teacher-nav-item {
            min-height: 47px;

            display: flex;
            align-items: center;

            gap: 11px;

            position: relative;

            padding:
              0 13px;

            margin-bottom: 5px;

            border-radius: 14px;

            text-decoration: none;

            color: #46534c;

            font-size: 13px;
            font-weight: 800;

            transition:
              background .18s ease,
              color .18s ease,
              transform .18s ease;
          }

          .teacher-nav-item:hover {
            background:
              #f4f8f6;

            color:
              var(--teacher-green);

            transform:
              translateX(-2px);
          }

          .teacher-nav-item.active {
            color: #ffffff;

            background:
              linear-gradient(
                135deg,
                #0f5132 0%,
                #0c6843 100%
              );

            box-shadow:
              0 10px 22px
              rgba(
                15,
                81,
                50,
                .16
              );
          }

          .teacher-nav-icon {
            width: 22px;
            height: 22px;

            flex: 0 0 22px;

            display: flex;
            align-items: center;
            justify-content: center;
          }

          .teacher-nav-text {
            flex: 1;

            overflow: hidden;

            white-space: nowrap;
            text-overflow:
              ellipsis;
          }

          .teacher-nav-arrow {
            opacity: .45;

            transition:
              transform .18s ease;
          }

          .teacher-nav-item:hover
          .teacher-nav-arrow {
            transform:
              translateX(-2px);
          }

          .teacher-nav-item.active
          .teacher-nav-arrow {
            opacity: .8;
          }

          .is-collapsed
          .teacher-nav-item {
            width: 52px;
            height: 50px;

            min-height: 50px;

            padding: 0;

            margin:
              0 auto 6px;

            justify-content:
              center;
          }

          .is-collapsed
          .teacher-nav-text,
          .is-collapsed
          .teacher-nav-arrow {
            display: none;
          }

          .is-collapsed
          .teacher-nav-item:hover {
            transform: none;
          }

          /* =============================================
             SIDEBAR FOOTER
          ============================================= */

          .teacher-sidebar-footer {
            padding:
              14px;

            border-top:
              1px solid
              #eef2f0;

            background:
              rgba(
                255,
                255,
                255,
                .96
              );
          }

          .teacher-account-card {
            display: flex;
            align-items: center;

            gap: 11px;

            min-height: 62px;

            padding:
              10px 11px;

            border-radius: 17px;

            background:
              linear-gradient(
                135deg,
                #f5faf7,
                #edf7f2
              );

            border:
              1px solid
              #e2eee7;
          }

          .teacher-account-avatar {
            width: 40px;
            height: 40px;

            flex: 0 0 40px;

            display: flex;
            align-items: center;
            justify-content: center;

            border-radius: 13px;

            color: #ffffff;

            background:
              linear-gradient(
                135deg,
                #0f5132,
                #0f766e
              );

            font-weight: 950;
          }

          .teacher-account-info {
            min-width: 0;
            flex: 1;
          }

          .teacher-account-name {
            overflow: hidden;

            color:
              #1e3027;

            font-size: 12px;
            font-weight: 900;

            white-space: nowrap;
            text-overflow:
              ellipsis;
          }

          .teacher-account-role {
            margin-top: 3px;

            color: #7b8b82;

            font-size: 10px;
            font-weight: 700;
          }

          .is-collapsed
          .teacher-account-card {
            width: 48px;
            padding: 4px;

            margin: auto;

            justify-content:
              center;
          }

          .is-collapsed
          .teacher-account-info {
            display: none;
          }

          /* =============================================
             MAIN
          ============================================= */

          .teacher-main {
            min-width: 0;
            flex: 1;

            display: flex;
            flex-direction: column;
          }

          /* =============================================
             HEADER
          ============================================= */

          .teacher-header {
            height: 78px;

            position: sticky;
            top: 0;

            z-index: 900;

            display: flex;
            align-items: center;
            justify-content:
              space-between;

            gap: 18px;

            padding:
              0 26px;

            background:
              rgba(
                255,
                255,
                255,
                .91
              );

            backdrop-filter:
              blur(18px);

            border-bottom:
              1px solid
              rgba(
                226,
                232,
                240,
                .9
              );
          }

          .teacher-header-start {
            min-width: 0;

            display: flex;
            align-items: center;

            gap: 13px;
          }

          .teacher-header-button {
            width: 43px;
            height: 43px;

            flex: 0 0 43px;

            border:
              1px solid #e5ece8;

            border-radius: 13px;

            background: #ffffff;

            color:
              var(--teacher-green);

            display: flex;
            align-items: center;
            justify-content: center;

            cursor: pointer;

            box-shadow:
              0 5px 16px
              rgba(
                15,
                81,
                50,
                .04
              );

            transition:
              background .18s ease,
              transform .18s ease;
          }

          .teacher-header-button:hover {
            background:
              #f4f9f6;

            transform:
              translateY(-1px);
          }

          .teacher-mobile-menu {
            display: none;
          }

          .teacher-page-icon {
            width: 39px;
            height: 39px;

            flex: 0 0 39px;

            border-radius: 12px;

            display: flex;
            align-items: center;
            justify-content: center;

            background:
              var(
                --teacher-green-soft
              );

            color:
              var(--teacher-green);
          }

          .teacher-page-info {
            min-width: 0;
          }

          .teacher-page-title {
            margin: 0;

            overflow: hidden;

            color:
              #17231d;

            font-size: 18px;
            font-weight: 950;

            white-space: nowrap;
            text-overflow:
              ellipsis;
          }

          .teacher-page-subtitle {
            margin-top: 3px;

            color:
              #7b8a82;

            font-size: 11px;
            font-weight: 700;
          }

          .teacher-header-end {
            display: flex;
            align-items: center;

            gap: 13px;
          }

          .teacher-date-card {
            text-align: left;
          }

          .teacher-date-hijri {
            color:
              var(--teacher-green);

            font-size: 12px;
            font-weight: 900;
          }

          .teacher-date-gregorian {
            margin-top: 2px;

            color:
              #94a3b8;

            font-size: 10px;
            font-weight: 700;
          }

          .teacher-header-divider {
            width: 1px;
            height: 34px;

            background:
              #e5ebe7;
          }

          .teacher-mini-profile {
            display: flex;
            align-items: center;

            gap: 9px;
          }

          .teacher-mini-avatar {
            width: 39px;
            height: 39px;

            border-radius: 12px;

            display: flex;
            align-items: center;
            justify-content: center;

            background:
              linear-gradient(
                135deg,
                #0f5132,
                #0f766e
              );

            color: #ffffff;

            font-size: 13px;
            font-weight: 950;

            box-shadow:
              0 7px 18px
              rgba(
                15,
                81,
                50,
                .15
              );
          }

          .teacher-mini-info {
            max-width: 160px;
          }

          .teacher-mini-name {
            overflow: hidden;

            color:
              #24352c;

            font-size: 11px;
            font-weight: 900;

            white-space: nowrap;
            text-overflow:
              ellipsis;
          }

          .teacher-mini-role {
            margin-top: 2px;

            color:
              #94a3b8;

            font-size: 9px;
            font-weight: 700;
          }

          /* =============================================
             CONTENT
          ============================================= */

          .teacher-content {
            min-width: 0;
            flex: 1;

            padding:
              24px;

            position: relative;
          }

          .teacher-content::before {
            content: "";

            position: fixed;

            width: 380px;
            height: 380px;

            left: -190px;
            bottom: -190px;

            border-radius: 50%;

            pointer-events: none;

            background:
              radial-gradient(
                circle,
                rgba(
                  201,
                  162,
                  39,
                  .045
                ),
                transparent 68%
              );
          }

          /* =============================================
             MOBILE OVERLAY
          ============================================= */

          .teacher-drawer-overlay {
            display: none;
          }

          .teacher-mobile-close {
            display: none;
          }

          /* =============================================
             TABLET
          ============================================= */

          @media (
            max-width: 1080px
          ) {
            :root {
              --teacher-sidebar:
                255px;
            }

            .teacher-header {
              padding:
                0 18px;
            }

            .teacher-content {
              padding:
                20px;
            }

            .teacher-date-card {
              display: none;
            }

            .teacher-header-divider {
              display: none;
            }
          }

          /* =============================================
             MOBILE
          ============================================= */

          @media (
            max-width: 800px
          ) {
            .teacher-shell,
            .teacher-shell.is-collapsed {
              display: block;
            }

            .teacher-sidebar,
            .is-collapsed
            .teacher-sidebar {
              position: fixed;

              top: 0;
              right: 0;

              width:
                min(
                  310px,
                  88vw
                );

              height: 100dvh;

              transform:
                translateX(105%);

              transition:
                transform
                .28s ease;

              box-shadow:
                -22px 0 55px
                rgba(
                  15,
                  23,
                  42,
                  .18
                );

              z-index: 2100;
            }

            .teacher-sidebar.mobile-open {
              transform:
                translateX(0);
            }

            .teacher-drawer-overlay {
              position: fixed;
              inset: 0;

              display: block;

              opacity: 0;
              visibility: hidden;

              pointer-events: none;

              background:
                rgba(
                  15,
                  23,
                  42,
                  .44
                );

              backdrop-filter:
                blur(3px);

              transition:
                opacity .25s ease,
                visibility .25s ease;

              z-index: 2000;
            }

            .teacher-drawer-overlay.open {
              opacity: 1;
              visibility: visible;

              pointer-events: auto;
            }

            .teacher-mobile-close {
              display: flex;

              position: absolute;

              top: 17px;
              left: 14px;

              width: 38px;
              height: 38px;

              align-items: center;
              justify-content: center;

              border: none;
              border-radius: 12px;

              background:
                #f3f7f5;

              color:
                #475569;

              cursor: pointer;
            }

            .teacher-brand {
              padding-left:
                58px;
            }

            .is-collapsed
            .teacher-brand {
              justify-content:
                flex-start;

              padding-right:
                20px;

              padding-left:
                58px;
            }

            .is-collapsed
            .teacher-brand-info {
              display: block;
            }

            .is-collapsed
            .teacher-sidebar-section-title {
              height: auto;

              margin: 0;

              padding:
                0 11px 7px;

              background:
                transparent;

              color:
                #a1ada7;
            }

            .is-collapsed
            .teacher-nav-item {
              width: auto;
              height: auto;

              min-height: 47px;

              padding:
                0 13px;

              margin-bottom: 5px;

              justify-content:
                flex-start;
            }

            .is-collapsed
            .teacher-nav-text,
            .is-collapsed
            .teacher-nav-arrow {
              display: block;
            }

            .is-collapsed
            .teacher-account-card {
              width: auto;

              padding:
                10px 11px;

              margin: 0;

              justify-content:
                flex-start;
            }

            .is-collapsed
            .teacher-account-info {
              display: block;
            }

            .teacher-main {
              width: 100%;
            }

            .teacher-header {
              height: 70px;

              padding:
                0 13px;
            }

            .teacher-desktop-collapse {
              display: none;
            }

            .teacher-mobile-menu {
              display: flex;
            }

            .teacher-page-icon {
              display: none;
            }

            .teacher-page-title {
              font-size: 16px;
            }

            .teacher-page-subtitle {
              display: none;
            }

            .teacher-header-end {
              gap: 7px;
            }

            .teacher-mini-info {
              display: none;
            }

            .teacher-mini-avatar {
              width: 37px;
              height: 37px;
            }

            .teacher-content {
              padding:
                14px 12px 24px;
            }
          }

          /* =============================================
             SMALL MOBILE
          ============================================= */

          @media (
            max-width: 430px
          ) {
            .teacher-header {
              height: 66px;
            }

            .teacher-header-button {
              width: 40px;
              height: 40px;

              flex-basis: 40px;
            }

            .teacher-page-title {
              max-width:
                145px;

              font-size: 15px;
            }

            .teacher-mini-avatar {
              width: 35px;
              height: 35px;
            }

            .teacher-content {
              padding:
                11px 9px 22px;
            }
          }
        `}
      </style>

      {/* =================================================
          Mobile Overlay
      ================================================= */}

      <div
        className={
          mobileOpen
            ? "teacher-drawer-overlay open"
            : "teacher-drawer-overlay"
        }
        onClick={() =>
          setMobileOpen(false)
        }
      />

      {/* =================================================
          Sidebar
      ================================================= */}

      <aside
        className={
          mobileOpen
            ? "teacher-sidebar mobile-open"
            : "teacher-sidebar"
        }
      >
        {/* BRAND */}

        <div
          className="teacher-brand"
        >
          <button
            type="button"
            className="teacher-mobile-close"
            onClick={() =>
              setMobileOpen(false)
            }
            aria-label="إغلاق القائمة"
          >
            <X size={19} />
          </button>

          <div
            className="teacher-brand-logo"
          >
            <img
              src="/logo.png"
              alt="الصديق"
            />
          </div>

          <div
            className="teacher-brand-info"
          >
            <h2
              className="teacher-brand-name"
            >
              الصِّدِيق
            </h2>

            <div
              className="teacher-brand-subtitle"
            >
              بوابة المعلم
            </div>
          </div>
        </div>

        {/* NAVIGATION */}

        <div
          className="teacher-sidebar-scroll"
        >
          {menuSections.map(
            (section) => (
              <div
                key={
                  section.title
                }
                className="teacher-sidebar-section"
              >
                <div
                  className="teacher-sidebar-section-title"
                >
                  {
                    section.title
                  }
                </div>

                {section.items.map(
                  (item) => {
                    const Icon =
                      item.icon;

                    return (
                      <NavLink
                        key={
                          item.path
                        }
                        to={
                          item.path
                        }
                        end={
                          item.end
                        }
                        className={({
                          isActive,
                        }) =>
                          isActive
                            ? "teacher-nav-item active"
                            : "teacher-nav-item"
                        }
                        title={
                          collapsed
                            ? item.title
                            : undefined
                        }
                      >
                        <span
                          className="teacher-nav-icon"
                        >
                          <Icon
                            size={
                              19
                            }
                            strokeWidth={
                              2
                            }
                          />
                        </span>

                        <span
                          className="teacher-nav-text"
                        >
                          {
                            item.title
                          }
                        </span>

                        <ChevronLeft
                          size={14}
                          className="teacher-nav-arrow"
                        />
                      </NavLink>
                    );
                  }
                )}
              </div>
            )
          )}
        </div>

        {/* ACCOUNT */}

        <div
          className="teacher-sidebar-footer"
        >
          <div
            className="teacher-account-card"
          >
            <div
              className="teacher-account-avatar"
            >
              <UserCircle
                size={21}
              />
            </div>

            <div
              className="teacher-account-info"
            >
              <div
                className="teacher-account-name"
              >
                {teacher
                  ?.full_name ||
                  "المعلم"}
              </div>

              <div
                className="teacher-account-role"
              >
                بوابة المعلم
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* =================================================
          Main
      ================================================= */}

      <div
        className="teacher-main"
      >
        {/* ===============================================
            Header
        =============================================== */}

        <header
          className="teacher-header"
        >
          <div
            className="teacher-header-start"
          >
            {/* MOBILE MENU */}

            <button
              type="button"
              className="
                teacher-header-button
                teacher-mobile-menu
              "
              onClick={() =>
                setMobileOpen(true)
              }
              aria-label="فتح القائمة"
            >
              <Menu
                size={20}
              />
            </button>

            {/* DESKTOP COLLAPSE */}

            <button
              type="button"
              className="
                teacher-header-button
                teacher-desktop-collapse
              "
              onClick={() =>
                setCollapsed(
                  (value) =>
                    !value
                )
              }
              aria-label={
                collapsed
                  ? "توسيع القائمة"
                  : "تصغير القائمة"
              }
            >
              {collapsed ? (
                <PanelRightOpen
                  size={19}
                />
              ) : (
                <PanelRightClose
                  size={19}
                />
              )}
            </button>

            <div
              className="teacher-page-icon"
            >
              <CurrentPageIcon
                size={19}
              />
            </div>

            <div
              className="teacher-page-info"
            >
              <h1
                className="teacher-page-title"
              >
                {
                  currentPage.title
                }
              </h1>

              <div
                className="teacher-page-subtitle"
              >
                الصِّدِيق • بوابة
                المعلم
              </div>
            </div>
          </div>

          <div
            className="teacher-header-end"
          >
            <div
              className="teacher-date-card"
            >
              <div
                className="teacher-date-hijri"
              >
                {todayHijri}
              </div>

              <div
                className="teacher-date-gregorian"
              >
                {todayGregorian}
              </div>
            </div>

            <div
              className="teacher-header-divider"
            />

            <div
              className="teacher-mini-profile"
            >
              <div
                className="teacher-mini-info"
              >
                <div
                  className="teacher-mini-name"
                >
                  {teacher
                    ?.full_name ||
                    "المعلم"}
                </div>

                <div
                  className="teacher-mini-role"
                >
                  معلم
                </div>
              </div>

              <div
                className="teacher-mini-avatar"
              >
                <Sparkles
                  size={17}
                />
              </div>
            </div>
          </div>
        </header>

        {/* ===============================================
            Content
        =============================================== */}

        <main
          className="teacher-content"
        >
          <ResponsiveContainer>
            <Outlet />
          </ResponsiveContainer>
        </main>
      </div>
    </div>
  );
}