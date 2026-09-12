import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  NavLink,
  Outlet,
  useLocation,
} from "react-router-dom";

import {
  BarChart3,
  BookOpen,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  FileCheck,
  Gift,
  GraduationCap,
  LayoutDashboard,
  Menu,
  Mic2,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Trophy,
  Tv,
  UserCircle,
  Users,
  X,
} from "lucide-react";

import { supabase } from "../lib/supabase";
import ResponsiveContainer from "./ResponsiveContainer";

/* =========================================================
   Navigation
   ملاحظة:
   أبقينا المسارات /admin كما هي حتى لا تنكسر الراوتات الحالية.
   إذا نقلت بوابة المشرف لاحقًا إلى /supervisor غيّر BASE_PATH فقط.
========================================================= */

const BASE_PATH = "/admin";

const sections = [
  {
    title: "الرئيسية",
    items: [
      {
        name: "لوحة التحكم",
        path: BASE_PATH,
        icon: LayoutDashboard,
        end: true,
      },
    ],
  },

  {
    title: "إدارة الحلقة",
    items: [
      {
        name: "الطلاب",
        path: `${BASE_PATH}/students`,
        icon: Users,
      },
      {
        name: "المعلمون",
        path: `${BASE_PATH}/teachers`,
        icon: GraduationCap,
      },
      {
        name: "الحلقات",
        path: `${BASE_PATH}/halaqat`,
        icon: BookOpen,
      },
    ],
  },

  {
    title: "المتابعة التعليمية",
    items: [
      {
        name: "الحضور",
        path: `${BASE_PATH}/attendance`,
        icon: ClipboardCheck,
      },
      {
        name: "التسميع",
        path: `${BASE_PATH}/recitations`,
        icon: Mic2,
      },
      {
        name: "الاختبارات",
        path: `${BASE_PATH}/exams`,
        icon: FileCheck,
      },
    ],
  },

  {
    title: "الأداء والتحفيز",
    items: [
      {
        name: "الإنجاز الشهري",
        path: `${BASE_PATH}/monthly-achievement`,
        icon: Trophy,
      },
      {
        name: "النقاط",
        path: `${BASE_PATH}/points-transactions`,
        icon: Gift,
      },
    ],
  },

  {
    title: "التقارير والعرض",
    items: [
      {
        name: "التقارير",
        path: `${BASE_PATH}/reports`,
        icon: BarChart3,
      },
      {
        name: "العرض على التلفزيون",
        path: `${BASE_PATH}/tv-leaderboard`,
        icon: Tv,
      },
    ],
  },

  {
    title: "الحساب",
    items: [
      {
        name: "الإعدادات",
        path: `${BASE_PATH}/settings`,
        icon: Settings,
      },
      {
        name: "الملف الشخصي",
        path: `${BASE_PATH}/profile`,
        icon: UserCircle,
      },
    ],
  },
];

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

function findCurrentItem(pathname) {
  const items =
    sections.flatMap(
      (section) =>
        section.items
    );

  const exact =
    items.find(
      (item) =>
        item.path === pathname
    );

  if (exact) {
    return exact;
  }

  return (
    items
      .filter(
        (item) =>
          !item.end &&
          pathname.startsWith(
            `${item.path}/`
          )
      )
      .sort(
        (a, b) =>
          b.path.length -
          a.path.length
      )[0] ||
    items[0]
  );
}

/* =========================================================
   Layout
========================================================= */

export default function AdminLayout() {
  const location =
    useLocation();

  const searchRef =
    useRef(null);

  const [
    collapsed,
    setCollapsed,
  ] =
    useState(() => {
      try {
        return (
          localStorage.getItem(
            "sadiqSupervisorSidebarCollapsed"
          ) === "true"
        );
      } catch {
        return false;
      }
    });

  const [
    mobileOpen,
    setMobileOpen,
  ] =
    useState(false);

  const [
    isMobile,
    setIsMobile,
  ] =
    useState(() =>
      typeof window !==
      "undefined"
        ? window.matchMedia(
            "(max-width: 820px)"
          ).matches
        : false
    );

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    profile,
    setProfile,
  ] =
    useState(null);

  const [
    now,
    setNow,
  ] =
    useState(
      () => new Date()
    );

  /* =====================================================
     Persist collapse
  ===================================================== */

  useEffect(() => {
    try {
      localStorage.setItem(
        "sadiqSupervisorSidebarCollapsed",
        String(collapsed)
      );
    } catch {
      // تجاهل مشاكل التخزين المحلي
    }
  }, [collapsed]);

  /* =====================================================
     Responsive listener
  ===================================================== */

  useEffect(() => {
    if (
      typeof window ===
      "undefined"
    ) {
      return;
    }

    const media =
      window.matchMedia(
        "(max-width: 820px)"
      );

    const handleChange = (
      event
    ) => {
      setIsMobile(
        event.matches
      );

      if (
        !event.matches
      ) {
        setMobileOpen(
          false
        );
      }
    };

    setIsMobile(
      media.matches
    );

    media.addEventListener?.(
      "change",
      handleChange
    );

    return () => {
      media.removeEventListener?.(
        "change",
        handleChange
      );
    };
  }, []);

  /* =====================================================
     Close mobile drawer on route change
  ===================================================== */

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  /* =====================================================
     Escape + Ctrl/Cmd + K
  ===================================================== */

  useEffect(() => {
    function handleKeyDown(
      event
    ) {
      if (
        event.key ===
        "Escape"
      ) {
        setMobileOpen(
          false
        );
      }

      if (
        (event.ctrlKey ||
          event.metaKey) &&
        event.key.toLowerCase() ===
          "k"
      ) {
        event.preventDefault();

        if (
          collapsed &&
          !isMobile
        ) {
          setCollapsed(
            false
          );

          window.setTimeout(
            () =>
              searchRef.current?.focus(),
            120
          );

          return;
        }

        searchRef.current?.focus();
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () =>
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
  }, [
    collapsed,
    isMobile,
  ]);

  /* =====================================================
     Clock/date refresh
  ===================================================== */

  useEffect(() => {
    const timer =
      window.setInterval(
        () =>
          setNow(
            new Date()
          ),
        60_000
      );

    return () =>
      window.clearInterval(
        timer
      );
  }, []);

  /* =====================================================
     Load current profile
  ===================================================== */

  useEffect(() => {
    let alive = true;

    async function loadProfile() {
      try {
        const {
          data: authData,
          error: authError,
        } =
          await supabase.auth.getUser();

        if (authError) {
          throw authError;
        }

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
            .select(
              "id, full_name, display_name, role"
            )
            .eq(
              "auth_user_id",
              user.id
            )
            .maybeSingle();

        if (error) {
          throw error;
        }

        if (alive) {
          setProfile(
            data || null
          );
        }
      } catch (error) {
        console.error(
          "LOAD SUPERVISOR PROFILE:",
          error
        );
      }
    }

    loadProfile();

    return () => {
      alive = false;
    };
  }, []);

  /* =====================================================
     Derived
  ===================================================== */

  const filteredSections =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      if (!query) {
        return sections;
      }

      return sections
        .map(
          (section) => ({
            ...section,

            items:
              section.items.filter(
                (item) =>
                  item.name
                    .toLowerCase()
                    .includes(
                      query
                    )
              ),
          })
        )
        .filter(
          (section) =>
            section.items
              .length > 0
        );
    }, [search]);

  const currentItem =
    useMemo(
      () =>
        findCurrentItem(
          location.pathname
        ),
      [location.pathname]
    );

  const currentPageTitle =
    currentItem?.name ||
    "نظام الصديق";

  const currentPageIcon =
    currentItem?.icon ||
    LayoutDashboard;

  const CurrentPageIcon =
    currentPageIcon;

  const displayName =
    profile?.display_name ||
    profile?.full_name ||
    "المشرف";

  const initials =
    displayName
      .trim()
      .slice(0, 1) ||
    "م";

  const sidebarCollapsed =
    !isMobile &&
    collapsed;

  /* =====================================================
     Sidebar renderer
  ===================================================== */

  const SidebarContent = (
    <div className="admin-layout-sidebar-inner">
      {/* BRAND */}

      <div className="admin-layout-brand">
        <div className="admin-layout-logo">
          ص
        </div>

        {!sidebarCollapsed && (
          <div className="admin-layout-brand-copy">
            <div>
              <strong>
                الصديق
              </strong>

              <span>
                PRO
              </span>
            </div>

            <small>
              بوابة المشرف
            </small>
          </div>
        )}

        {isMobile && (
          <button
            type="button"
            className="admin-layout-mobile-close"
            onClick={() =>
              setMobileOpen(
                false
              )
            }
            aria-label="إغلاق القائمة"
          >
            <X size={17} />
          </button>
        )}
      </div>

      {/* PROFILE */}

      {!sidebarCollapsed && (
        <div className="admin-layout-profile-card">
          <div className="admin-layout-profile-avatar">
            {initials}
          </div>

          <div className="admin-layout-profile-copy">
            <span>
              المشرف الحالي
            </span>

            <strong>
              {displayName}
            </strong>

            <small>
              إدارة ومتابعة الحلقات
            </small>
          </div>
        </div>
      )}

      {/* SEARCH */}

      <div
        className={
          sidebarCollapsed
            ? "admin-layout-search collapsed"
            : "admin-layout-search"
        }
      >
        <Search
          size={16}
        />

        {!sidebarCollapsed && (
          <>
            <input
              ref={searchRef}
              value={search}
              onChange={(
                event
              ) =>
                setSearch(
                  event.target
                    .value
                )
              }
              placeholder="بحث سريع..."
              aria-label="بحث في القائمة"
            />

            {search && (
              <button
                type="button"
                onClick={() =>
                  setSearch("")
                }
                aria-label="مسح البحث"
              >
                <X size={12} />
              </button>
            )}

            <kbd>
              Ctrl K
            </kbd>
          </>
        )}
      </div>

      {/* NAVIGATION */}

      <nav className="admin-layout-nav">
        {filteredSections.length >
        0 ? (
          filteredSections.map(
            (section) => (
              <div
                key={
                  section.title
                }
                className="admin-layout-nav-section"
              >
                {!sidebarCollapsed && (
                  <div className="admin-layout-nav-section-title">
                    {
                      section.title
                    }
                  </div>
                )}

                <div className="admin-layout-nav-items">
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
                            Boolean(
                              item.end
                            )
                          }
                          title={
                            sidebarCollapsed
                              ? item.name
                              : undefined
                          }
                          className={({
                            isActive,
                          }) =>
                            [
                              "admin-layout-nav-link",
                              isActive
                                ? "active"
                                : "",
                              sidebarCollapsed
                                ? "collapsed"
                                : "",
                            ]
                              .filter(
                                Boolean
                              )
                              .join(
                                " "
                              )
                          }
                        >
                          <span className="admin-layout-nav-icon">
                            <Icon
                              size={17}
                            />
                          </span>

                          {!sidebarCollapsed && (
                            <>
                              <span className="admin-layout-nav-label">
                                {
                                  item.name
                                }
                              </span>

                              <ChevronLeft
                                size={13}
                                className="admin-layout-nav-arrow"
                              />
                            </>
                          )}
                        </NavLink>
                      );
                    }
                  )}
                </div>
              </div>
            )
          )
        ) : (
          !sidebarCollapsed && (
            <div className="admin-layout-search-empty">
              <Search
                size={20}
              />

              <strong>
                لا توجد نتيجة
              </strong>

              <span>
                جرّب كلمة أخرى
              </span>
            </div>
          )
        )}
      </nav>

      {/* FOOTER */}

      <div
        className={
          sidebarCollapsed
            ? "admin-layout-sidebar-footer collapsed"
            : "admin-layout-sidebar-footer"
        }
      >
        <div className="admin-layout-sidebar-footer-icon">
          <ShieldCheck
            size={16}
          />
        </div>

        {!sidebarCollapsed && (
          <div>
            <strong>
              نظام الصديق
            </strong>

            <span>
              بيئة متابعة تعليمية
            </span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div
      className="admin-layout-shell"
      dir="rtl"
    >
      {/* BACKGROUND */}

      <div className="admin-layout-background" />

      {/* =========================================
          DESKTOP SIDEBAR
      ========================================= */}

      {!isMobile && (
        <aside
          className={
            sidebarCollapsed
              ? "admin-layout-sidebar collapsed"
              : "admin-layout-sidebar"
          }
        >
          {SidebarContent}
        </aside>
      )}

      {/* =========================================
          MOBILE DRAWER
      ========================================= */}

      {isMobile && (
        <>
          <div
            className={
              mobileOpen
                ? "admin-layout-mobile-overlay open"
                : "admin-layout-mobile-overlay"
            }
            onClick={() =>
              setMobileOpen(
                false
              )
            }
          />

          <aside
            className={
              mobileOpen
                ? "admin-layout-mobile-drawer open"
                : "admin-layout-mobile-drawer"
            }
          >
            {SidebarContent}
          </aside>
        </>
      )}

      {/* =========================================
          MAIN
      ========================================= */}

      <main className="admin-layout-main">
        {/* TOPBAR */}

        <header className="admin-layout-topbar">
          <div className="admin-layout-topbar-start">
            <button
              type="button"
              className="admin-layout-menu-button"
              onClick={() => {
                if (isMobile) {
                  setMobileOpen(
                    true
                  );

                  return;
                }

                setCollapsed(
                  (value) =>
                    !value
                );
              }}
              aria-label={
                isMobile
                  ? "فتح القائمة"
                  : sidebarCollapsed
                    ? "توسيع القائمة"
                    : "طي القائمة"
              }
            >
              {isMobile ? (
                <Menu
                  size={18}
                />
              ) : sidebarCollapsed ? (
                <ChevronLeft
                  size={18}
                />
              ) : (
                <ChevronRight
                  size={18}
                />
              )}
            </button>

            <div className="admin-layout-page-icon">
              <CurrentPageIcon
                size={18}
              />
            </div>

            <div className="admin-layout-page-copy">
              <span>
                بوابة المشرف
              </span>

              <h1>
                {
                  currentPageTitle
                }
              </h1>
            </div>
          </div>

          <div className="admin-layout-topbar-end">
            <div className="admin-layout-date-card">
              <CalendarDays
                size={16}
              />

              <div>
                <strong>
                  {formatHijri(
                    now
                  )}
                </strong>

                <span>
                  {formatGregorian(
                    now
                  )}
                </span>
              </div>
            </div>

            <div className="admin-layout-topbar-profile">
              <div className="admin-layout-topbar-avatar">
                {initials}
              </div>

              <div>
                <strong>
                  {
                    displayName
                  }
                </strong>

                <span>
                  مشرف
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}

        <div className="admin-layout-content">
          <ResponsiveContainer>
            <Outlet />
          </ResponsiveContainer>
        </div>
      </main>

      {/* =========================================
          STYLES
      ========================================= */}

      <style>
        {`
          :root {
            --sadiq-green-950: #0A2F2A;
            --sadiq-green-900: #0F4C45;
            --sadiq-green-800: #115E59;
            --sadiq-green-700: #0F766E;
            --sadiq-gold: #B99037;
            --sadiq-text: #31453B;
            --sadiq-muted: #89958E;
            --sadiq-border: #E4EAE6;
            --sadiq-surface: #FFFFFF;
          }

          .admin-layout-shell {
            position: relative;

            display: flex;

            min-height: 100vh;

            overflow-x: hidden;

            color:
              var(--sadiq-text);

            background:
              #F5F8F6;
          }

          .admin-layout-background {
            position: fixed;
            inset: 0;
            z-index: 0;

            pointer-events: none;

            background:
              radial-gradient(
                circle at 10% 10%,
                rgba(15,118,110,.045),
                transparent 26%
              ),
              radial-gradient(
                circle at 90% 18%,
                rgba(185,144,55,.035),
                transparent 24%
              ),
              linear-gradient(
                180deg,
                #F9FBFA,
                #F3F7F5
              );
          }

          .admin-layout-background::after {
            content: "";

            position: absolute;
            inset: 0;

            opacity: .025;

            background-image:
              radial-gradient(
                circle,
                #0F766E 1px,
                transparent 1px
              );

            background-size:
              42px 42px;
          }

          /* =========================
             SIDEBAR
          ========================= */

          .admin-layout-sidebar {
            position: sticky;
            top: 0;
            z-index: 50;

            width: 278px;
            height: 100vh;

            flex: 0 0 278px;

            overflow: hidden;

            border-left:
              1px solid
              rgba(15,76,69,.09);

            background:
              rgba(255,255,255,.90);

            backdrop-filter:
              blur(18px);

            transition:
              width .22s ease,
              flex-basis .22s ease;
          }

          .admin-layout-sidebar.collapsed {
            width: 82px;
            flex-basis: 82px;
          }

          .admin-layout-sidebar-inner {
            display: flex;
            flex-direction: column;

            height: 100%;

            padding: 13px 11px;

            box-sizing: border-box;
          }

          .admin-layout-sidebar-inner::-webkit-scrollbar,
          .admin-layout-nav::-webkit-scrollbar {
            width: 4px;
          }

          .admin-layout-nav::-webkit-scrollbar-thumb {
            border-radius: 999px;
            background:
              rgba(15,76,69,.12);
          }

          /* BRAND */

          .admin-layout-brand {
            position: relative;

            min-height: 48px;

            display: flex;
            align-items: center;

            gap: 9px;

            padding: 3px 4px;

            margin-bottom: 10px;
          }

          .admin-layout-logo {
            width: 39px;
            height: 39px;

            flex: 0 0 39px;

            border-radius: 12px;

            display: flex;
            align-items: center;
            justify-content: center;

            color: #FFFFFF;

            background:
              linear-gradient(
                145deg,
                var(--sadiq-green-900),
                var(--sadiq-green-700)
              );

            box-shadow:
              0 8px 18px
              rgba(15,76,69,.14);

            font-size: 14px;
            font-weight: 950;
          }

          .admin-layout-brand-copy {
            min-width: 0;
          }

          .admin-layout-brand-copy > div {
            display: flex;
            align-items: center;

            gap: 5px;
          }

          .admin-layout-brand-copy strong {
            color:
              var(--sadiq-green-900);

            font-size: 13px;
            font-weight: 950;
          }

          .admin-layout-brand-copy > div span {
            padding: 2px 5px;

            border:
              1px solid
              rgba(185,144,55,.22);

            border-radius: 999px;

            color: #8D6B24;
            background: #FFF9EA;

            font-size: 5px;
            font-weight: 950;
          }

          .admin-layout-brand-copy small {
            display: block;

            margin-top: 1px;

            color:
              var(--sadiq-muted);

            font-size: 6px;
          }

          /* PROFILE */

          .admin-layout-profile-card {
            display: flex;
            align-items: center;

            gap: 8px;

            margin-bottom: 9px;
            padding: 8px;

            border:
              1px solid
              #E6ECE8;

            border-radius: 12px;

            background:
              linear-gradient(
                135deg,
                #F8FBF9,
                #FFFCF7
              );
          }

          .admin-layout-profile-avatar {
            width: 34px;
            height: 34px;

            flex: 0 0 34px;

            border-radius: 10px;

            display: flex;
            align-items: center;
            justify-content: center;

            color:
              var(--sadiq-green-900);

            background: #E9F4ED;

            font-size: 10px;
            font-weight: 950;
          }

          .admin-layout-profile-copy {
            min-width: 0;
          }

          .admin-layout-profile-copy span,
          .admin-layout-profile-copy strong,
          .admin-layout-profile-copy small {
            display: block;
          }

          .admin-layout-profile-copy span {
            color: #9AA39D;
            font-size: 5px;
          }

          .admin-layout-profile-copy strong {
            margin-top: 1px;

            overflow: hidden;

            color: #3B4B41;

            font-size: 7px;
            font-weight: 950;

            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .admin-layout-profile-copy small {
            margin-top: 1px;

            color: #939D97;
            font-size: 5px;
          }

          /* SEARCH */

          .admin-layout-search {
            position: relative;

            min-height: 38px;

            display: flex;
            align-items: center;

            gap: 6px;

            margin-bottom: 8px;
            padding: 0 8px;

            border:
              1px solid #E1E8E3;

            border-radius: 10px;

            color: #849089;
            background: #F7FAF8;
          }

          .admin-layout-search.collapsed {
            justify-content: center;

            padding: 0;
          }

          .admin-layout-search input {
            min-width: 0;
            flex: 1;

            border: none;
            outline: none;

            color: #3D4D43;
            background: transparent;

            font-family: inherit;
            font-size: 6.5px;
          }

          .admin-layout-search input::placeholder {
            color: #A0A8A3;
          }

          .admin-layout-search button {
            width: 21px;
            height: 21px;

            border: none;
            border-radius: 6px;

            display: flex;
            align-items: center;
            justify-content: center;

            color: #77847C;
            background: #EAF0EC;

            cursor: pointer;
          }

          .admin-layout-search kbd {
            padding: 2px 5px;

            border:
              1px solid #DFE6E1;

            border-radius: 5px;

            color: #929C96;
            background: #FFFFFF;

            font-family: inherit;
            font-size: 4.5px;
          }

          /* NAV */

          .admin-layout-nav {
            min-height: 0;
            flex: 1;

            overflow-y: auto;
            overflow-x: hidden;

            padding-left: 2px;
          }

          .admin-layout-nav-section {
            margin-bottom: 8px;
          }

          .admin-layout-nav-section-title {
            padding: 0 8px 4px;

            color: #9AA39D;

            font-size: 5px;
            font-weight: 900;
          }

          .admin-layout-nav-items {
            display: grid;
            gap: 3px;
          }

          .admin-layout-nav-link {
            position: relative;

            min-height: 36px;

            display: flex;
            align-items: center;

            gap: 7px;

            padding: 0 8px;

            border:
              1px solid transparent;

            border-radius: 9px;

            color: #58665D;

            text-decoration: none;

            font-size: 6.5px;
            font-weight: 850;

            transition:
              color .16s ease,
              background .16s ease,
              border-color .16s ease,
              transform .16s ease;
          }

          .admin-layout-nav-link:hover {
            color:
              var(--sadiq-green-900);

            background: #F2F7F4;

            transform:
              translateX(-1px);
          }

          .admin-layout-nav-link.active {
            color:
              var(--sadiq-green-900);

            border-color: #D9E8DE;

            background:
              linear-gradient(
                135deg,
                #EDF7F1,
                #F7FBF8
              );

            box-shadow:
              inset -2px 0 0
              var(--sadiq-green-700);
          }

          .admin-layout-nav-link.collapsed {
            justify-content: center;

            padding: 0;
          }

          .admin-layout-nav-icon {
            width: 26px;
            height: 26px;

            flex: 0 0 26px;

            border-radius: 8px;

            display: flex;
            align-items: center;
            justify-content: center;

            color: #6C7971;

            transition:
              color .16s ease,
              background .16s ease;
          }

          .admin-layout-nav-link.active
          .admin-layout-nav-icon {
            color:
              var(--sadiq-green-900);

            background:
              rgba(15,118,110,.075);
          }

          .admin-layout-nav-label {
            min-width: 0;
            flex: 1;

            overflow: hidden;

            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .admin-layout-nav-arrow {
            opacity: 0;

            color:
              var(--sadiq-green-700);

            transition:
              opacity .16s ease,
              transform .16s ease;
          }

          .admin-layout-nav-link.active
          .admin-layout-nav-arrow {
            opacity: 1;
          }

          .admin-layout-search-empty {
            min-height: 120px;

            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;

            gap: 3px;

            color: #9AA39D;

            text-align: center;
          }

          .admin-layout-search-empty strong {
            color: #66736B;
            font-size: 6.5px;
          }

          .admin-layout-search-empty span {
            font-size: 5px;
          }

          /* SIDEBAR FOOTER */

          .admin-layout-sidebar-footer {
            display: flex;
            align-items: center;

            gap: 7px;

            margin-top: 6px;
            padding: 8px;

            border:
              1px solid
              rgba(15,76,69,.09);

            border-radius: 11px;

            background:
              linear-gradient(
                135deg,
                #F5FAF7,
                #FFFDF7
              );
          }

          .admin-layout-sidebar-footer.collapsed {
            justify-content: center;
          }

          .admin-layout-sidebar-footer-icon {
            width: 29px;
            height: 29px;

            flex: 0 0 29px;

            border-radius: 8px;

            display: flex;
            align-items: center;
            justify-content: center;

            color:
              var(--sadiq-green-900);

            background: #E6F2EA;
          }

          .admin-layout-sidebar-footer strong,
          .admin-layout-sidebar-footer span {
            display: block;
          }

          .admin-layout-sidebar-footer strong {
            color: #405046;
            font-size: 6px;
          }

          .admin-layout-sidebar-footer span {
            margin-top: 1px;

            color: #929C96;
            font-size: 5px;
          }

          /* =========================
             MAIN
          ========================= */

          .admin-layout-main {
            position: relative;
            z-index: 1;

            min-width: 0;
            flex: 1;
          }

          /* TOPBAR */

          .admin-layout-topbar {
            position: sticky;
            top: 0;
            z-index: 40;

            min-height: 68px;

            display: flex;
            align-items: center;
            justify-content: space-between;

            gap: 12px;

            padding: 9px 18px;

            border-bottom:
              1px solid
              rgba(15,76,69,.08);

            background:
              rgba(255,255,255,.88);

            backdrop-filter:
              blur(16px);
          }

          .admin-layout-topbar-start {
            display: flex;
            align-items: center;

            gap: 8px;

            min-width: 0;
          }

          .admin-layout-menu-button {
            width: 36px;
            height: 36px;

            flex: 0 0 36px;

            border:
              1px solid #E1E8E3;

            border-radius: 10px;

            display: flex;
            align-items: center;
            justify-content: center;

            color:
              var(--sadiq-green-900);

            background: #F8FBF9;

            cursor: pointer;

            transition:
              background .16s ease,
              transform .16s ease;
          }

          .admin-layout-menu-button:hover {
            background: #EDF6F1;

            transform:
              translateY(-1px);
          }

          .admin-layout-page-icon {
            width: 35px;
            height: 35px;

            flex: 0 0 35px;

            border-radius: 10px;

            display: flex;
            align-items: center;
            justify-content: center;

            color:
              var(--sadiq-green-900);

            background: #EAF5EE;
          }

          .admin-layout-page-copy {
            min-width: 0;
          }

          .admin-layout-page-copy span {
            display: block;

            color: #9A792D;

            font-size: 5.5px;
            font-weight: 900;
          }

          .admin-layout-page-copy h1 {
            margin: 1px 0 0;

            overflow: hidden;

            color: #34463B;

            font-size: 12px;
            font-weight: 950;

            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .admin-layout-topbar-end {
            display: flex;
            align-items: center;

            gap: 7px;
          }

          .admin-layout-date-card {
            display: flex;
            align-items: center;

            gap: 6px;

            padding: 6px 8px;

            border:
              1px solid #E3E9E5;

            border-radius: 10px;

            color:
              var(--sadiq-green-900);

            background: #FFFFFF;
          }

          .admin-layout-date-card strong,
          .admin-layout-date-card span {
            display: block;
          }

          .admin-layout-date-card strong {
            color:
              var(--sadiq-green-900);

            font-size: 5.5px;
            font-weight: 900;
          }

          .admin-layout-date-card span {
            margin-top: 1px;

            color: #8B958F;
            font-size: 5px;
          }

          .admin-layout-topbar-profile {
            display: flex;
            align-items: center;

            gap: 6px;

            padding: 5px 7px;

            border:
              1px solid #E3E9E5;

            border-radius: 10px;

            background: #FFFFFF;
          }

          .admin-layout-topbar-avatar {
            width: 29px;
            height: 29px;

            border-radius: 9px;

            display: flex;
            align-items: center;
            justify-content: center;

            color: #FFFFFF;

            background:
              linear-gradient(
                145deg,
                var(--sadiq-green-900),
                var(--sadiq-green-700)
              );

            font-size: 7px;
            font-weight: 950;
          }

          .admin-layout-topbar-profile strong,
          .admin-layout-topbar-profile span {
            display: block;
          }

          .admin-layout-topbar-profile strong {
            max-width: 120px;

            overflow: hidden;

            color: #405046;

            font-size: 6px;
            font-weight: 900;

            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .admin-layout-topbar-profile span {
            margin-top: 1px;

            color: #929C96;
            font-size: 5px;
          }

          /* CONTENT */

          .admin-layout-content {
            position: relative;
            z-index: 1;

            padding: 15px 18px 24px;
          }

          /* =========================
             MOBILE DRAWER
          ========================= */

          .admin-layout-mobile-overlay {
            position: fixed;
            inset: 0;
            z-index: 80;

            opacity: 0;
            visibility: hidden;

            background:
              rgba(10,31,27,.48);

            backdrop-filter:
              blur(3px);

            transition:
              opacity .2s ease,
              visibility .2s ease;
          }

          .admin-layout-mobile-overlay.open {
            opacity: 1;
            visibility: visible;
          }

          .admin-layout-mobile-drawer {
            position: fixed;
            top: 0;
            right: 0;
            bottom: 0;
            z-index: 90;

            width: min(
              290px,
              88vw
            );

            transform:
              translateX(105%);

            border-left:
              1px solid
              rgba(15,76,69,.10);

            background:
              rgba(255,255,255,.98);

            box-shadow:
              -20px 0 60px
              rgba(10,31,27,.16);

            transition:
              transform .22s ease;
          }

          .admin-layout-mobile-drawer.open {
            transform:
              translateX(0);
          }

          .admin-layout-mobile-close {
            position: absolute;
            left: 0;
            top: 8px;

            width: 31px;
            height: 31px;

            border:
              1px solid #E2E8E4;

            border-radius: 9px;

            display: flex;
            align-items: center;
            justify-content: center;

            color: #657169;
            background: #FFFFFF;

            cursor: pointer;
          }

          /* =========================
             RESPONSIVE
          ========================= */

          @media
          (max-width: 1050px) {
            .admin-layout-date-card {
              display: none;
            }
          }

          @media
          (max-width: 820px) {
            .admin-layout-shell {
              display: block;
            }

            .admin-layout-main {
              width: 100%;
            }

            .admin-layout-topbar {
              min-height: 61px;

              padding:
                8px 11px;
            }

            .admin-layout-page-icon {
              display: none;
            }

            .admin-layout-topbar-profile > div:last-child {
              display: none;
            }

            .admin-layout-content {
              padding:
                11px 10px 20px;
            }
          }

          @media
          (max-width: 430px) {
            .admin-layout-page-copy span {
              display: none;
            }

            .admin-layout-page-copy h1 {
              font-size: 10px;
            }

            .admin-layout-topbar {
              gap: 7px;
            }
          }

          @media
          (prefers-reduced-motion: reduce) {
            .admin-layout-sidebar,
            .admin-layout-mobile-drawer,
            .admin-layout-mobile-overlay,
            .admin-layout-nav-link,
            .admin-layout-menu-button {
              transition: none !important;
            }
          }
        `}
      </style>
    </div>
  );
}
