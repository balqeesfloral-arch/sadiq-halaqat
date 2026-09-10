import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Award,
  Clock3,
  Maximize2,
  Minimize2,
  RefreshCw,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";

import { supabase } from "../lib/supabase";
import { showToast } from "../components/Toast";

import HalaqaFilter from "../components/tv/HalaqaFilter";
import TopThreePodium from "../components/tv/TopThreePodium";
import LeaderboardTable from "../components/tv/LeaderboardTable";
import QuoteBanner from "../components/tv/QuoteBanner";
import PageFooter from "../components/tv/PageFooter";

import "../styles/TVLeaderboardPage.css";

/*
  غيّر الامتداد فقط إذا كانت زخارفك JPG / SVG.
  حسب ملفاتك الظاهرة في assets نستخدم Z-5 و Z-6.
*/
import ornamentMain from "../assets/Z-5.png";
import ornamentCorner from "../assets/Z-6.png";

const PAGE_DURATION = 40;
const DATA_REFRESH_INTERVAL = 60 * 1000;

const QUOTES = [
  "خيركم من تعلم القرآن وعلمه",
  "أهل القرآن هم أهل الله وخاصته",
  "كل آية تحفظها ترفعك درجة",
  "اجعل القرآن ربيع قلبك",
  "من سار على الدرب وصل",
  "بالقرآن تسمو الهمم وتطمئن القلوب",
  "رفيق القرآن لا يضل طريقه",
  "خطوة اليوم في الحفظ، ثمرة العمر غداً",
];

function buildPageRanges(total) {
  if (total <= 0) return [];

  const ranges = [];

  ranges.push({
    start: 0,
    end: Math.min(10, total),
  });

  let start = 10;

  while (start < total) {
    ranges.push({
      start,
      end: Math.min(start + 20, total),
    });

    start += 20;
  }

  return ranges;
}

function formatTime(date) {
  return new Intl.DateTimeFormat("ar-SA", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

function formatDate(date) {
  return new Intl.DateTimeFormat("ar-SA", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export default function TVLeaderboardPage() {
  const [halaqat, setHalaqat] = useState([]);
  const [selectedHalaqatIds, setSelectedHalaqatIds] = useState([]);

  const [students, setStudents] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [currentPage, setCurrentPage] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(PAGE_DURATION);

  const [now, setNow] = useState(new Date());
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);

  const [quoteIndex, setQuoteIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const fetchHalaqat = useCallback(async () => {
    const { data, error } = await supabase
      .from("halaqat")
      .select("id, name, status")
      .order("name", {
        ascending: true,
      });

    if (error) {
      console.error("TV halaqat error:", error);
      throw error;
    }

    setHalaqat(data || []);
  }, []);

  const fetchStudents = useCallback(
    async ({ silent = false } = {}) => {
      try {
        if (!silent) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }

        /*
          نقرأ روابط الطلاب الحالية أولاً.
          هذه الطريقة أكثر أماناً من الاعتماد على اسم FK محدد
          داخل Supabase.
        */
        let linksQuery = supabase
          .from("student_halaqat")
          .select("student_id, halaqa_id")
          .eq("is_current", true);

        if (selectedHalaqatIds.length > 0) {
          linksQuery = linksQuery.in(
            "halaqa_id",
            selectedHalaqatIds
          );
        }

        const {
          data: links,
          error: linksError,
        } = await linksQuery;

        if (linksError) throw linksError;

        if (!links?.length) {
          setStudents([]);
          setCurrentPage(0);
          setSecondsLeft(PAGE_DURATION);
          setLastUpdatedAt(new Date());
          return;
        }

        const studentIds = [
          ...new Set(
            links
              .map((item) => item.student_id)
              .filter(Boolean)
          ),
        ];

        const halaqaIds = [
          ...new Set(
            links
              .map((item) => item.halaqa_id)
              .filter(Boolean)
          ),
        ];

        const [
          profilesResult,
          halaqatResult,
        ] = await Promise.all([
          supabase
            .from("profiles")
            .select(
              "id, full_name, total_points"
            )
            .in("id", studentIds),

          supabase
            .from("halaqat")
            .select("id, name")
            .in("id", halaqaIds),
        ]);

        if (profilesResult.error) {
          throw profilesResult.error;
        }

        if (halaqatResult.error) {
          throw halaqatResult.error;
        }

        const profilesMap = new Map(
          (profilesResult.data || []).map(
            (profile) => [
              profile.id,
              profile,
            ]
          )
        );

        const halaqatMap = new Map(
          (halaqatResult.data || []).map(
            (halaqa) => [
              halaqa.id,
              halaqa,
            ]
          )
        );

        /*
          لو كان الطالب مرتبطاً بأكثر من حلقة حالية - لأي سبب -
          نظهره مرة واحدة فقط.
        */
        const studentsMap = new Map();

        links.forEach((link) => {
          if (
            studentsMap.has(link.student_id)
          ) {
            return;
          }

          const profile = profilesMap.get(
            link.student_id
          );

          if (!profile) return;

          const halaqa = halaqatMap.get(
            link.halaqa_id
          );

          studentsMap.set(
            link.student_id,
            {
              id: profile.id,
              full_name:
                profile.full_name ||
                "طالب بدون اسم",
              total_points: Number(
                profile.total_points || 0
              ),
              halaqa_id: link.halaqa_id,
              halaqa_name:
                halaqa?.name ||
                "بدون حلقة",
            }
          );
        });

        const sorted = Array.from(
          studentsMap.values()
        ).sort((a, b) => {
          const pointsDifference =
            b.total_points -
            a.total_points;

          if (pointsDifference !== 0) {
            return pointsDifference;
          }

          return a.full_name.localeCompare(
            b.full_name,
            "ar"
          );
        });

        /*
          الترتيب الرسمي.
          في حالة التساوي بالنقاط، يُحسم أبجدياً.
        */
        const ranked = sorted.map(
          (student, index) => ({
            ...student,
            rank: index + 1,
          })
        );

        setStudents(ranked);
        setCurrentPage(0);
        setSecondsLeft(PAGE_DURATION);
        setLastUpdatedAt(new Date());
      } catch (error) {
        console.error(
          "TV leaderboard error:",
          error
        );

        showToast(
          "تعذر تحميل بيانات لوحة الشرف.",
          "error"
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [selectedHalaqatIds]
  );

  useEffect(() => {
    async function initialize() {
      try {
        await fetchHalaqat();
      } catch (error) {
        showToast(
          "تعذر تحميل قائمة الحلقات.",
          "error"
        );
      }
    }

    initialize();
  }, [fetchHalaqat]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  /*
    تحديث الساعة كل ثانية.
  */
  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  /*
    تحديث البيانات تلقائياً كل دقيقة بدون إزعاج الشاشة.
  */
  useEffect(() => {
    const interval = window.setInterval(() => {
      fetchStudents({
        silent: true,
      });
    }, DATA_REFRESH_INTERVAL);

    return () => {
      window.clearInterval(interval);
    };
  }, [fetchStudents]);

  const pageRanges = useMemo(
    () => buildPageRanges(students.length),
    [students.length]
  );

  /*
    إذا تغير عدد الطلاب وصار رقم الصفحة الحالي غير موجود.
  */
  useEffect(() => {
    if (
      pageRanges.length > 0 &&
      currentPage >= pageRanges.length
    ) {
      setCurrentPage(0);
      setSecondsLeft(PAGE_DURATION);
    }
  }, [
    currentPage,
    pageRanges.length,
  ]);

  /*
    العد التنازلي والتنقل بين الصفحات.
  */
  useEffect(() => {
    if (pageRanges.length <= 1) {
      setSecondsLeft(PAGE_DURATION);
      return undefined;
    }

    const interval = window.setInterval(() => {
      setSecondsLeft((previous) => {
        if (previous <= 1) {
          setCurrentPage(
            (page) =>
              (page + 1) %
              pageRanges.length
          );

          setQuoteIndex(
            (index) =>
              (index + 1) %
              QUOTES.length
          );

          return PAGE_DURATION;
        }

        return previous - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [pageRanges.length]);

  const currentRange =
    pageRanges[currentPage] || {
      start: 0,
      end: 0,
    };

  const isFirstPage =
    currentPage === 0;

  const podiumStudents =
    students.slice(0, 3);

  const visibleStudents =
    isFirstPage
      ? students.slice(
          Math.max(3, currentRange.start),
          currentRange.end
        )
      : students.slice(
          currentRange.start,
          currentRange.end
        );

  const halaqaOptions = useMemo(
    () =>
      halaqat.map((halaqa) => ({
        value: halaqa.id,
        label: halaqa.name,
      })),
    [halaqat]
  );

  const handleHalaqaChange = (
    newValue
  ) => {
    setSelectedHalaqatIds(
      Array.isArray(newValue)
        ? newValue
        : []
    );

    setCurrentPage(0);
    setSecondsLeft(PAGE_DURATION);
  };

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error(error);

      showToast(
        "تعذر تشغيل وضع ملء الشاشة.",
        "error"
      );
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(
        Boolean(document.fullscreenElement)
      );
    };

    document.addEventListener(
      "fullscreenchange",
      handleFullscreenChange
    );

    return () => {
      document.removeEventListener(
        "fullscreenchange",
        handleFullscreenChange
      );
    };
  }, []);

  const currentPageLabel =
    currentRange.end > 0
      ? `${currentRange.start + 1} - ${
          currentRange.end
        }`
      : "0";

  return (
    <div
      className="tv-page"
      dir="rtl"
    >
      <div
        className="tv-background-pattern tv-background-pattern--one"
        style={{
          backgroundImage: `url(${ornamentMain})`,
        }}
      />

      <div
        className="tv-background-pattern tv-background-pattern--two"
        style={{
          backgroundImage: `url(${ornamentCorner})`,
        }}
      />

      <div className="tv-page__glow tv-page__glow--one" />
      <div className="tv-page__glow tv-page__glow--two" />

      <main className="tv-shell">
        <header className="tv-header">
          <div className="tv-header__brand">
            <div className="tv-header__logo">
              <Trophy
                size={34}
                strokeWidth={1.8}
              />
            </div>

            <div>
              <div className="tv-header__eyebrow">
                <Sparkles size={15} />
                برنامج الصِّدّيق
              </div>

              <h1>
                لوحة شرف طلاب الصِّدّيق
              </h1>

              <p>
                تنافسٌ في الخير • وارتقاءٌ
                مع كتاب الله
              </p>
            </div>
          </div>

          <div className="tv-header__actions">
            <div className="tv-clock-card">
              <Clock3 size={20} />

              <div>
                <strong>
                  {formatTime(now)}
                </strong>

                <span>
                  {formatDate(now)}
                </span>
              </div>
            </div>

            <button
              type="button"
              className="tv-icon-button"
              onClick={() =>
                fetchStudents({
                  silent: true,
                })
              }
              disabled={refreshing}
              title="تحديث البيانات"
            >
              <RefreshCw
                size={20}
                className={
                  refreshing
                    ? "tv-spin"
                    : ""
                }
              />
            </button>

            <button
              type="button"
              className="tv-icon-button"
              onClick={toggleFullscreen}
              title="ملء الشاشة"
            >
              {isFullscreen ? (
                <Minimize2 size={20} />
              ) : (
                <Maximize2 size={20} />
              )}
            </button>
          </div>
        </header>

        <section className="tv-toolbar">
          <div className="tv-toolbar__filter">
            <div className="tv-section-label">
              <Award size={18} />
              نطاق لوحة الشرف
            </div>

            <HalaqaFilter
              value={selectedHalaqatIds}
              onChange={handleHalaqaChange}
              options={halaqaOptions}
            />
          </div>

          <div className="tv-toolbar__summary">
            <div className="tv-mini-stat">
              <Users size={19} />

              <div>
                <span>
                  الطلاب
                </span>

                <strong>
                  {students.length}
                </strong>
              </div>
            </div>

            <div className="tv-mini-stat">
              <Trophy size={19} />

              <div>
                <span>
                  أعلى نقاط
                </span>

                <strong>
                  {students[0]
                    ?.total_points || 0}
                </strong>
              </div>
            </div>
          </div>
        </section>

        <QuoteBanner
          quote={QUOTES[quoteIndex]}
        />

        {loading ? (
          <div className="tv-state-card">
            <div className="tv-loader" />

            <strong>
              جارٍ إعداد لوحة الشرف
            </strong>

            <span>
              يتم تحميل الطلاب وترتيب
              النقاط...
            </span>
          </div>
        ) : students.length === 0 ? (
          <div className="tv-state-card">
            <Trophy
              size={48}
              strokeWidth={1.5}
            />

            <strong>
              لا توجد بيانات للعرض
            </strong>

            <span>
              لا يوجد طلاب مرتبطون
              بالحلقات المحددة حالياً.
            </span>
          </div>
        ) : (
          <>
            {isFirstPage &&
              podiumStudents.length >
                0 && (
                <TopThreePodium
                  students={
                    podiumStudents
                  }
                />
              )}

            <LeaderboardTable
              students={
                visibleStudents
              }
              compact={!isFirstPage}
            />
          </>
        )}

        <PageFooter
          totalStudents={students.length}
          currentPage={
            pageRanges.length
              ? currentPage + 1
              : 0
          }
          totalPages={pageRanges.length}
          secondsLeft={secondsLeft}
          pageLabel={currentPageLabel}
          lastUpdatedAt={
            lastUpdatedAt
          }
        />
      </main>
    </div>
  );
}