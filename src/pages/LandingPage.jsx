import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowLeft,
  ArrowUpLeft,
  BarChart3,
  BookOpen,
  CalendarCheck2,
  CheckCircle2,
  ChevronDown,
  CircleUserRound,
  ClipboardCheck,
  Clock3,
  Crown,
  Eye,
  Gauge,
  GraduationCap,
  HeartHandshake,
  Landmark,
  Layers3,
  LogIn,
  MapPin,
  Medal,
  Moon,
  MoonStar,
  Network,
  NotebookTabs,
  Orbit,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Star,
  SunMedium,
  Sunrise,
  Sunset,
  Target,
  TrendingUp,
  Trophy,
  UserRoundCheck,
  Users,
  UsersRound,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import "./LandingPage.css";

const EMPTY_STATS = {
  id: "all",
  name: "جميع المساجد",
  subtitle: "نظرة شاملة على منظومة الصديق",
  halaqat: 0,
  teachers: 0,
  students: 0,
  recitations: 0,
  attendance: 0,
  achievement: 0,
  points: 0,
  health: 0,
  activeToday: 0,
  studentsToday: 0,
  weeklyRecitations: 0,
  generatedAt: null,
};

const EMPTY_INSIGHTS = {
  address: "",
  totalCapacity: 0,
  currentStudents: 0,
  occupancyRate: 0,
  activeHalaqat: 0,
  inactiveHalaqat: 0,
  archivedHalaqat: 0,
  periods: {
    after_fajr: 0,
    after_dhuhr: 0,
    after_asr: 0,
    after_maghrib: 0,
    after_isha: 0,
    unspecified: 0,
  },
};

const PERIODS = [
  { key: "after_fajr", label: "بعد الفجر", icon: Sunrise },
  { key: "after_dhuhr", label: "بعد الظهر", icon: SunMedium },
  { key: "after_asr", label: "بعد العصر", icon: SunMedium },
  { key: "after_maghrib", label: "بعد المغرب", icon: Sunset },
  { key: "after_isha", label: "بعد العشاء", icon: Moon },
];

const FEATURES = [
  {
    icon: UsersRound,
    title: "إدارة الحلقات",
    description:
      "تنظيم الحلقات والمعلمين والطلاب وربط كل طالب بمساره الصحيح.",
  },
  {
    icon: CalendarCheck2,
    title: "الحضور والانضباط",
    description:
      "متابعة الحضور والتأخر والغياب مع رؤية واضحة لحالة الطالب.",
  },
  {
    icon: BookOpen,
    title: "التسميع",
    description:
      "تسجيل ومتابعة الحفظ والمراجعة والقرآن والنورانية بصورة دقيقة.",
  },
  {
    icon: Target,
    title: "الخطط التعليمية",
    description:
      "خطط شهرية تساعد المعلم على تحويل الهدف إلى خطوات قابلة للقياس.",
  },
  {
    icon: ClipboardCheck,
    title: "الاختبارات",
    description:
      "متابعة الاختبارات والنتائج ومستوى الطالب عبر مراحل رحلته.",
  },
  {
    icon: Medal,
    title: "التحفيز والنقاط",
    description:
      "منظومة نقاط ومكافآت تساعد على تعزيز الالتزام والإنجاز.",
  },
  {
    icon: HeartHandshake,
    title: "العناية بالطلاب",
    description:
      "اكتشاف التعثر مبكرًا ومساعدة المعلم على التدخل قبل تفاقم المشكلة.",
  },
  {
    icon: BarChart3,
    title: "التقارير والمؤشرات",
    description:
      "تحويل بيانات الحلقة إلى مؤشرات تساعد الإدارة على اتخاذ قرار أفضل.",
  },
];

const JOURNEY = [
  {
    number: "01",
    title: "الانضمام",
    text: "تسجيل الطالب وربطه بالحَلقة والمعلم المناسب.",
  },
  {
    number: "02",
    title: "الخطة",
    text: "وضع هدف واضح للحفظ والمراجعة يناسب مستوى الطالب.",
  },
  {
    number: "03",
    title: "المتابعة",
    text: "حضور وتسميع ومراجعة مستمرة بدل المتابعة المتقطعة.",
  },
  {
    number: "04",
    title: "القياس",
    text: "قياس الإنجاز الشهري والاختبارات والتقدم الفعلي.",
  },
  {
    number: "05",
    title: "التحفيز",
    text: "استخدام النقاط والمكافآت لدفع الطالب نحو الاستمرار.",
  },
  {
    number: "06",
    title: "العناية",
    text: "التدخل عند انخفاض الحضور أو التسميع أو الإنجاز.",
  },
  {
    number: "07",
    title: "الإنجاز",
    text: "رحلة تعليمية أكثر وضوحًا واستقرارًا وأثرًا.",
  },
];

const WHY_SADIQ = [
  {
    icon: CircleUserRound,
    title: "الطالب أولًا",
    text: "كل رقم في النظام يعود إلى طالب ومسيرة تحتاج إلى متابعة.",
  },
  {
    icon: Orbit,
    title: "رؤية مترابطة",
    text: "الحضور والتسميع والخطط والنقاط والاختبارات في صورة واحدة.",
  },
  {
    icon: TrendingUp,
    title: "تطوير مستمر",
    text: "نحوّل البيانات اليومية إلى مؤشرات تساعد على رفع الأداء.",
  },
  {
    icon: ShieldCheck,
    title: "خصوصية وصلاحيات",
    text: "الصفحة العامة تعرض مؤشرات مجمعة فقط دون أي بيانات شخصية.",
  },
];

const ROLES = [
  {
    icon: Crown,
    title: "الإدارة",
    text: "رؤية شاملة للمنظومة واتخاذ القرار من خلال مؤشرات واضحة.",
  },
  {
    icon: Landmark,
    title: "المشرف",
    text: "متابعة المساجد والحلقات والمعلمين وجودة الأداء التشغيلي.",
  },
  {
    icon: GraduationCap,
    title: "المعلم",
    text: "أدوات تساعده على التركيز على الطالب بدل الأعمال الإدارية المتكررة.",
  },
  {
    icon: UserRoundCheck,
    title: "الطالب",
    text: "رحلة أكثر وضوحًا بين الخطة والمتابعة والتحفيز والإنجاز.",
  },
];

function clampPercent(value) {
  const number = Number(value) || 0;
  return Math.max(0, Math.min(100, number));
}

function normalizeStats(row) {
  if (!row) return EMPTY_STATS;

  return {
    id: row.mosque_id == null ? "all" : String(row.mosque_id),
    name: row.mosque_name || "جميع المساجد",
    subtitle:
      row.mosque_id == null
        ? "نظرة شاملة على منظومة الصديق"
        : "إحصائيات المسجد",
    halaqat: Number(row.halaqat_count) || 0,
    teachers: Number(row.teachers_count) || 0,
    students: Number(row.students_count) || 0,
    recitations: Number(row.recitations_month) || 0,
    attendance: clampPercent(row.attendance_rate),
    achievement: clampPercent(row.monthly_achievement_rate),
    points: Number(row.total_student_points) || 0,
    health: clampPercent(row.health_score),
    activeToday: Number(row.active_halaqat_today) || 0,
    studentsToday: Number(row.students_today) || 0,
    weeklyRecitations: Number(row.weekly_recitations) || 0,
    generatedAt: row.generated_at || null,
  };
}

function normalizeInsights(row) {
  if (!row) return EMPTY_INSIGHTS;

  return {
    address: row.mosque_address || "",
    totalCapacity: Number(row.total_capacity) || 0,
    currentStudents: Number(row.current_students) || 0,
    occupancyRate: clampPercent(row.occupancy_rate),
    activeHalaqat: Number(row.active_halaqat_count) || 0,
    inactiveHalaqat: Number(row.inactive_halaqat_count) || 0,
    archivedHalaqat: Number(row.archived_halaqat_count) || 0,
    periods: {
      after_fajr: Number(row.after_fajr_count) || 0,
      after_dhuhr: Number(row.after_dhuhr_count) || 0,
      after_asr: Number(row.after_asr_count) || 0,
      after_maghrib: Number(row.after_maghrib_count) || 0,
      after_isha: Number(row.after_isha_count) || 0,
      unspecified: Number(row.unspecified_period_count) || 0,
    },
  };
}

function formatUpdatedAt(value) {
  if (!value) return "تتحدث تلقائيًا";

  try {
    return new Intl.DateTimeFormat("ar-SA", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return "تتحدث تلقائيًا";
  }
}

function AnimatedNumber({
  value,
  suffix = "",
  duration = 900,
  maximumFractionDigits = 0,
}) {
  const [display, setDisplay] = useState(0);
  const previousValue = useRef(0);

  useEffect(() => {
    const nextValue = Number(value) || 0;
    const startValue = previousValue.current;
    const difference = nextValue - startValue;

    let startTime = null;
    let frame = 0;

    const animate = (time) => {
      if (!startTime) startTime = time;

      const progress = Math.min((time - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      setDisplay(startValue + difference * eased);

      if (progress < 1) {
        frame = requestAnimationFrame(animate);
      } else {
        previousValue.current = nextValue;
      }
    };

    frame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(frame);
  }, [value, duration]);

  return (
    <>
      {new Intl.NumberFormat("ar-SA", {
        maximumFractionDigits,
      }).format(display)}
      {suffix}
    </>
  );
}

function Reveal({ children, className = "", delay = 0 }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (
      window.matchMedia?.("(prefers-reduced-motion: reduce)")
        .matches
    ) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -40px 0px",
      }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`landing-reveal ${
        visible ? "is-visible" : ""
      } ${className}`}
      style={{ "--reveal-delay": `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function TiltCard({ children, className = "" }) {
  const ref = useRef(null);

  const onMove = (event) => {
    if (
      window.matchMedia?.("(pointer: coarse)").matches ||
      window.matchMedia?.("(prefers-reduced-motion: reduce)")
        .matches
    ) {
      return;
    }

    const element = ref.current;
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;

    element.style.setProperty(
      "--tilt-x",
      `${(0.5 - y) * 5}deg`
    );
    element.style.setProperty(
      "--tilt-y",
      `${(x - 0.5) * 5}deg`
    );
    element.style.setProperty("--glow-x", `${x * 100}%`);
    element.style.setProperty("--glow-y", `${y * 100}%`);
  };

  const reset = () => {
    const element = ref.current;
    if (!element) return;
    element.style.setProperty("--tilt-x", "0deg");
    element.style.setProperty("--tilt-y", "0deg");
  };

  return (
    <div
      ref={ref}
      className={`landing-tilt ${className}`}
      onMouseMove={onMove}
      onMouseLeave={reset}
    >
      {children}
    </div>
  );
}

function ProgressRing({ value, label, caption, size = 150 }) {
  const gradientId = useId().replace(/:/g, "");
  const safeValue = clampPercent(value);
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset =
    circumference - (safeValue / 100) * circumference;

  return (
    <div className="landing-progress-card">
      <div
        className="landing-progress-ring"
        style={{ width: size, height: size }}
      >
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          aria-hidden="true"
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(15,76,69,0.08)"
            strokeWidth={stroke}
          />

          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            className="landing-ring-value"
          />

          <defs>
            <linearGradient
              id={gradientId}
              x1="0"
              y1="0"
              x2="1"
              y2="1"
            >
              <stop offset="0%" stopColor="#D4AF37" />
              <stop offset="100%" stopColor="#0F4C45" />
            </linearGradient>
          </defs>
        </svg>

        <div className="landing-ring-center">
          <strong>
            <AnimatedNumber
              value={safeValue}
              suffix="%"
              maximumFractionDigits={1}
            />
          </strong>
        </div>
      </div>

      <div className="landing-progress-copy">
        <strong>{label}</strong>
        <span>{caption}</span>
      </div>
    </div>
  );
}

function StatsSkeleton() {
  return (
    <div className="landing-stats-grid" aria-label="جاري التحميل">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="landing-stat-card landing-skeleton-card"
        >
          <span className="landing-skeleton icon" />
          <span className="landing-skeleton value" />
          <span className="landing-skeleton label" />
          <span className="landing-skeleton note" />
        </div>
      ))}
    </div>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const heroRef = useRef(null);

  const [mosqueId, setMosqueId] = useState("all");
  const [mosques, setMosques] = useState([]);
  const [allStats, setAllStats] = useState(EMPTY_STATS);
  const [selectedMosque, setSelectedMosque] =
    useState(EMPTY_STATS);
  const [insights, setInsights] = useState(EMPTY_INSIGHTS);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState("");
  const [lastRefresh, setLastRefresh] = useState(null);
  const [activePeriod, setActivePeriod] = useState("all");

  const activityScore = useMemo(() => {
    if (!selectedMosque.students) return 0;

    return clampPercent(
      (selectedMosque.weeklyRecitations /
        Math.max(selectedMosque.students, 1)) *
        100
    );
  }, [
    selectedMosque.weeklyRecitations,
    selectedMosque.students,
  ]);

  const healthLabel = useMemo(() => {
    if (selectedMosque.health >= 90) return "أداء ممتاز";
    if (selectedMosque.health >= 80) return "أداء جيد جدًا";
    if (selectedMosque.health >= 65) return "أداء جيد";
    if (selectedMosque.health >= 45) return "يحتاج تحسين";
    return "يحتاج متابعة";
  }, [selectedMosque.health]);

  const statCards = [
    {
      icon: Landmark,
      label: "الحلقات",
      value: selectedMosque.halaqat,
      note: "حلقة نشطة",
    },
    {
      icon: GraduationCap,
      label: "المعلمون",
      value: selectedMosque.teachers,
      note: "ضمن نطاق العرض",
    },
    {
      icon: Users,
      label: "الطلاب",
      value: selectedMosque.students,
      note: "طالب حالي",
    },
    {
      icon: BookOpen,
      label: "التسميعات",
      value: selectedMosque.recitations,
      note: "هذا الشهر",
    },
    {
      icon: Trophy,
      label: "نقاط الطلاب",
      value: selectedMosque.points,
      note: "رصيد تحفيزي",
    },
  ];

  const directoryItems = useMemo(
    () => [
      {
        id: "all",
        name: "جميع المساجد",
        address: "",
      },
      ...mosques.map((mosque) => ({
        id: String(mosque.id),
        name: mosque.name,
        address: mosque.address || "",
      })),
    ],
    [mosques]
  );

  async function loadInsights(nextMosqueId) {
    try {
      const rpcMosqueId =
        nextMosqueId === "all" ? null : Number(nextMosqueId);

      const { data, error } = await supabase.rpc(
        "get_public_mosque_insights",
        {
          p_mosque_id: rpcMosqueId,
        }
      );

      if (error) {
        console.info(
          "Optional public insights are not installed yet:",
          error.message
        );
        setInsights(EMPTY_INSIGHTS);
        return;
      }

      const row = Array.isArray(data) ? data[0] : null;
      setInsights(normalizeInsights(row));
    } catch (error) {
      console.info("Optional public insights failed:", error);
      setInsights(EMPTY_INSIGHTS);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function loadInitialData() {
      setStatsLoading(true);
      setStatsError("");

      try {
        const statsResult = await supabase.rpc(
          "get_public_mosque_stats",
          { p_mosque_id: null }
        );

        if (statsResult.error) throw statsResult.error;

        let directoryRows = [];

        const directoryResult = await supabase.rpc(
          "get_public_mosque_directory"
        );

        if (!directoryResult.error) {
          directoryRows = Array.isArray(directoryResult.data)
            ? directoryResult.data
            : [];
        } else {
          const legacyResult = await supabase.rpc(
            "get_public_mosques"
          );

          if (legacyResult.error) throw legacyResult.error;

          directoryRows = Array.isArray(legacyResult.data)
            ? legacyResult.data
            : [];
        }

        if (cancelled) return;

        const row = Array.isArray(statsResult.data)
          ? statsResult.data[0]
          : null;
        const normalized = normalizeStats(row);

        setMosques(directoryRows);
        setAllStats(normalized);
        setSelectedMosque(normalized);
        setLastRefresh(new Date());

        await loadInsights("all");
      } catch (error) {
        console.error("Public landing load failed:", error);

        if (!cancelled) {
          setStatsError("تعذر تحميل الإحصائيات حاليًا");
        }
      } finally {
        if (!cancelled) setStatsLoading(false);
      }
    }

    loadInitialData();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const element = heroRef.current;
    if (!element) return;

    const onMove = (event) => {
      if (
        window.matchMedia?.("(pointer: coarse)").matches ||
        window.matchMedia?.("(prefers-reduced-motion: reduce)")
          .matches
      ) {
        return;
      }

      const rect = element.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;

      element.style.setProperty("--hero-x", `${x}%`);
      element.style.setProperty("--hero-y", `${y}%`);
    };

    element.addEventListener("mousemove", onMove);
    return () => element.removeEventListener("mousemove", onMove);
  }, []);

  async function changeMosque(nextMosqueId) {
    setMosqueId(nextMosqueId);
    setActivePeriod("all");
    setStatsError("");
    setStatsLoading(true);

    try {
      const rpcMosqueId =
        nextMosqueId === "all" ? null : Number(nextMosqueId);

      const { data, error } = await supabase.rpc(
        "get_public_mosque_stats",
        {
          p_mosque_id: rpcMosqueId,
        }
      );

      if (error) throw error;

      const row = Array.isArray(data) ? data[0] : null;
      const normalized = normalizeStats(row);

      setSelectedMosque(normalized);

      if (nextMosqueId === "all") {
        setAllStats(normalized);
      }

      await loadInsights(nextMosqueId);
      setLastRefresh(new Date());
    } catch (error) {
      console.error("Mosque stats load failed:", error);
      setStatsError("تعذر تحديث إحصائيات المسجد");
    } finally {
      setStatsLoading(false);
    }
  }

  async function refreshSelectedMosque() {
    await changeMosque(mosqueId);
  }

  const scrollToStats = () => {
    document.getElementById("stats")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <div className="landing-page">
      {/* HERO */}
      <section
        id="home"
        className="landing-hero"
        ref={heroRef}
      >
        <div className="landing-container landing-hero-grid">
          <Reveal>
            <div className="landing-hero-copy">
              <div className="landing-hero-badge">
                <MoonStar />
                منصة لإدارة الحلقات وصناعة الأثر
              </div>

              <h1>
                الصِّديق
                <span>
                  إدارة للحلقة، وعناية بمسيرة الطالب
                </span>
              </h1>

              <p className="landing-hero-description">
                منصة متكاملة تساعد الإدارة والمشرف والمعلم
                على متابعة الطالب من الحضور والتسميع والخطط
                التعليمية إلى الإنجاز والتحفيز والعناية المبكرة.
              </p>


              <div className="landing-hero-actions">
                <button
                  type="button"
                  className="landing-primary-button"
                  onClick={() => navigate("/login")}
                >
                  <LogIn size={18} />
                  تسجيل الدخول
                </button>

                <button
                  type="button"
                  className="landing-secondary-button"
                  onClick={scrollToStats}
                >
                  استكشف الإحصائيات
                  <ArrowLeft size={17} />
                </button>
              </div>

              <div className="landing-trust-row">
                <span className="landing-trust-item">
                  <ShieldCheck />
                  مؤشرات عامة بلا بيانات شخصية
                </span>

                <span className="landing-trust-item">
                  <Activity />
                  إحصائيات متجددة
                </span>

                <span className="landing-trust-item">
                  <Eye />
                  رؤية موحدة للأثر
                </span>
              </div>
            </div>
          </Reveal>

          <Reveal delay={110}>
            <div className="landing-hero-visual">
              <div className="landing-orbit">
                <span className="landing-orbit-dot" />

                <TiltCard className="landing-brand-core">
                  <img
                    src="/icon-512.png"
                    alt="شعار الصديق"
                  />
                </TiltCard>

                <div className="landing-floating-card one">
                  <strong>
                    <AnimatedNumber value={allStats.students} />
                  </strong>
                  <span>طالب في المنظومة</span>
                </div>

                <div className="landing-floating-card two">
                  <strong>
                    <AnimatedNumber
                      value={allStats.attendance}
                      suffix="%"
                      maximumFractionDigits={1}
                    />
                  </strong>
                  <span>متوسط الحضور</span>
                </div>

                <div className="landing-floating-card three">
                  <strong>
                    <AnimatedNumber value={allStats.recitations} />
                  </strong>
                  <span>تسميعة هذا الشهر</span>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* GLOBAL STATS */}
      <div className="landing-global-stats">
        <div className="landing-container">
          <Reveal>
            <div className="landing-global-stats-grid">
              <div className="landing-global-stat">
                <strong>
                  <AnimatedNumber value={allStats.halaqat} />
                </strong>
                <span>حلقة نشطة</span>
              </div>

              <div className="landing-global-stat">
                <strong>
                  <AnimatedNumber value={allStats.teachers} />
                </strong>
                <span>معلمًا</span>
              </div>

              <div className="landing-global-stat">
                <strong>
                  <AnimatedNumber value={allStats.students} />
                </strong>
                <span>طالبًا حاليًا</span>
              </div>

              <div className="landing-global-stat">
                <strong>
                  <AnimatedNumber
                    value={allStats.attendance}
                    suffix="%"
                    maximumFractionDigits={1}
                  />
                </strong>
                <span>متوسط الحضور</span>
              </div>
            </div>
          </Reveal>
        </div>
      </div>

      {/* MOSQUE EXPLORER */}
      <section id="stats" className="landing-section">
        <div className="landing-container">
          <Reveal>
            <div className="landing-section-header">
              <div className="landing-eyebrow">
                <BarChart3 />
                مستكشف الأثر
              </div>

              <h2>اختر مسجدًا… وشاهد نبض حلقاته</h2>

              <p>
                إحصائيات عامة ومجمعة تساعد الزائر على رؤية
                النشاط والإنجاز والحضور والتحفيز دون كشف أي
                بيانات شخصية.
              </p>
            </div>
          </Reveal>

          <Reveal delay={90}>
            <div className="landing-explorer-shell">
              <div className="landing-explorer-top">
                <div className="landing-explorer-title">
                  <strong>{selectedMosque.name}</strong>
                  <span>{selectedMosque.subtitle}</span>

                  {statsLoading && (
                    <div className="landing-status-line loading">
                      <span className="landing-status-dot" />
                      جاري تحديث الإحصائيات…
                    </div>
                  )}

                  {statsError && (
                    <div className="landing-status-line error">
                      <span className="landing-status-dot" />
                      {statsError}
                    </div>
                  )}
                </div>

                <div className="landing-explorer-actions">
                  <button
                    type="button"
                    className={`landing-refresh-button ${
                      statsLoading ? "is-loading" : ""
                    }`}
                    onClick={refreshSelectedMosque}
                    disabled={statsLoading}
                    title="تحديث الإحصائيات"
                    aria-label="تحديث الإحصائيات"
                  >
                    <RefreshCw size={18} />
                  </button>

                  <div className="landing-mosque-select">
                    <select
                      value={mosqueId}
                      onChange={(event) =>
                        changeMosque(event.target.value)
                      }
                      disabled={statsLoading}
                      aria-label="اختيار المسجد"
                    >
                      <option value="all">جميع المساجد</option>

                      {mosques.map((mosque) => (
                        <option
                          key={mosque.id}
                          value={String(mosque.id)}
                        >
                          {mosque.name}
                        </option>
                      ))}
                    </select>

                    <ChevronDown />
                  </div>
                </div>
              </div>

              <div className="landing-mosque-chips">
                {directoryItems.map((mosque) => (
                  <button
                    key={mosque.id}
                    type="button"
                    className={`landing-mosque-chip ${
                      mosqueId === mosque.id ? "is-active" : ""
                    }`}
                    onClick={() => changeMosque(mosque.id)}
                    disabled={statsLoading}
                  >
                    <Landmark />
                    {mosque.name}
                  </button>
                ))}
              </div>

              <div className="landing-location-line">
                {mosqueId === "all" ? (
                  <>
                    <Activity />
                    آخر تحديث: {" "}
                    {formatUpdatedAt(
                      selectedMosque.generatedAt || lastRefresh
                    )}
                  </>
                ) : (
                  <>
                    <MapPin />
                    {insights.address ||
                      mosques.find(
                        (mosque) =>
                          String(mosque.id) === mosqueId
                      )?.address ||
                      "إحصائيات المسجد المختار"}
                  </>
                )}
              </div>

              {statsLoading ? (
                <StatsSkeleton />
              ) : (
                <div className="landing-stats-grid">
                  {statCards.map(
                    ({ icon: Icon, label, value, note }) => (
                      <TiltCard
                        className="landing-stat-card"
                        key={label}
                      >
                        <div className="landing-stat-icon">
                          <Icon />
                        </div>

                        <strong>
                          <AnimatedNumber value={value} />
                        </strong>

                        <span className="label">{label}</span>
                        <span className="note">{note}</span>
                      </TiltCard>
                    )
                  )}
                </div>
              )}

              <div className="landing-insight-grid">
                <div className="landing-progress-panel">
                  <ProgressRing
                    value={selectedMosque.attendance}
                    label="نسبة الحضور"
                    caption="انتظام الحضور خلال الشهر الحالي."
                  />

                  <ProgressRing
                    value={selectedMosque.achievement}
                    label="الإنجاز الشهري"
                    caption="مدى تحقيق المستهدفات الشهرية المعتمدة."
                  />
                </div>

                <div className="landing-health-panel">
                  <div className="landing-health-kicker">
                    <Gauge />
                    مؤشر صحة الحلقات
                  </div>

                  <div className="landing-health-score">
                    <strong>
                      <AnimatedNumber
                        value={selectedMosque.health}
                        maximumFractionDigits={1}
                      />
                    </strong>
                    <span>/ 100</span>
                  </div>

                  <div className="landing-health-status">
                    {healthLabel}
                  </div>

                  <div className="landing-health-bar">
                    <span
                      style={{
                        width: `${selectedMosque.health}%`,
                      }}
                    />
                  </div>

                  <div className="landing-health-note">
                    مؤشر مركب يجمع الحضور والإنجاز ونشاط
                    التسميع الأسبوعي ليعطي قراءة سريعة عن
                    حيوية الحلقات.
                  </div>
                </div>
              </div>

              <div className="landing-halaqa-insights">
                <div className="landing-capacity-card">
                  <div className="landing-card-head">
                    <div className="landing-card-title">
                      <div className="landing-card-title-icon">
                        <UsersRound />
                      </div>

                      <div>
                        <strong>إشغال الحلقات</strong>
                        <span>
                          الطلاب الحاليون مقابل الطاقة الاستيعابية
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="landing-capacity-score">
                    <strong>
                      <AnimatedNumber
                        value={insights.occupancyRate}
                        suffix="%"
                        maximumFractionDigits={1}
                      />
                    </strong>
                    <span>نسبة الإشغال</span>
                  </div>

                  <div className="landing-capacity-track">
                    <span
                      style={{
                        width: `${insights.occupancyRate}%`,
                      }}
                    />
                  </div>

                  <div className="landing-capacity-meta">
                    <div className="landing-mini-metric">
                      <strong>
                        <AnimatedNumber
                          value={insights.currentStudents}
                        />
                      </strong>
                      <span>طلاب حاليون</span>
                    </div>

                    <div className="landing-mini-metric">
                      <strong>
                        <AnimatedNumber
                          value={insights.totalCapacity}
                        />
                      </strong>
                      <span>إجمالي السعة</span>
                    </div>

                    <div className="landing-mini-metric">
                      <strong>
                        <AnimatedNumber
                          value={insights.activeHalaqat}
                        />
                      </strong>
                      <span>حلقات نشطة</span>
                    </div>
                  </div>
                </div>

                <div className="landing-periods-card">
                  <div className="landing-card-head">
                    <div className="landing-card-title">
                      <div className="landing-card-title-icon">
                        <Clock3 />
                      </div>

                      <div>
                        <strong>أوقات الحلقات</strong>
                        <span>
                          توزيع الحلقات النشطة حسب الفترة
                        </span>
                      </div>
                    </div>

                    <div className="landing-card-title-icon">
                      <Layers3 />
                    </div>
                  </div>

                  {PERIODS.some(
                    (period) => insights.periods[period.key] > 0
                  ) ? (
                    <div className="landing-periods-list">
                      {PERIODS.map((period) => {
                        const count =
                          insights.periods[period.key] || 0;
                        const maxPeriod = Math.max(
                          1,
                          ...PERIODS.map(
                            (item) =>
                              insights.periods[item.key] || 0
                          )
                        );
                        const width = (count / maxPeriod) * 100;
                        const Icon = period.icon;

                        return (
                          <div
                            key={period.key}
                            className={`landing-period-row ${
                              activePeriod === period.key
                                ? "is-active"
                                : ""
                            }`}
                            onClick={() =>
                              setActivePeriod(
                                activePeriod === period.key
                                  ? "all"
                                  : period.key
                              )
                            }
                            role="button"
                            tabIndex={0}
                            onKeyDown={(event) => {
                              if (
                                event.key === "Enter" ||
                                event.key === " "
                              ) {
                                setActivePeriod(
                                  activePeriod === period.key
                                    ? "all"
                                    : period.key
                                );
                              }
                            }}
                          >
                            <div className="landing-period-name">
                              <Icon />
                              {period.label}
                            </div>

                            <div className="landing-period-track">
                              <span
                                style={{ width: `${width}%` }}
                              />
                            </div>

                            <div className="landing-period-count">
                              {count}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="landing-period-empty">
                      نفّذ ملف SQL المرفق لعرض توزيع الحلقات
                      حسب الفجر والظهر والعصر والمغرب والعشاء.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* LIVE PULSE */}
      <section className="landing-section">
        <div className="landing-container">
          <Reveal>
            <div className="landing-pulse-shell">
              <div className="landing-pulse-head">
                <div className="landing-pulse-title">
                  <span className="landing-pulse-dot" />
                  <strong>نبض الصديق</strong>
                </div>

                <span>
                  مؤشرات للفترة الحالية • {" "}
                  {formatUpdatedAt(
                    selectedMosque.generatedAt || lastRefresh
                  )}
                </span>
              </div>

              <div className="landing-pulse-grid">
                <div className="landing-pulse-card">
                  <strong>
                    <AnimatedNumber
                      value={selectedMosque.activeToday}
                    />
                  </strong>
                  <span>حلقة لديها نشاط اليوم</span>
                </div>

                <div className="landing-pulse-card">
                  <strong>
                    <AnimatedNumber
                      value={selectedMosque.studentsToday}
                    />
                  </strong>
                  <span>طالبًا تمت متابعتهم اليوم</span>
                </div>

                <div className="landing-pulse-card">
                  <strong>
                    <AnimatedNumber
                      value={selectedMosque.weeklyRecitations}
                    />
                  </strong>
                  <span>تسميعة خلال آخر 7 أيام</span>
                </div>

                <div className="landing-pulse-card">
                  <strong>
                    <AnimatedNumber
                      value={activityScore}
                      suffix="%"
                      maximumFractionDigits={1}
                    />
                  </strong>
                  <span>كثافة التسميع الأسبوعية</span>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* WHY SADIQ */}
      <section id="why-sadiq" className="landing-section">
        <div className="landing-container">
          <Reveal>
            <div className="landing-section-header">
              <div className="landing-eyebrow">
                <Sparkles />
                لماذا الصديق؟
              </div>

              <h2>أكثر من برنامج إدارة</h2>

              <p>
                الصديق لا يتعامل مع الحلقة كمجموعة سجلات، بل
                كمنظومة تعليمية هدفها نجاح الطالب واستمراره
                وتطوره.
              </p>
            </div>
          </Reveal>

          <div className="landing-why-grid">
            {WHY_SADIQ.map(
              ({ icon: Icon, title, text }, index) => (
                <Reveal key={title} delay={index * 70}>
                  <TiltCard className="landing-why-card">
                    <div className="landing-why-icon">
                      <Icon />
                    </div>

                    <h3>{title}</h3>
                    <p>{text}</p>
                  </TiltCard>
                </Reveal>
              )
            )}
          </div>
        </div>
      </section>

      {/* JOURNEY */}
      <section id="journey" className="landing-section">
        <div className="landing-container">
          <Reveal>
            <div className="landing-section-header">
              <div className="landing-eyebrow">
                <Network />
                رحلة الطالب
              </div>

              <h2>من التسجيل إلى الإنجاز</h2>

              <p>
                نربط مراحل رحلة الطالب ببعضها، حتى تكون
                المتابعة عملية مستمرة وليست أحداثًا منفصلة.
              </p>
            </div>
          </Reveal>

          <Reveal delay={80}>
            <div className="landing-journey-shell">
              <div className="landing-journey-line" />

              <div className="landing-journey-grid">
                {JOURNEY.map((item) => (
                  <article
                    key={item.number}
                    className="landing-journey-item"
                  >
                    <div className="landing-journey-number">
                      {item.number}
                    </div>

                    <h3>{item.title}</h3>
                    <p>{item.text}</p>
                  </article>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="landing-section">
        <div className="landing-container">
          <Reveal>
            <div className="landing-section-header">
              <div className="landing-eyebrow">
                <NotebookTabs />
                المنصة
              </div>

              <h2>كل ما تحتاجه الحلقة في مكان واحد</h2>

              <p>
                أدوات عملية تم تصميمها لتساعد الإدارة والمشرف
                والمعلم على التركيز على جودة العملية التعليمية.
              </p>
            </div>
          </Reveal>

          <div className="landing-features-grid">
            {FEATURES.map(
              ({ icon: Icon, title, description }, index) => (
                <Reveal key={title} delay={(index % 4) * 60}>
                  <TiltCard className="landing-feature-card">
                    <div className="landing-feature-icon">
                      <Icon />
                    </div>

                    <h3>{title}</h3>
                    <p>{description}</p>
                  </TiltCard>
                </Reveal>
              )
            )}
          </div>
        </div>
      </section>

      {/* ROLES */}
      <section className="landing-section">
        <div className="landing-container">
          <Reveal>
            <div className="landing-section-header">
              <div className="landing-eyebrow">
                <UsersRound />
                لكل دور رؤيته
              </div>

              <h2>تجربة مصممة حسب المسؤولية</h2>

              <p>
                كل مستخدم يحصل على الأدوات والمعلومات التي
                يحتاجها دون ازدحام أو تشتيت.
              </p>
            </div>
          </Reveal>

          <div className="landing-roles-grid">
            {ROLES.map(
              ({ icon: Icon, title, text }, index) => (
                <Reveal key={title} delay={index * 65}>
                  <TiltCard className="landing-role-card">
                    <Icon />
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </TiltCard>
                </Reveal>
              )
            )}
          </div>
        </div>
      </section>

      {/* STUDENT CARE */}
      <section className="landing-section">
        <div className="landing-container">
          <Reveal>
            <div className="landing-care-shell">
              <div className="landing-care-copy">
                <div className="landing-eyebrow">
                  <HeartHandshake />
                  العناية بالطالب
                </div>

                <h2>
                  لا ننتظر حتى يصبح التعثر مشكلة كبيرة
                </h2>

                <p>
                  عندما تبدأ مؤشرات الحضور أو التسميع أو
                  الإنجاز في الانخفاض، يصبح من الممكن لفت
                  انتباه المعلم والمشرف مبكرًا واتخاذ خطوة
                  مناسبة.
                </p>

                <div className="landing-care-list">
                  <div className="landing-care-list-item">
                    <CheckCircle2 />
                    اكتشاف انخفاض الحضور
                  </div>

                  <div className="landing-care-list-item">
                    <CheckCircle2 />
                    متابعة انقطاع التسميع
                  </div>

                  <div className="landing-care-list-item">
                    <CheckCircle2 />
                    رصد ضعف الإنجاز الشهري
                  </div>

                  <div className="landing-care-list-item">
                    <CheckCircle2 />
                    توثيق المتابعة والتواصل
                  </div>
                </div>
              </div>

              <div className="landing-care-visual">
                {[
                  {
                    icon: CalendarCheck2,
                    title: "انتظام الحضور",
                    text: "الملاحظة المبكرة للغياب المتكرر.",
                  },
                  {
                    icon: BookOpen,
                    title: "استمرارية التسميع",
                    text: "معرفة الطالب الذي توقف نشاطه قبل تراكم التأخر.",
                  },
                  {
                    icon: Target,
                    title: "الإنجاز مقابل الهدف",
                    text: "قياس واضح لما تم تحقيقه مقارنة بالخطة.",
                  },
                  {
                    icon: HeartHandshake,
                    title: "تدخل إنساني مبكر",
                    text: "البيانات تساعد المعلم، لكنها لا تستبدل دوره التربوي.",
                  },
                ].map(({ icon: Icon, title, text }) => (
                  <div
                    key={title}
                    className="landing-risk-card"
                  >
                    <div className="landing-risk-icon">
                      <Icon />
                    </div>

                    <div className="landing-risk-copy">
                      <strong>{title}</strong>
                      <span>{text}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="landing-cta">
        <div className="landing-container">
          <Reveal>
            <div className="landing-cta-shell">
              <div className="landing-cta-icon">
                <Star />
              </div>

              <h2>
                خلف كل رقم طالب، وخلف كل طالب رحلة تستحق
                المتابعة
              </h2>

              <p>
                الصديق — لأن إدارة الحلقة تبدأ بالبيانات،
                لكن غايتها بناء الطالب وتحسين مسيرته التعليمية.
              </p>

              <button
                type="button"
                className="landing-primary-button"
                onClick={() => navigate("/login")}
              >
                دخول الصديق
                <ArrowUpLeft size={18} />
              </button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="landing-footer">
        <div className="landing-container landing-footer-inner">
          <div className="landing-footer-brand">
            <img src="/icon-512.png" alt="الصديق" />

            <div>
              <strong>الصِّديق</strong>
              <span>إدارة الحلقات والعناية بالطالب</span>
            </div>
          </div>

          <div className="landing-footer-copy">
            © {new Date().getFullYear()} الصديق — جميع الحقوق محفوظة
          </div>
        </div>
      </footer>
    </div>
  );
}
