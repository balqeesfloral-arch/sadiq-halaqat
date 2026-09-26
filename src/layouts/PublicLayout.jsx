import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, LogIn, Menu, X, Sparkles } from "lucide-react";

export default function PublicLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 30);
    };

    onScroll();

    window.addEventListener("scroll", onScroll, {
      passive: true,
    });

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const goToSection = (id) => {
    const section = document.getElementById(id);

    if (section) {
      section.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }

    setMobileMenuOpen(false);
  };

  return (
    <div className="public-layout" dir="rtl">
      <style>{`
        :root {
          --public-green: var(--app-color-0f4c45,#0F4C45);
          --public-green-dark: var(--app-color-082f2a,#082F2A);
          --public-green-deep: #061F1C;

          --public-gold: #D4AF37;
          --public-gold-light: #E6C96A;

          --public-ivory: #F8F6EF;
          --public-white: #FFFFFF;

          --public-text: #16332F;
          --public-muted: #72817E;

          --public-border: color-mix(in srgb,var(--app-color-0f4c45,#0f4c45) 12%,transparent);

          --public-shadow:
            0 20px 60px color-mix(in srgb,var(--app-color-082f2a,#082f2a) 10%,transparent);
        }

        * {
          box-sizing: border-box;
        }

        html {
          scroll-behavior: smooth;
        }

        body {
          margin: 0;
          background: var(--public-ivory);
        }

        .public-layout {
          position: relative;
          min-height: 100vh;
          overflow-x: hidden;
          background:
            radial-gradient(
              circle at 20% 10%,
              rgba(212, 175, 55, 0.06),
              transparent 28%
            ),
            radial-gradient(
              circle at 80% 30%,
              color-mix(in srgb,var(--app-color-0f4c45,#0f4c45) 8%,transparent),
              transparent 34%
            ),
            linear-gradient(
              180deg,
              #FBFAF5 0%,
              #F8F6EF 50%,
              #F4F1E8 100%
            );
          color: var(--public-text);
        }

        /* =========================
           FIXED BACKGROUND
        ========================= */

        .public-background {
          position: fixed;
          inset: 0;
          z-index: 0;
          overflow: hidden;
          pointer-events: none;
        }

        .public-background::before {
          content: "";
          position: absolute;
          inset: 0;
          background:
            linear-gradient(
              90deg,
              color-mix(in srgb,var(--app-color-0f4c45,#0f4c45) 1.7999999999999998%,transparent) 1px,
              transparent 1px
            ),
            linear-gradient(
              color-mix(in srgb,var(--app-color-0f4c45,#0f4c45) 1.7999999999999998%,transparent) 1px,
              transparent 1px
            );
          background-size: 42px 42px;
          mask-image:
            linear-gradient(
              to bottom,
              rgba(0,0,0,0.75),
              transparent 70%
            );
        }

        .public-mosque-scene {
          position: absolute;
          width: min(1400px, 120vw);
          height: auto;
          right: 50%;
          bottom: -55px;
          transform: translateX(50%);
          opacity: 0.18;
        }

        .public-moon {
          position: absolute;
          top: 125px;
          left: 8%;
          width: 92px;
          height: 92px;
          animation:
            publicFloat 7s ease-in-out infinite;
        }

        .public-moon svg {
          width: 100%;
          height: 100%;
        }

        .public-star {
          position: absolute;
          color: rgba(212, 175, 55, 0.40);
          animation:
            publicStarPulse 5s ease-in-out infinite;
        }

        .public-star.one {
          top: 210px;
          left: 18%;
          width: 17px;
          height: 17px;
        }

        .public-star.two {
          top: 105px;
          right: 14%;
          width: 13px;
          height: 13px;
          animation-delay: 1.8s;
        }

        .public-star.three {
          top: 330px;
          right: 8%;
          width: 10px;
          height: 10px;
          animation-delay: 2.7s;
        }

        .public-ornament {
          position: absolute;
          width: 260px;
          height: 260px;
          opacity: 0.08;
        }

        .public-ornament.top-right {
          top: -75px;
          right: -75px;
        }

        .public-ornament.bottom-left {
          bottom: -90px;
          left: -90px;
          transform: rotate(180deg);
        }

        @keyframes publicFloat {
          0%,
          100% {
            transform: translateY(0px);
          }

          50% {
            transform: translateY(-12px);
          }
        }

        @keyframes publicStarPulse {
          0%,
          100% {
            opacity: 0.25;
            transform: scale(0.85);
          }

          50% {
            opacity: 0.75;
            transform: scale(1.12);
          }
        }

        /* =========================
           HEADER
        ========================= */

        .public-header {
          position: fixed;
          inset: 0 0 auto;
          z-index: 100;
          width: 100%;
          background: rgba(251, 250, 245, 0.78);
          backdrop-filter: blur(14px) saturate(1.08);
          -webkit-backdrop-filter: blur(14px) saturate(1.08);
          transition:
            background 0.3s ease,
            box-shadow 0.3s ease,
            border-color 0.3s ease;
          border-bottom: 1px solid transparent;
        }

        .public-header.is-scrolled {
          background:
            rgba(248, 246, 239, 0.94);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);

          border-bottom-color:
            color-mix(in srgb,var(--app-color-0f4c45,#0f4c45) 8%,transparent);

          box-shadow:
            0 10px 30px color-mix(in srgb,var(--app-color-082f2a,#082f2a) 6%,transparent);
        }

        .public-header-inner {
          width: min(1400px, calc(100% - 40px));
          height: 82px;
          margin: 0 auto;

          display: grid;
          grid-template-columns:
            auto
            1fr
            auto;

          align-items: center;
          gap: calc(24px * var(--app-density,1));
        }

        /* =========================
           BRAND
        ========================= */

        .public-brand {
          display: flex;
          align-items: center;
          gap: calc(11px * var(--app-density,1));

          text-decoration: none;
          color: inherit;

          justify-self: start;
        }

        .public-brand-logo {
          width: 49px;
          height: 49px;

          padding: calc(5px * var(--app-density,1));

          display: grid;
          place-items: center;

          background:
            rgba(255,255,255,0.92);

          border:
            1px solid color-mix(in srgb,var(--app-color-0f4c45,#0f4c45) 10%,transparent);

          border-radius: calc(16px * var(--app-radius-scale,1));

          box-shadow:
            0 8px 28px color-mix(in srgb,var(--app-color-082f2a,#082f2a) 8%,transparent);
        }

        .public-brand-logo img {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .public-brand-copy {
          display: flex;
          flex-direction: column;
          gap: calc(1px * var(--app-density,1));
        }

        .public-brand-name {
          font-size: calc(20px * var(--app-font-scale,1));
          line-height: 1.2;
          font-weight: 900;
          color: var(--public-green-dark);
          letter-spacing: -0.4px;
        }

        .public-brand-subtitle {
          font-size: calc(11px * var(--app-font-scale,1));
          font-weight: 700;
          color: var(--public-muted);
        }

        /* =========================
           NAVIGATION
        ========================= */

        .public-nav {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: calc(8px * var(--app-density,1));
        }

        .public-nav-button {
          border: 0;
          background: transparent;
          cursor: pointer;

          padding: calc(10px * var(--app-density,1)) calc(13px * var(--app-density,1));

          border-radius: calc(12px * var(--app-radius-scale,1));

          font-family: inherit;
          font-size: calc(13px * var(--app-font-scale,1));
          font-weight: 800;

          color: #536966;

          transition:
            color 0.2s ease,
            background 0.2s ease,
            transform 0.2s ease;
        }

        .public-nav-button:hover {
          color: var(--public-green);
          background:
            color-mix(in srgb,var(--app-color-0f4c45,#0f4c45) 6%,transparent);
          transform: translateY(-1px);
        }

        /* =========================
           LOGIN BUTTON
        ========================= */

        .public-header-actions {
          justify-self: end;
          display: flex;
          align-items: center;
          gap: calc(10px * var(--app-density,1));
        }

        .public-login-button {
          border: 0;
          cursor: pointer;

          min-height: 46px;
          padding: 0 calc(19px * var(--app-density,1));

          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: calc(9px * var(--app-density,1));

          border-radius: calc(15px * var(--app-radius-scale,1));

          background:
            linear-gradient(
              135deg,
              var(--public-green-dark),
              var(--public-green)
            );

          color: #FFFFFF;

          font-family: inherit;
          font-size: calc(13px * var(--app-font-scale,1));
          font-weight: 900;

          box-shadow:
            0 12px 30px color-mix(in srgb,var(--app-color-0f4c45,#0f4c45) 20%,transparent);

          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease;
        }

        .public-login-button:hover {
          transform: translateY(-2px);

          box-shadow:
            0 16px 34px color-mix(in srgb,var(--app-color-0f4c45,#0f4c45) 28.000000000000004%,transparent);
        }

        .public-login-button svg {
          width: 17px;
          height: 17px;
        }

        .public-menu-button {
          display: none;

          width: 46px;
          height: 46px;

          border:
            1px solid color-mix(in srgb,var(--app-color-0f4c45,#0f4c45) 10%,transparent);

          border-radius: calc(14px * var(--app-radius-scale,1));

          background:
            rgba(255,255,255,0.82);

          color: var(--public-green);

          cursor: pointer;
        }

        /* =========================
           CONTENT
        ========================= */

        .public-content {
          position: relative;
          z-index: 2;
          min-height: calc(100vh - 82px);
          padding-top: 82px;
        }

        /* =========================
           MOBILE MENU
        ========================= */

        .public-mobile-menu {
          display: none;
        }

        @media (max-width: 950px) {
          .public-header-inner {
            width:
              min(100% - 24px, 1400px);

            height: 74px;

            grid-template-columns:
              auto
              1fr
              auto;
          }

          .public-nav {
            display: none;
          }

          .public-brand {
            justify-self: start;
          }

          .public-header-actions {
            justify-self: end;
          }

          .public-menu-button {
            display: grid;
            place-items: center;
          }

          .public-login-button .public-login-text {
            display: none;
          }

          .public-login-button {
            width: 46px;
            min-width: 46px;
            padding: 0;
          }

          .public-content {
            padding-top: 74px;
          }

          .public-mobile-menu {
            position: fixed;
            top: 74px;
            right: 12px;
            left: 12px;
            z-index: 200;

            display: block;

            padding: calc(14px * var(--app-density,1));

            border:
              1px solid color-mix(in srgb,var(--app-color-0f4c45,#0f4c45) 10%,transparent);

            border-radius: calc(22px * var(--app-radius-scale,1));

            background:
              rgba(255,255,255,0.96);

            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);

            box-shadow:
              0 26px 70px color-mix(in srgb,var(--app-color-082f2a,#082f2a) 18%,transparent);

            animation:
              publicMenuIn 0.22s ease;
          }

          .public-mobile-menu button {
            width: 100%;
            min-height: 48px;

            display: flex;
            align-items: center;
            justify-content: space-between;

            border: 0;
            border-radius: calc(14px * var(--app-radius-scale,1));

            background: transparent;
            color: var(--public-green-dark);

            padding: 0 calc(14px * var(--app-density,1));

            font-family: inherit;
            font-size: calc(13px * var(--app-font-scale,1));
            font-weight: 800;

            cursor: pointer;
          }

          .public-mobile-menu button:hover {
            background:
              color-mix(in srgb,var(--app-color-0f4c45,#0f4c45) 6%,transparent);
          }

          @keyframes publicMenuIn {
            from {
              opacity: 0;
              transform:
                translateY(-8px) scale(0.985);
            }

            to {
              opacity: 1;
              transform:
                translateY(0) scale(1);
            }
          }
        }

        @media (max-width: 620px) {
          .public-header-inner {
            width: calc(100% - 18px);
            gap: calc(8px * var(--app-density,1));
          }

          .public-brand-logo {
            width: 44px;
            height: 44px;
            border-radius: calc(14px * var(--app-radius-scale,1));
          }

          .public-brand-name {
            font-size: calc(18px * var(--app-font-scale,1));
          }

          .public-brand-subtitle {
            display: none;
          }

          .public-moon {
            width: 66px;
            height: 66px;
            left: 5%;
            top: 110px;
          }

          .public-ornament {
            width: 190px;
            height: 190px;
          }

          .public-mosque-scene {
            width: 175vw;
            bottom: -20px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .public-moon,
          .public-star {
            animation: none;
          }

          * {
            scroll-behavior: auto !important;
          }
        }
      `}</style>

      {/* =========================
          BACKGROUND
      ========================== */}

      <div
        className="public-background"
        aria-hidden="true"
      >
        <div className="public-moon">
          <svg
            viewBox="0 0 100 100"
            fill="none"
          >
            <path
              d="
                M67 12
                C45 16 30 34 30 56
                C30 74 42 89 59 94
                C35 93 16 73 16 49
                C16 25 35 7 58 7
                C61 7 64 9 67 12Z
              "
              fill="rgba(212,175,55,0.70)"
            />
          </svg>
        </div>

        <Sparkles className="public-star one" />
        <Sparkles className="public-star two" />
        <Sparkles className="public-star three" />

        {/* Islamic ornament */}
        <svg
          className="public-ornament top-right"
          viewBox="0 0 260 260"
          fill="none"
        >
          <g
            stroke="#0F4C45"
            strokeWidth="1.2"
          >
            <circle cx="130" cy="130" r="72" />
            <circle cx="130" cy="130" r="45" />

            <path d="M130 25L154 85L218 42L175 106L235 130L175 154L218 218L154 175L130 235L106 175L42 218L85 154L25 130L85 106L42 42L106 85Z" />

            <path d="M130 62L151 109L198 130L151 151L130 198L109 151L62 130L109 109Z" />
          </g>
        </svg>

        <svg
          className="public-ornament bottom-left"
          viewBox="0 0 260 260"
          fill="none"
        >
          <g
            stroke="#D4AF37"
            strokeWidth="1.2"
          >
            <circle cx="130" cy="130" r="72" />
            <circle cx="130" cy="130" r="45" />

            <path d="M130 25L154 85L218 42L175 106L235 130L175 154L218 218L154 175L130 235L106 175L42 218L85 154L25 130L85 106L42 42L106 85Z" />
          </g>
        </svg>

        {/* Mosque line-art */}
        <svg
          className="public-mosque-scene"
          viewBox="0 0 1440 550"
          fill="none"
        >
          <g
            stroke="#0F4C45"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* ground */}
            <path
              d="
                M60 500
                H1380
              "
            />

            {/* left minaret */}
            <path d="M220 500V190" />
            <path d="M190 500V190" />
            <path d="M184 190H226" />
            <path d="M190 190L208 144L220 190" />
            <path d="M207 143V108" />
            <path d="M207 109C199 104 199 94 207 90C203 98 207 104 214 105" />
            <path d="M175 230H238" />
            <path d="M182 245H231" />

            {/* right minaret */}
            <path d="M1220 500V190" />
            <path d="M1190 500V190" />
            <path d="M1184 190H1226" />
            <path d="M1190 190L1208 144L1220 190" />
            <path d="M1207 143V108" />
            <path d="M1207 109C1199 104 1199 94 1207 90C1203 98 1207 104 1214 105" />
            <path d="M1175 230H1238" />
            <path d="M1182 245H1231" />

            {/* mosque body */}
            <path d="M330 500V340" />
            <path d="M1110 500V340" />
            <path d="M330 340H1110" />

            {/* central dome */}
            <path
              d="
                M510 340
                C540 235 618 180 720 180
                C822 180 900 235 930 340
              "
            />

            <path d="M720 180V135" />

            <path d="M720 135C706 127 706 111 720 103C713 117 721 127 735 128" />

            {/* side domes */}
            <path
              d="
                M350 340
                C370 284 410 255 460 255
                C510 255 550 284 570 340
              "
            />

            <path
              d="
                M870 340
                C890 284 930 255 980 255
                C1030 255 1070 284 1090 340
              "
            />

            {/* entrances */}
            <path
              d="
                M650 500
                V408
                C650 368 790 368 790 408
                V500
              "
            />

            <path
              d="
                M410 500
                V425
                C410 392 500 392 500 425
                V500
              "
            />

            <path
              d="
                M940 500
                V425
                C940 392 1030 392 1030 425
                V500
              "
            />

            {/* decorative arches */}
            <path d="M560 500V425C560 396 620 396 620 425V500" />
            <path d="M820 500V425C820 396 880 396 880 425V500" />

            {/* subtle horizon */}
            <path
              d="
                M90 500
                C170 470 260 478 330 500
              "
              opacity="0.6"
            />

            <path
              d="
                M1110 500
                C1190 470 1280 478 1360 500
              "
              opacity="0.6"
            />
          </g>
        </svg>
      </div>

      {/* =========================
          HEADER
      ========================== */}

      <header
        className={`public-header ${
          scrolled ? "is-scrolled" : ""
        }`}
      >
        <div className="public-header-inner">
          {/* Brand */}
          <button
            type="button"
            className="public-brand"
            onClick={() => navigate("/")}
            style={{
              border: 0,
              background: "transparent",
              cursor: "pointer",
              fontFamily: "inherit",
              padding: 0,
            }}
          >
            <span className="public-brand-logo">
              <img
                src="/icon-512.png"
                alt="شعار الصديق"
              />
            </span>

            <span className="public-brand-copy">
              <span className="public-brand-name">
                الصِّديق
              </span>

              <span className="public-brand-subtitle">
                إدارة الحلقات والعناية بالطالب
              </span>
            </span>
          </button>

          {/* Desktop navigation */}
          <nav className="public-nav">
            <button type="button"
              className="public-nav-button"
              onClick={() => goToSection("home")}
            >
              الرئيسية
            </button>

            <button type="button"
              className="public-nav-button"
              onClick={() => goToSection("stats")}
            >
              الإحصائيات
            </button>

            <button type="button"
              className="public-nav-button"
              onClick={() => goToSection("why-sadiq")}
            >
              لماذا الصديق
            </button>

            <button type="button"
              className="public-nav-button"
              onClick={() => goToSection("journey")}
            >
              رحلة الطالب
            </button>

            <button type="button"
              className="public-nav-button"
              onClick={() => goToSection("features")}
            >
              المزايا
            </button>
          </nav>

          {/* Actions */}
          <div className="public-header-actions">
            <button
              type="button"
              className="public-menu-button"
              onClick={() =>
                setMobileMenuOpen((value) => !value)
              }
              aria-label="فتح القائمة"
            >
              {mobileMenuOpen ? (
                <X size={19} />
              ) : (
                <Menu size={19} />
              )}
            </button>

            <button
              type="button"
              className="public-login-button"
              onClick={() => navigate("/login")}
            >
              <LogIn />

              <span className="public-login-text">
                تسجيل الدخول
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* =========================
          MOBILE MENU
      ========================== */}

      {mobileMenuOpen && (
        <div className="public-mobile-menu">
          <button type="button"
            onClick={() => goToSection("home")}
          >
            <span>الرئيسية</span>
            <ArrowLeft size={16} />
          </button>

          <button type="button"
            onClick={() => goToSection("stats")}
          >
            <span>الإحصائيات</span>
            <ArrowLeft size={16} />
          </button>

          <button type="button"
            onClick={() =>
              goToSection("why-sadiq")
            }
          >
            <span>لماذا الصديق</span>
            <ArrowLeft size={16} />
          </button>

          <button type="button"
            onClick={() =>
              goToSection("journey")
            }
          >
            <span>رحلة الطالب</span>
            <ArrowLeft size={16} />
          </button>

          <button type="button"
            onClick={() =>
              goToSection("features")
            }
          >
            <span>المزايا</span>
            <ArrowLeft size={16} />
          </button>

          <button type="button"
            onClick={() => navigate("/login")}
          >
            <span>تسجيل الدخول</span>
            <LogIn size={16} />
          </button>
        </div>
      )}

      {/* =========================
          PAGE CONTENT
      ========================== */}

      <main className="public-content">
        <Outlet />
      </main>
    </div>
  );
}