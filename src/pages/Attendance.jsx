import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  Clock3,
  FileCheck2,
  Filter,
  Loader2,
  RefreshCw,
  Search,
  Users,
  UserRound,
  X,
  XCircle,
  CircleSlash2,
  ClipboardCheck,
  Activity,
  AlertTriangle,
  BarChart3,
  BookOpen,
  Building2,
  ChevronLeft,
  Eye,
  History,
  ListChecks,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  UserCheck,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useToast } from "../components/Toast";

export default function Attendance() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [halaqat, setHalaqat] = useState([]);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState([]);

  const [selectedHalaqa, setSelectedHalaqa] =
    useState("");

  const [selectedDate, setSelectedDate] =
    useState(getLocalDate());

  const [search, setSearch] = useState("");

  const [loading, setLoading] =
    useState(false);

  const [initialLoading, setInitialLoading] =
    useState(true);

  const [savingStudentId, setSavingStudentId] =
    useState(null);

  const [bulkSaving, setBulkSaving] =
    useState(false);

  const [showOnlyUnrecorded, setShowOnlyUnrecorded] =
    useState(false);

  useEffect(() => {
    loadHalaqat();
  }, []);

  useEffect(() => {
    if (halaqat.length > 0) {
      loadAttendanceData();
    }
  }, [selectedDate, halaqat]);

  // ==========================================
  // DATE
  // ==========================================

  function getLocalDate(date = new Date()) {
    const year = date.getFullYear();

    const month = String(
      date.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
      date.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  function formatDateArabic(dateString) {
    const date = new Date(
      `${dateString}T00:00:00`
    );

    return date.toLocaleDateString(
      "ar-SA",
      {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    );
  }

  function formatShortDate(dateString) {
    const date = new Date(
      `${dateString}T00:00:00`
    );

    return date.toLocaleDateString(
      "ar-SA",
      {
        day: "numeric",
        month: "short",
      }
    );
  }

  // ==========================================
  // LOAD HALAQAT
  // ==========================================

  async function loadHalaqat() {
    setInitialLoading(true);

    try {
      const { data, error } =
        await supabase
          .from("halaqat")
          .select("*")
          .order("id");

      if (error) {
        throw error;
      }

      const halaqatData = data || [];

      setHalaqat(halaqatData);

      if (
        halaqatData.length > 0 &&
        !selectedHalaqa
      ) {
        setSelectedHalaqa(
          String(halaqatData[0].id)
        );
      }
    } catch (error) {
      console.error(error);

      showToast(
        error.message ||
          "تعذر تحميل الحلقات",
        "error"
      );
    } finally {
      setInitialLoading(false);
    }
  }

  // ==========================================
  // LOAD ATTENDANCE
  // ==========================================

  async function loadAttendanceData() {
    setLoading(true);

    try {
      const {
        data: assignments,
        error: assignmentsError,
      } = await supabase
        .from("student_halaqat")
        .select("*");

      if (assignmentsError) {
        throw assignmentsError;
      }

      if (!assignments?.length) {
        setStudents([]);
        setAttendance([]);
        return;
      }

      const studentIds = [
        ...new Set(
          assignments.map(
            (item) => item.student_id
          )
        ),
      ];

      const {
        data: profiles,
        error: profilesError,
      } = await supabase
        .from("profiles")
        .select(
          "id, full_name, user_number, phone, status"
        )
        .in("id", studentIds);

      if (profilesError) {
        throw profilesError;
      }

      const {
        data: attendanceData,
        error: attendanceError,
      } = await supabase
        .from("attendance")
        .select("*")
        .eq(
          "attendance_date",
          selectedDate
        );

      if (attendanceError) {
        throw attendanceError;
      }

      const studentsWithHalaqa =
        (assignments || [])
          .filter(
            (assignment) =>
              assignment.is_current !== false
          )
          .map((assignment) => {
            const profile =
              (profiles || []).find(
                (student) =>
                  Number(student.id) ===
                  Number(
                    assignment.student_id
                  )
              );

            return {
              ...(profile || {}),

              student_id:
                assignment.student_id,

              halaqa_id:
                assignment.halaqa_id,
            };
          })
          .filter(
            (student) =>
              student.id
          );

      setStudents(
        studentsWithHalaqa
      );

      setAttendance(
        attendanceData || []
      );
    } catch (error) {
      console.error(error);

      showToast(
        error.message ||
          "تعذر تحميل بيانات الحضور",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }

  // ==========================================
  // STUDENTS
  // ==========================================

  function getStudentsForHalaqa(
    halaqaId
  ) {
    return students.filter(
      (student) =>
        Number(
          student.halaqa_id
        ) === Number(halaqaId)
    );
  }

  function getAttendanceRecord(
    studentId,
    halaqaId
  ) {
    return attendance.find(
      (record) =>
        Number(
          record.student_id
        ) === Number(studentId) &&
        Number(
          record.halaqa_id
        ) === Number(halaqaId) &&
        record.attendance_date ===
          selectedDate
    );
  }

  // ==========================================
  // STATS
  // ==========================================

  function getHalaqaStats(
    halaqaId
  ) {
    const halaqaStudents =
      getStudentsForHalaqa(
        halaqaId
      );

    const total =
      halaqaStudents.length;

    let present = 0;
    let absent = 0;
    let late = 0;
    let excused = 0;

    halaqaStudents.forEach(
      (student) => {
        const record =
          getAttendanceRecord(
            student.student_id,
            halaqaId
          );

        if (!record) return;

        if (
          record.status ===
          "present"
        ) {
          present++;
        }

        if (
          record.status ===
          "absent"
        ) {
          absent++;
        }

        if (
          record.status ===
          "late"
        ) {
          late++;
        }

        if (
          record.status ===
          "excused"
        ) {
          excused++;
        }
      }
    );

    const recorded =
      present +
      absent +
      late +
      excused;

    const unrecorded =
      Math.max(
        total - recorded,
        0
      );

    const attendancePercentage =
      total > 0
        ? Math.round(
            ((present + late) /
              total) *
              100
          )
        : 0;

    return {
      total,
      present,
      absent,
      late,
      excused,
      recorded,
      unrecorded,
      attendancePercentage,
    };
  }

  // ==========================================
  // SELECTED HALAQA
  // ==========================================

  const selectedHalaqaData =
    useMemo(() => {
      return halaqat.find(
        (h) =>
          Number(h.id) ===
          Number(selectedHalaqa)
      );
    }, [
      halaqat,
      selectedHalaqa,
    ]);

  const selectedStats =
    useMemo(() => {
      if (!selectedHalaqa) {
        return {
          total: 0,
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
          recorded: 0,
          unrecorded: 0,
          attendancePercentage: 0,
        };
      }

      return getHalaqaStats(
        selectedHalaqa
      );
    }, [
      selectedHalaqa,
      students,
      attendance,
      selectedDate,
    ]);

  // ==========================================
  // FILTER STUDENTS
  // ==========================================

  const filteredStudents =
    useMemo(() => {
      let result =
        getStudentsForHalaqa(
          selectedHalaqa
        );

      const text =
        search
          .trim()
          .toLowerCase();

      if (text) {
        result = result.filter(
          (student) => {
            const name =
              (
                student.full_name ||
                ""
              ).toLowerCase();

            const number =
              String(
                student.user_number ||
                  ""
              ).toLowerCase();

            return (
              name.includes(text) ||
              number.includes(text)
            );
          }
        );
      }

      if (showOnlyUnrecorded) {
        result =
          result.filter(
            (student) =>
              !getAttendanceRecord(
                student.student_id,
                selectedHalaqa
              )
          );
      }

      return result;
    }, [
      students,
      selectedHalaqa,
      search,
      showOnlyUnrecorded,
      attendance,
      selectedDate,
    ]);

  // ==========================================
  // GLOBAL STATS
  // ==========================================

  const globalStats =
    useMemo(() => {
      let total = 0;
      let present = 0;
      let absent = 0;
      let late = 0;
      let excused = 0;

      halaqat.forEach(
        (halaqa) => {
          const stats =
            getHalaqaStats(
              halaqa.id
            );

          total += stats.total;
          present += stats.present;
          absent += stats.absent;
          late += stats.late;
          excused += stats.excused;
        }
      );

      const recorded =
        present +
        absent +
        late +
        excused;

      return {
        total,
        present,
        absent,
        late,
        excused,
        recorded,
        unrecorded:
          Math.max(
            total - recorded,
            0
          ),
        percentage:
          total > 0
            ? Math.round(
                ((present + late) /
                  total) *
                  100
              )
            : 0,
      };
    }, [
      halaqat,
      students,
      attendance,
      selectedDate,
    ]);

  // ==========================================
  // SAVE ONE STUDENT
  // ==========================================

  async function saveAttendance(
    studentId,
    status
  ) {
    if (!selectedHalaqa) {
      showToast(
        "اختر الحلقة أولًا",
        "error"
      );
      return;
    }

    setSavingStudentId(
      studentId
    );

    try {
      const {
        data: existingRecord,
        error: findError,
      } = await supabase
        .from("attendance")
        .select("id")
        .eq(
          "student_id",
          studentId
        )
        .eq(
          "halaqa_id",
          Number(selectedHalaqa)
        )
        .eq(
          "attendance_date",
          selectedDate
        )
        .maybeSingle();

      if (findError) {
        throw findError;
      }

      let error = null;

      if (existingRecord) {
        const result =
          await supabase
            .from("attendance")
            .update({
              status,
            })
            .eq(
              "id",
              existingRecord.id
            );

        error = result.error;
      } else {
        const result =
          await supabase
            .from("attendance")
            .insert([
              {
                student_id:
                  studentId,

                halaqa_id:
                  Number(
                    selectedHalaqa
                  ),

                attendance_date:
                  selectedDate,

                status,
              },
            ]);

        error = result.error;
      }

      if (error) {
        throw error;
      }

      const student =
        students.find(
          (item) =>
            Number(
              item.student_id
            ) ===
            Number(studentId)
        );

      showToast(
        `${student?.full_name || "الطالب"} — ${getStatusLabel(
          status
        )}`,
        "success"
      );

      await loadAttendanceData();
    } catch (error) {
      console.error(error);

      showToast(
        error.message ||
          "تعذر حفظ الحضور",
        "error"
      );
    } finally {
      setSavingStudentId(
        null
      );
    }
  }

  // ==========================================
  // BULK ATTENDANCE
  // ==========================================

  async function markAll(
    status
  ) {
    if (!selectedHalaqa) {
      showToast(
        "اختر الحلقة أولًا",
        "error"
      );
      return;
    }

    const halaqaStudents =
      getStudentsForHalaqa(
        selectedHalaqa
      );

    if (
      halaqaStudents.length ===
      0
    ) {
      showToast(
        "لا يوجد طلاب في هذه الحلقة",
        "info"
      );
      return;
    }

    const label =
      getStatusLabel(status);

    const confirmed =
      window.confirm(
        `هل تريد تسجيل جميع طلاب الحلقة "${selectedHalaqaData?.name || ""}" كـ "${label}" ليوم ${formatShortDate(
          selectedDate
        )}؟`
      );

    if (!confirmed) return;

    setBulkSaving(true);

    try {
      const rows =
        halaqaStudents.map(
          (student) => ({
            student_id:
              student.student_id,

            halaqa_id:
              Number(
                selectedHalaqa
              ),

            attendance_date:
              selectedDate,

            status,
          })
        );

      /*
       * نحاول التحديث أولًا للسجلات الموجودة،
       * ثم نضيف السجلات غير الموجودة.
       */

      const existingIds =
        new Set(
          attendance
            .filter(
              (record) =>
                Number(
                  record.halaqa_id
                ) ===
                  Number(
                    selectedHalaqa
                  ) &&
                record.attendance_date ===
                  selectedDate
            )
            .map(
              (record) =>
                Number(
                  record.student_id
                )
            )
        );

      const existingRows =
        rows.filter(
          (row) =>
            existingIds.has(
              Number(
                row.student_id
              )
            )
        );

      const newRows =
        rows.filter(
          (row) =>
            !existingIds.has(
              Number(
                row.student_id
              )
            )
        );

      if (
        existingRows.length >
        0
      ) {
        const studentIds =
          existingRows.map(
            (row) =>
              row.student_id
          );

        const {
          error: updateError,
        } = await supabase
          .from("attendance")
          .update({
            status,
          })
          .eq(
            "halaqa_id",
            Number(selectedHalaqa)
          )
          .eq(
            "attendance_date",
            selectedDate
          )
          .in(
            "student_id",
            studentIds
          );

        if (updateError) {
          throw updateError;
        }
      }

      if (
        newRows.length > 0
      ) {
        const {
          error: insertError,
        } = await supabase
          .from("attendance")
          .insert(
            newRows
          );

        if (insertError) {
          throw insertError;
        }
      }

      showToast(
        `تم تسجيل ${label} لجميع طلاب الحلقة`,
        "success"
      );

      await loadAttendanceData();
    } catch (error) {
      console.error(error);

      showToast(
        error.message ||
          "تعذر تسجيل الحضور الجماعي",
        "error"
      );
    } finally {
      setBulkSaving(false);
    }
  }

  // ==========================================
  // DATE NAVIGATION
  // ==========================================

  function changeDate(days) {
    const current =
      new Date(
        `${selectedDate}T00:00:00`
      );

    current.setDate(
      current.getDate() +
        days
    );

    const newDate =
      getLocalDate(current);

    const today =
      getLocalDate();

    if (newDate > today) {
      showToast(
        "لا يمكن تسجيل حضور لتاريخ مستقبلي",
        "info"
      );
      return;
    }

    setSelectedDate(
      newDate
    );
  }

  function goToToday() {
    setSelectedDate(
      getLocalDate()
    );
  }

  // ==========================================
  // ADMINISTRATIVE INTELLIGENCE
  // ==========================================

  const halaqaOperationalRows = useMemo(() => {
    return halaqat.map((halaqa) => {
      const stats = getHalaqaStats(halaqa.id);
      let level = "good";
      let label = "مستقرة";

      if (stats.unrecorded > 0) {
        level = "pending";
        label = "التسجيل غير مكتمل";
      }

      if (stats.absent >= 3 || (stats.total > 0 && stats.attendancePercentage < 70)) {
        level = "risk";
        label = "تحتاج متابعة";
      }

      return { halaqa, stats, level, label };
    });
  }, [halaqat, students, attendance, selectedDate]);

  const incompleteHalaqat = halaqaOperationalRows.filter(
    (item) => item.stats.unrecorded > 0
  ).length;

  const riskHalaqat = halaqaOperationalRows.filter(
    (item) => item.level === "risk"
  ).length;

  const fullyRecordedHalaqat = halaqaOperationalRows.filter(
    (item) => item.stats.total > 0 && item.stats.unrecorded === 0
  ).length;

  const selectedDayLabel =
    selectedDate === getLocalDate() ? "اليوم" : formatShortDate(selectedDate);

  function selectHalaqaForRecords(id) {
    setSelectedHalaqa(String(id));
    setSearch("");
    setShowOnlyUnrecorded(false);
    setTimeout(() => {
      document.getElementById("attendance-records")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 40);
  }

  // ==========================================
  // RENDER
  // ==========================================

  if (initialLoading) {
    return (
      <AdminAttendanceShell>
        <LoadingScreen />
      </AdminAttendanceShell>
    );
  }

  return (
    <AdminAttendanceShell>
      <section className="aa-hero">
        <div className="aa-ornament aa-ornament-a" />
        <div className="aa-ornament aa-ornament-b" />

        <div className="aa-hero-main">
          <div className="aa-hero-copy">
            <div className="aa-eyebrow">
              <ShieldCheck size={14} />
              بوابة المشرف · الرقابة التشغيلية
            </div>

            <div className="aa-title-row">
              <button
                type="button"
                className="aa-back"
                onClick={() => navigate("/admin")}
                aria-label="العودة إلى لوحة المشرف"
              >
                <ArrowRight size={19} />
              </button>

              <div className="aa-title-mark">
                <ClipboardCheck size={24} strokeWidth={1.7} />
              </div>

              <div>
                <h1>إدارة الحضور</h1>
                <p>
                  مركز إداري لمراقبة الالتزام، مراجعة السجلات، واكتشاف الحالات التي تحتاج متابعة.
                </p>
              </div>
            </div>
          </div>

          <div className="aa-hero-actions">
            <button
              type="button"
              className="aa-refresh"
              onClick={loadAttendanceData}
              disabled={loading}
            >
              {loading ? <Loader2 size={16} className="aa-spin" /> : <RefreshCw size={16} />}
              تحديث البيانات
            </button>

            <div className="aa-date-chip">
              <CalendarDays size={17} />
              <div>
                <span>نطاق العرض</span>
                <strong>{selectedDayLabel}</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="aa-hero-footer">
          <div>
            <span>نسبة الالتزام</span>
            <strong>{globalStats.percentage}%</strong>
          </div>
          <div>
            <span>الحلقات المكتملة</span>
            <strong>{fullyRecordedHalaqat}</strong>
          </div>
          <div>
            <span>تسجيل غير مكتمل</span>
            <strong>{incompleteHalaqat}</strong>
          </div>
          <div>
            <span>تحتاج متابعة</span>
            <strong>{riskHalaqat}</strong>
          </div>
        </div>
      </section>

      <section className="aa-toolbar">
        <div className="aa-toolbar-title">
          <CalendarDays size={17} />
          <div>
            <span>تاريخ السجل الإداري</span>
            <strong>{formatDateArabic(selectedDate)}</strong>
          </div>
        </div>

        <div className="aa-date-controls">
          <button type="button" onClick={() => changeDate(-1)}>
            <ArrowRight size={15} /> السابق
          </button>

          <input
            type="date"
            value={selectedDate}
            max={getLocalDate()}
            onChange={(event) => setSelectedDate(event.target.value)}
          />

          <button type="button" className="aa-today" onClick={goToToday}>
            اليوم
          </button>

          <button
            type="button"
            onClick={() => changeDate(1)}
            disabled={selectedDate === getLocalDate()}
          >
            التالي <ArrowLeft size={15} />
          </button>
        </div>
      </section>

      <section className="aa-kpis">
        <AdminKpi icon={<Users size={18} />} label="الطلاب المشمولون" value={globalStats.total} note="في الحلقات المسجلة" />
        <AdminKpi icon={<UserCheck size={18} />} label="الحضور الفعلي" value={globalStats.present} note={`${globalStats.percentage}% نسبة الالتزام`} tone="success" />
        <AdminKpi icon={<XCircle size={18} />} label="الغياب المسجل" value={globalStats.absent} note="يحتاج مراجعة عند التكرار" tone="danger" />
        <AdminKpi icon={<Clock3 size={18} />} label="حالات التأخر" value={globalStats.late} note="مؤشر انضباط يومي" tone="warning" />
        <AdminKpi icon={<CircleSlash2 size={18} />} label="لم يكتمل تسجيلهم" value={globalStats.unrecorded} note="بانتظار استكمال السجل" tone="neutral" />
      </section>

      <section className="aa-intelligence">
        <div className="aa-section-heading">
          <div>
            <span className="aa-section-kicker"><Activity size={14} /> مركز المتابعة الذكي</span>
            <h2>ملخص الحالة التشغيلية</h2>
            <p>قراءة إدارية مباشرة من سجلات التاريخ المحدد لتحديد الأولويات بسرعة.</p>
          </div>

          <div className="aa-health">
            <div className="aa-health-ring" style={{ "--value": `${globalStats.percentage}%` }}>
              <span>{globalStats.percentage}%</span>
            </div>
            <div>
              <strong>مؤشر الالتزام</strong>
              <small>الحاضر والمتأخر من إجمالي الطلاب</small>
            </div>
          </div>
        </div>

        <div className="aa-intelligence-grid">
          <SmartNotice
            icon={<AlertTriangle size={17} />}
            title="حلقات تحتاج استكمال السجل"
            value={incompleteHalaqat}
            text="يوجد طلاب لم تسجل لهم حالة حضور في التاريخ المحدد."
            tone={incompleteHalaqat ? "warning" : "success"}
          />
          <SmartNotice
            icon={<Target size={17} />}
            title="حلقات تحتاج متابعة"
            value={riskHalaqat}
            text="مؤشر مبني على انخفاض الحضور أو ارتفاع الغياب في السجل المعروض."
            tone={riskHalaqat ? "danger" : "success"}
          />
          <SmartNotice
            icon={<FileCheck2 size={17} />}
            title="سجلات مكتملة"
            value={fullyRecordedHalaqat}
            text="حلقات اكتمل تسجيل جميع طلابها في التاريخ المحدد."
            tone="success"
          />
        </div>
      </section>

      <section className="aa-operations">
        <div className="aa-section-heading compact">
          <div>
            <span className="aa-section-kicker"><Building2 size={14} /> الرقابة على الحلقات</span>
            <h2>حالة تسجيل الحضور حسب الحلقة</h2>
            <p>استعرض حالة كل حلقة وانتقل مباشرة إلى سجلها التفصيلي.</p>
          </div>
          <span className="aa-count">{halaqat.length} حلقة</span>
        </div>

        {halaqat.length === 0 ? (
          <EmptyHalaqat />
        ) : (
          <div className="aa-halaqat-table">
            <div className="aa-table-head">
              <span>الحلقة</span>
              <span>الطلاب</span>
              <span>الحضور</span>
              <span>الغياب</span>
              <span>التأخر</span>
              <span>غير مسجل</span>
              <span>الالتزام</span>
              <span>الحالة</span>
              <span />
            </div>

            {halaqaOperationalRows.map(({ halaqa, stats, level, label }) => (
              <div className="aa-table-row" key={halaqa.id}>
                <div className="aa-halaqa-name">
                  <div className="aa-halaqa-icon"><BookOpen size={17} /></div>
                  <div>
                    <strong>{halaqa.name}</strong>
                    <small>سجل الحلقة</small>
                  </div>
                </div>
                <strong>{stats.total}</strong>
                <span className="aa-positive">{stats.present}</span>
                <span className="aa-negative">{stats.absent}</span>
                <span className="aa-warning-text">{stats.late}</span>
                <span>{stats.unrecorded}</span>
                <div className="aa-rate">
                  <strong>{stats.attendancePercentage}%</strong>
                  <div><i style={{ width: `${stats.attendancePercentage}%` }} /></div>
                </div>
                <span className={`aa-state ${level}`}>{label}</span>
                <button
                  type="button"
                  className="aa-open-record"
                  onClick={() => selectHalaqaForRecords(halaqa.id)}
                >
                  <Eye size={14} /> فتح السجل
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section id="attendance-records" className="aa-records">
        <div className="aa-records-head">
          <div>
            <span className="aa-section-kicker"><History size={14} /> السجل المركزي</span>
            <h2>سجلات الحضور التفصيلية</h2>
            <p>
              مراجعة السجل الإداري للطلاب. التسجيل اليومي الأساسي يبقى في واجهة المعلم.
            </p>
          </div>

          <div className="aa-record-selector">
            <label>الحلقة</label>
            <select value={selectedHalaqa} onChange={(event) => setSelectedHalaqa(event.target.value)}>
              {halaqat.map((halaqa) => (
                <option key={halaqa.id} value={halaqa.id}>{halaqa.name}</option>
              ))}
            </select>
          </div>
        </div>

        {selectedHalaqa ? (
          <>
            <div className="aa-record-summary">
              <RecordMetric label="إجمالي الطلاب" value={selectedStats.total} />
              <RecordMetric label="حاضر" value={selectedStats.present} tone="success" />
              <RecordMetric label="غائب" value={selectedStats.absent} tone="danger" />
              <RecordMetric label="متأخر" value={selectedStats.late} tone="warning" />
              <RecordMetric label="معتذر" value={selectedStats.excused} />
              <RecordMetric label="غير مسجل" value={selectedStats.unrecorded} tone="neutral" />
            </div>

            <div className="aa-record-tools">
              <div className="aa-search">
                <Search size={17} />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="ابحث باسم الطالب أو رقم الطالب..."
                />
                {search && (
                  <button type="button" onClick={() => setSearch("")}><X size={14} /></button>
                )}
              </div>

              <button
                type="button"
                className={showOnlyUnrecorded ? "aa-filter active" : "aa-filter"}
                onClick={() => setShowOnlyUnrecorded(!showOnlyUnrecorded)}
              >
                <Filter size={15} />
                {showOnlyUnrecorded ? "عرض جميع السجلات" : "غير المسجلين فقط"}
              </button>

              <div className="aa-result-count">
                <strong>{filteredStudents.length}</strong>
                <span>سجل</span>
              </div>
            </div>

            <div className="aa-student-table">
              <div className="aa-student-head">
                <span>الطالب</span>
                <span>رقم الطالب</span>
                <span>الحالة</span>
                <span>التاريخ</span>
              </div>

              {filteredStudents.length === 0 ? (
                <EmptyStudents search={search} onlyUnrecorded={showOnlyUnrecorded} />
              ) : (
                filteredStudents.map((student) => {
                  const record = getAttendanceRecord(student.student_id, selectedHalaqa);
                  return (
                    <div className="aa-student-row" key={student.student_id}>
                      <div className="aa-student-name">
                        <div><UserRound size={16} /></div>
                        <strong>{student.full_name}</strong>
                      </div>
                      <span>{student.user_number || "—"}</span>
                      <StatusBadge status={record?.status} />
                      <span>{formatShortDate(selectedDate)}</span>
                    </div>
                  );
                })
              )}
            </div>
          </>
        ) : (
          <div className="aa-empty-record">
            <ListChecks size={27} />
            <strong>اختر حلقة لعرض السجل</strong>
          </div>
        )}
      </section>

      <style>{`
        *{box-sizing:border-box}
        .aa-spin{animation:aaSpin .8s linear infinite}@keyframes aaSpin{to{transform:rotate(360deg)}}
        .aa-hero{position:relative;overflow:hidden;border:1px solid rgba(194,157,58,.36);border-radius:25px;background:linear-gradient(135deg,#073e33 0%,#095442 62%,#073d33 100%);color:#fff;box-shadow:0 18px 42px rgba(8,65,52,.12);margin-bottom:13px}
        .aa-ornament{position:absolute;width:180px;height:180px;opacity:.09;transform:rotate(45deg);border:1px solid #f0d171;pointer-events:none}.aa-ornament:before,.aa-ornament:after{content:"";position:absolute;inset:20px;border:1px solid #f0d171;transform:rotate(45deg)}.aa-ornament:after{inset:43px}.aa-ornament-a{top:-115px;left:-45px}.aa-ornament-b{bottom:-130px;right:-55px}
        .aa-hero-main{position:relative;z-index:1;display:flex;justify-content:space-between;align-items:center;gap:20px;padding:24px 25px 20px}.aa-eyebrow,.aa-section-kicker{display:inline-flex;align-items:center;gap:5px;color:#caa94e;font-size:9px;font-weight:900}.aa-title-row{display:flex;align-items:center;gap:10px;margin-top:8px}.aa-title-row h1{margin:0;font-size:29px;font-weight:950}.aa-title-row p{margin:5px 0 0;color:rgba(255,255,255,.67);font-size:10px;line-height:1.7}.aa-back,.aa-title-mark{width:42px;height:42px;flex:0 0 42px;border-radius:12px;display:grid;place-items:center;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.075);color:#fff}.aa-back{cursor:pointer}.aa-title-mark{color:#e8c967}
        .aa-hero-actions{display:flex;align-items:stretch;gap:8px}.aa-refresh{display:flex;align-items:center;gap:6px;padding:0 13px;min-height:48px;border:1px solid rgba(255,255,255,.16);border-radius:12px;background:rgba(255,255,255,.07);color:#fff;font:800 9px inherit;cursor:pointer}.aa-date-chip{min-width:128px;display:flex;align-items:center;gap:8px;padding:8px 11px;border-radius:12px;background:#fff;color:#17493a}.aa-date-chip>svg{color:#aa8427}.aa-date-chip span{display:block;color:#8c9791;font-size:7px}.aa-date-chip strong{display:block;margin-top:2px;font-size:10px}
        .aa-hero-footer{position:relative;z-index:1;display:grid;grid-template-columns:repeat(4,1fr);border-top:1px solid rgba(255,255,255,.1);background:rgba(0,0,0,.075)}.aa-hero-footer>div{padding:10px 16px;border-inline-start:1px solid rgba(255,255,255,.09)}.aa-hero-footer>div:first-child{border-inline-start:0}.aa-hero-footer span{display:block;color:rgba(255,255,255,.56);font-size:7px}.aa-hero-footer strong{display:block;margin-top:2px;color:#efd474;font-size:17px}
        .aa-toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 12px;margin-bottom:12px;background:#fff;border:1px solid #dfe6e2;border-radius:15px;box-shadow:0 5px 17px rgba(21,56,45,.035)}.aa-toolbar-title{display:flex;align-items:center;gap:8px}.aa-toolbar-title>svg{color:#a78022}.aa-toolbar-title span{display:block;color:#8b9690;font-size:7px}.aa-toolbar-title strong{display:block;color:#234a3d;font-size:10px;margin-top:1px}.aa-date-controls{display:flex;align-items:center;gap:5px}.aa-date-controls button,.aa-date-controls input{height:34px;border:1px solid #dce4df;border-radius:9px;background:#fff;color:#526159;font:750 8px inherit;padding:0 9px}.aa-date-controls button{display:flex;align-items:center;gap:4px;cursor:pointer}.aa-date-controls button:disabled{opacity:.35;cursor:not-allowed}.aa-date-controls .aa-today{background:#0b634e;color:#fff;border-color:#0b634e}
        .aa-kpis{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;margin-bottom:13px}.aa-kpi{min-width:0;background:#fff;border:1px solid #dfe7e2;border-radius:15px;padding:11px 12px;box-shadow:0 5px 17px rgba(21,56,45,.035)}.aa-kpi-top{display:flex;align-items:center;justify-content:space-between;gap:5px}.aa-kpi-icon{width:30px;height:30px;border-radius:9px;display:grid;place-items:center;background:#edf6f1;color:#0b654f}.aa-kpi.success .aa-kpi-icon{background:#ebf7ef;color:#187a50}.aa-kpi.danger .aa-kpi-icon{background:#fff0ee;color:#b53a2e}.aa-kpi.warning .aa-kpi-icon{background:#fff7e4;color:#9b761c}.aa-kpi.neutral .aa-kpi-icon{background:#f0f2f1;color:#6e7973}.aa-kpi label{color:#808d86;font-size:7px;font-weight:850}.aa-kpi strong{display:block;margin-top:5px;color:#153f31;font-size:19px;line-height:1}.aa-kpi small{display:block;margin-top:4px;color:#9aa39e;font-size:6px}
        .aa-intelligence,.aa-operations,.aa-records{background:#fff;border:1px solid #dfe6e2;border-radius:19px;box-shadow:0 7px 22px rgba(21,56,45,.04);margin-bottom:14px}.aa-intelligence{padding:16px}.aa-section-heading{display:flex;align-items:center;justify-content:space-between;gap:15px}.aa-section-heading.compact{padding:15px 16px 11px}.aa-section-heading h2{margin:3px 0 2px;color:#153f31;font-size:16px}.aa-section-heading p{margin:0;color:#8c9791;font-size:8px}.aa-health{display:flex;align-items:center;gap:8px;padding:7px 10px;border-radius:12px;background:#f7faf8;border:1px solid #e6ece8}.aa-health-ring{width:42px;height:42px;border-radius:50%;background:conic-gradient(#0b6b53 var(--value),#e7ece9 0);display:grid;place-items:center;position:relative}.aa-health-ring:after{content:"";position:absolute;inset:5px;border-radius:50%;background:#fff}.aa-health-ring span{position:relative;z-index:1;color:#0b5c48;font-size:8px;font-weight:950}.aa-health strong{display:block;color:#294b40;font-size:8px}.aa-health small{display:block;margin-top:2px;color:#939d97;font-size:6px}
        .aa-intelligence-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:12px}.aa-notice{display:grid;grid-template-columns:32px 1fr auto;align-items:center;gap:8px;padding:10px;border-radius:12px;border:1px solid #e7ece9;background:#fafcfb}.aa-notice-icon{width:32px;height:32px;border-radius:9px;display:grid;place-items:center;background:#edf6f1;color:#0b654f}.aa-notice.warning .aa-notice-icon{background:#fff7e3;color:#9c7416}.aa-notice.danger .aa-notice-icon{background:#fff0ee;color:#b43a2e}.aa-notice h3{margin:0;color:#345248;font-size:8px}.aa-notice p{margin:2px 0 0;color:#929c96;font-size:6px;line-height:1.5}.aa-notice>strong{color:#173f32;font-size:18px}
        .aa-count{padding:5px 9px;border-radius:999px;background:#eef6f2;color:#0b654f;font-size:8px;font-weight:900}.aa-halaqat-table{border-top:1px solid #edf1ee}.aa-table-head,.aa-table-row{display:grid;grid-template-columns:minmax(170px,1.7fr) repeat(5,.55fr) 1fr 1.1fr 92px;align-items:center;gap:8px;padding:9px 14px}.aa-table-head{background:#f8faf8;color:#88938d;font-size:7px;font-weight:900}.aa-table-row{min-height:56px;border-top:1px solid #edf1ee;color:#5c6962;font-size:8px}.aa-table-row:hover{background:#fbfcfb}.aa-halaqa-name{display:flex;align-items:center;gap:8px;min-width:0}.aa-halaqa-icon{width:31px;height:31px;flex:0 0 31px;border-radius:9px;display:grid;place-items:center;background:#edf6f1;color:#0b654f}.aa-halaqa-name strong{display:block;color:#27493e;font-size:9px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.aa-halaqa-name small{display:block;margin-top:2px;color:#a0a8a3;font-size:6px}.aa-positive{color:#14754d;font-weight:900}.aa-negative{color:#b23a2f;font-weight:900}.aa-warning-text{color:#9c7418;font-weight:900}.aa-rate strong{font-size:8px;color:#345348}.aa-rate>div{height:3px;margin-top:4px;border-radius:99px;background:#e8ece9;overflow:hidden}.aa-rate i{display:block;height:100%;border-radius:99px;background:#0d7459}.aa-state{display:inline-flex;justify-content:center;padding:4px 6px;border-radius:999px;font-size:6px;font-weight:900;background:#edf6f1;color:#0b654f}.aa-state.pending{background:#fff7e5;color:#956f16}.aa-state.risk{background:#fff0ee;color:#ad392e}.aa-open-record{height:30px;border:1px solid #dce6e1;border-radius:8px;background:#fff;color:#0b654f;font:850 7px inherit;display:flex;align-items:center;justify-content:center;gap:4px;cursor:pointer}
        .aa-records{overflow:hidden}.aa-records-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:15px 16px;border-bottom:1px solid #e9eeeb}.aa-records-head h2{margin:3px 0 2px;color:#153f31;font-size:16px}.aa-records-head p{margin:0;color:#8e9892;font-size:8px}.aa-record-selector{min-width:200px}.aa-record-selector label{display:block;margin-bottom:4px;color:#7d8982;font-size:7px;font-weight:900}.aa-record-selector select{width:100%;height:35px;border:1px solid #dce4df;border-radius:9px;background:#fff;color:#354f46;font:750 8px inherit;padding:0 8px}
        .aa-record-summary{display:grid;grid-template-columns:repeat(6,1fr);gap:1px;background:#e9eeeb;border-bottom:1px solid #e9eeeb}.aa-record-metric{background:#fbfcfb;padding:9px 11px}.aa-record-metric span{display:block;color:#8b9690;font-size:6px}.aa-record-metric strong{display:block;margin-top:2px;color:#294b40;font-size:14px}.aa-record-metric.success strong{color:#14754d}.aa-record-metric.danger strong{color:#b23a2f}.aa-record-metric.warning strong{color:#9b7418}.aa-record-metric.neutral strong{color:#737e78}
        .aa-record-tools{display:grid;grid-template-columns:1fr auto auto;align-items:center;gap:7px;padding:10px 14px;background:#fafbfa;border-bottom:1px solid #e9eeeb}.aa-search{position:relative}.aa-search>svg{position:absolute;right:11px;top:50%;transform:translateY(-50%);color:#89958e}.aa-search input{width:100%;height:36px;padding:0 36px;border:1px solid #dce4df;border-radius:9px;background:#fff;color:#344f45;font:700 8px inherit;outline:none}.aa-search input:focus{border-color:#72a593;box-shadow:0 0 0 3px rgba(11,101,79,.07)}.aa-search button{position:absolute;left:5px;top:50%;transform:translateY(-50%);width:25px;height:25px;border:0;border-radius:7px;background:#f0f3f1;color:#77827c;display:grid;place-items:center;cursor:pointer}.aa-filter{height:36px;padding:0 10px;border:1px solid #dce4df;border-radius:9px;background:#fff;color:#637169;font:800 7px inherit;display:flex;align-items:center;gap:4px;cursor:pointer}.aa-filter.active{background:#edf6f1;color:#0b654f;border-color:#cce1d7}.aa-result-count{min-width:48px;text-align:center}.aa-result-count strong{display:block;color:#16483a;font-size:12px}.aa-result-count span{display:block;color:#929c96;font-size:6px}
        .aa-student-head,.aa-student-row{display:grid;grid-template-columns:minmax(180px,1.7fr) 1fr 1fr 1fr;align-items:center;gap:10px;padding:9px 15px}.aa-student-head{background:#f8faf8;color:#89948e;font-size:7px;font-weight:900;border-bottom:1px solid #e9eeeb}.aa-student-row{min-height:51px;border-bottom:1px solid #edf1ee;color:#66736c;font-size:8px}.aa-student-row:last-child{border-bottom:0}.aa-student-row:hover{background:#fcfdfc}.aa-student-name{display:flex;align-items:center;gap:7px;min-width:0}.aa-student-name>div{width:29px;height:29px;flex:0 0 29px;border-radius:9px;display:grid;place-items:center;background:#edf6f1;color:#0b654f}.aa-student-name strong{color:#304f44;font-size:9px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.aa-empty-record{padding:45px 20px;text-align:center;color:#87938c}.aa-empty-record strong{display:block;margin-top:7px;font-size:10px}
        @media(max-width:1150px){.aa-kpis{grid-template-columns:repeat(3,1fr)}.aa-table-head,.aa-table-row{grid-template-columns:minmax(160px,1.5fr) repeat(3,.55fr) .8fr 1fr 85px}.aa-table-head>:nth-child(5),.aa-table-row>:nth-child(5),.aa-table-head>:nth-child(6),.aa-table-row>:nth-child(6){display:none}.aa-record-summary{grid-template-columns:repeat(3,1fr)}}
        @media(max-width:780px){.aa-hero-main{align-items:flex-start;flex-direction:column;padding:18px}.aa-hero-actions{width:100%}.aa-date-chip{flex:1}.aa-toolbar{align-items:flex-start;flex-direction:column}.aa-date-controls{width:100%;display:grid;grid-template-columns:auto 1fr auto auto}.aa-date-controls input{width:100%}.aa-kpis{grid-template-columns:repeat(2,1fr)}.aa-intelligence-grid{grid-template-columns:1fr}.aa-health{display:none}.aa-table-head{display:none}.aa-table-row{grid-template-columns:1fr repeat(3,55px);padding:10px 12px}.aa-table-row>:nth-child(5),.aa-table-row>:nth-child(6),.aa-table-row>:nth-child(7){display:none}.aa-state{justify-self:end}.aa-open-record{grid-column:1/-1;width:100%}.aa-records-head{align-items:flex-start;flex-direction:column}.aa-record-selector{width:100%}.aa-record-tools{grid-template-columns:1fr auto}.aa-search{grid-column:1/-1}.aa-student-head,.aa-student-row{grid-template-columns:minmax(150px,1.5fr) .8fr 1fr}.aa-student-head>:nth-child(4),.aa-student-row>:nth-child(4){display:none}}
        @media(max-width:500px){.aa-hero{border-radius:18px}.aa-hero-main{padding:14px 12px}.aa-eyebrow{font-size:7px}.aa-title-row{gap:7px}.aa-back,.aa-title-mark{width:35px;height:35px;flex-basis:35px;border-radius:10px}.aa-title-row h1{font-size:20px}.aa-title-row p{font-size:7px;line-height:1.6}.aa-hero-actions{display:grid;grid-template-columns:1fr 1fr}.aa-refresh{justify-content:center;min-height:41px}.aa-date-chip{min-width:0;padding:6px 8px}.aa-hero-footer>div{padding:7px 5px}.aa-hero-footer span{font-size:5.5px}.aa-hero-footer strong{font-size:13px}.aa-toolbar{padding:8px}.aa-toolbar-title strong{font-size:8px}.aa-date-controls{grid-template-columns:1fr 1fr}.aa-date-controls input{grid-column:1/-1;grid-row:1}.aa-date-controls button{justify-content:center}.aa-kpis{gap:5px}.aa-kpi{padding:8px;border-radius:11px}.aa-kpi-icon{width:25px;height:25px}.aa-kpi label{font-size:6px}.aa-kpi strong{font-size:15px;margin-top:3px}.aa-kpi small{font-size:5px;margin-top:2px}.aa-intelligence{padding:11px}.aa-section-heading h2,.aa-records-head h2{font-size:13px}.aa-section-heading p,.aa-records-head p{font-size:6.5px;line-height:1.5}.aa-notice{grid-template-columns:27px 1fr auto;padding:7px}.aa-notice-icon{width:27px;height:27px}.aa-notice h3{font-size:7px}.aa-notice p{font-size:5.5px}.aa-notice>strong{font-size:14px}.aa-table-row{grid-template-columns:1fr 43px 43px;padding:8px}.aa-table-row>:nth-child(4),.aa-table-row>:nth-child(8){display:none}.aa-halaqa-name strong{font-size:8px}.aa-record-summary{grid-template-columns:repeat(3,1fr)}.aa-record-metric{padding:7px}.aa-record-tools{padding:8px}.aa-filter{padding:0 7px}.aa-student-head,.aa-student-row{grid-template-columns:minmax(120px,1.5fr) .7fr 1fr;padding:8px}.aa-student-name>div{width:25px;height:25px;flex-basis:25px}.aa-student-name strong{font-size:7.5px}}
      `}</style>
    </AdminAttendanceShell>
  );
}

/* =========================================================
   PAGE SHELL
========================================================= */

function AdminAttendanceShell({ children }) {
  return (
    <div
      dir="rtl"
      style={{
        minHeight: "100vh",
        width: "100%",
        overflowX: "hidden",
        padding: "22px clamp(12px, 2vw, 30px) 40px",
        boxSizing: "border-box",
        background:
          "radial-gradient(circle at 8% 4%, rgba(183,145,43,.055), transparent 24%), radial-gradient(circle at 92% 12%, rgba(10,99,78,.055), transparent 25%), #f5f7f4",
        color: "#173d31",
      }}
    >
      <div style={{ width: "100%", maxWidth: "1680px", margin: "0 auto" }}>
        {children}
      </div>
    </div>
  );
}

/* =========================================================
   LOADING
========================================================= */

function LoadingScreen() {
  return (
    <div
      style={{
        minHeight:
          "70vh",
        display: "flex",
        alignItems:
          "center",
        justifyContent:
          "center",
        flexDirection:
          "column",
        gap: "14px",
        color: "#69746d",
      }}
    >
      <Loader2
        size={35}
        style={{
          color: "#0f5132",
          animation:
            "spin .8s linear infinite",
        }}
      />

      <strong>
        جارٍ تجهيز سجل الحضور...
      </strong>
    </div>
  );
}

function AdminKpi({ icon, label, value, note, tone = "primary" }) {
  return (
    <article className={`aa-kpi ${tone}`}>
      <div className="aa-kpi-top">
        <label>{label}</label>
        <div className="aa-kpi-icon">{icon}</div>
      </div>
      <strong>{value}</strong>
      <small>{note}</small>
    </article>
  );
}

function SmartNotice({ icon, title, value, text, tone = "success" }) {
  return (
    <article className={`aa-notice ${tone}`}>
      <div className="aa-notice-icon">{icon}</div>
      <div>
        <h3>{title}</h3>
        <p>{text}</p>
      </div>
      <strong>{value}</strong>
    </article>
  );
}

function RecordMetric({ label, value, tone = "" }) {
  return (
    <div className={`aa-record-metric ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

/* =========================================================
   SUMMARY CARD
========================================================= */

function SummaryCard({
  icon,
  title,
  value,
  description,
  tone = "primary",
}) {
  const tones = {
    primary: {
      background:
        "#edf5ef",
      color: "#0f5132",
    },

    success: {
      background:
        "#eaf7ef",
      color: "#198754",
    },

    danger: {
      background:
        "#fff0ef",
      color: "#b42318",
    },

    warning: {
      background:
        "#fff8e7",
      color: "#9a741f",
    },

    neutral: {
      background:
        "#f1f3f2",
      color: "#68736c",
    },
  };

  const current =
    tones[tone];

  return (
    <div
      style={{
        background:
          "#fff",
        border:
          "1px solid #e5e9e6",
        borderRadius:
          "17px",
        padding:
          "17px",
        boxShadow:
          "0 5px 18px rgba(0,0,0,.035)",
        display:
          "flex",
        alignItems:
          "center",
        gap: "12px",
      }}
    >
      <div
        style={{
          width: "44px",
          height: "44px",
          borderRadius:
            "13px",
          background:
            current.background,
          color:
            current.color,
          display:
            "flex",
          alignItems:
            "center",
          justifyContent:
            "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </div>

      <div>
        <div
          style={{
            color:
              "#808a83",
            fontSize:
              "11px",
            marginBottom:
              "3px",
          }}
        >
          {title}
        </div>

        <div
          style={{
            color:
              "#173d2b",
            fontSize:
              "23px",
            fontWeight:
              "850",
          }}
        >
          {value}
        </div>

        <div
          style={{
            color:
              "#9aa19c",
            fontSize:
              "9px",
            marginTop:
              "2px",
          }}
        >
          {description}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   HALAQA CARD
========================================================= */

function HalaqaCard({
  halaqa,
  stats,
  selected,
  onClick,
}) {
  const percentage =
    stats.attendancePercentage;

  return (
    <button
      type="button"
      onClick={onClick}
      className="attendance-hover"
      style={{
        width: "100%",
        textAlign: "right",
        background:
          "#fff",
        border: selected
          ? "2px solid #0f5132"
          : "1px solid #e2e7e3",
        borderRadius:
          "18px",
        padding:
          "18px",
        cursor:
          "pointer",
        boxShadow: selected
          ? "0 12px 28px rgba(15,81,50,.10)"
          : "0 5px 17px rgba(0,0,0,.035)",
        transition:
          "all .2s ease",
        position:
          "relative",
        overflow:
          "hidden",
      }}
    >
      {selected && (
        <div
          style={{
            position:
              "absolute",
            top: 0,
            right: 0,
            left: 0,
            height: "3px",
            background:
              "#0f5132",
          }}
        />
      )}

      <div
        style={{
          display:
            "flex",
          justifyContent:
            "space-between",
          alignItems:
            "center",
          gap: "13px",
        }}
      >
        <div
          style={{
            minWidth: 0,
          }}
        >
          <div
            style={{
              display:
                "flex",
              alignItems:
                "center",
              gap: "8px",
              marginBottom:
                "8px",
            }}
          >
            <div
              style={{
                width: "38px",
                height: "38px",
                borderRadius:
                  "11px",
                background:
                  "#edf5ef",
                color:
                  "#0f5132",
                display:
                  "flex",
                alignItems:
                  "center",
                justifyContent:
                  "center",
              }}
            >
              <Users
                size={18}
              />
            </div>

            <div
              style={{
                fontSize:
                  "16px",
                fontWeight:
                  "850",
                color:
                  "#173d2b",
                whiteSpace:
                  "nowrap",
                overflow:
                  "hidden",
                textOverflow:
                  "ellipsis",
              }}
            >
              {halaqa.name}
            </div>
          </div>

          <div
            style={{
              display:
                "flex",
              alignItems:
                "center",
              gap: "6px",
              color:
                "#8a938d",
              fontSize:
                "11px",
            }}
          >
            <Users
              size={13}
            />

            {stats.total} طالب

            <span>
              •
            </span>

            <FileCheck2
              size={13}
            />

            {stats.recorded} مسجل
          </div>
        </div>

        <AttendanceCircle
          percentage={
            percentage
          }
        />
      </div>

      <div
        style={{
          display:
            "grid",
          gridTemplateColumns:
            "repeat(4,1fr)",
          gap: "7px",
          marginTop:
            "17px",
        }}
      >
        <MiniStat
          value={
            stats.present
          }
          label="حاضر"
          tone="success"
        />

        <MiniStat
          value={
            stats.absent
          }
          label="غائب"
          tone="danger"
        />

        <MiniStat
          value={
            stats.late
          }
          label="متأخر"
          tone="warning"
        />

        <MiniStat
          value={
            stats.unrecorded
          }
          label="متبقي"
          tone="neutral"
        />
      </div>
    </button>
  );
}

/* =========================================================
   ATTENDANCE CIRCLE
========================================================= */

function AttendanceCircle({
  percentage,
}) {
  return (
    <div
      style={{
        width: "68px",
        height: "68px",
        borderRadius:
          "50%",
        background: `conic-gradient(#0f5132 ${percentage}%, #edf0ee ${percentage}% 100%)`,
        display:
          "flex",
        alignItems:
          "center",
        justifyContent:
          "center",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: "52px",
          height: "52px",
          borderRadius:
            "50%",
          background:
            "#fff",
          display:
            "flex",
          alignItems:
            "center",
          justifyContent:
            "center",
          flexDirection:
            "column",
        }}
      >
        <strong
          style={{
            color:
              "#0f5132",
            fontSize:
              "14px",
          }}
        >
          {percentage}%
        </strong>

        <span
          style={{
            color:
              "#8c958f",
            fontSize:
              "8px",
          }}
        >
          حضور
        </span>
      </div>
    </div>
  );
}

/* =========================================================
   MINI STAT
========================================================= */

function MiniStat({
  value,
  label,
  tone,
}) {
  const styles = {
    success: {
      background:
        "#f0f8f3",
      color:
        "#198754",
    },

    danger: {
      background:
        "#fff3f2",
      color:
        "#b42318",
    },

    warning: {
      background:
        "#fff9ea",
      color:
        "#927536",
    },

    neutral: {
      background:
        "#f4f5f4",
      color:
        "#737d76",
    },
  };

  const current =
    styles[tone];

  return (
    <div
      style={{
        background:
          current.background,
        borderRadius:
          "9px",
        padding:
          "8px 4px",
        textAlign:
          "center",
      }}
    >
      <div
        style={{
          color:
            current.color,
          fontSize:
            "14px",
          fontWeight:
            "850",
        }}
      >
        {value}
      </div>

      <div
        style={{
          color:
            "#8d958f",
          fontSize:
            "8px",
          marginTop:
            "2px",
        }}
      >
        {label}
      </div>
    </div>
  );
}

/* =========================================================
   STUDENT ROW
========================================================= */

function StudentAttendanceRow({
  student,
  record,
  index,
  saving,
  onSave,
}) {
  return (
    <div
      className="student-row"
      style={{
        display:
          "grid",
        gridTemplateColumns:
          "minmax(210px,1fr) auto",
        gap: "18px",
        alignItems:
          "center",
        padding:
          "13px 14px",
        borderBottom:
          "1px solid #edf0ee",
        background:
          index % 2 === 0
            ? "#fff"
            : "#fdfefd",
        transition:
          "background .15s ease",
      }}
    >
      {/* STUDENT */}

      <div
        style={{
          display:
            "flex",
          alignItems:
            "center",
          gap: "11px",
          minWidth: 0,
        }}
      >
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius:
              "12px",
            background:
              "#edf5ef",
            color:
              "#0f5132",
            display:
              "flex",
            alignItems:
              "center",
            justifyContent:
              "center",
            flexShrink: 0,
          }}
        >
          <UserRound
            size={19}
            strokeWidth={1.7}
          />
        </div>

        <div
          style={{
            minWidth: 0,
          }}
        >
          <div
            style={{
              color:
                "#26332c",
              fontSize:
                "13px",
              fontWeight:
                "800",
              whiteSpace:
                "nowrap",
              overflow:
                "hidden",
              textOverflow:
                "ellipsis",
            }}
          >
            {student.full_name}
          </div>

          <div
            style={{
              color:
                "#929a94",
              fontSize:
                "10px",
              marginTop:
                "3px",
            }}
          >
            رقم الطالب:{" "}
            {student.user_number ||
              "-"}
          </div>
        </div>
      </div>

      {/* STATUS + ACTIONS */}

      <div
        style={{
          display:
            "flex",
          alignItems:
            "center",
          justifyContent:
            "flex-end",
          gap: "8px",
          flexWrap:
            "wrap",
        }}
      >
        <StatusBadge
          status={
            record?.status
          }
        />

        <AttendanceButton
          label="حاضر"
          icon={
            <Check
              size={14}
            />
          }
          active={
            record?.status ===
            "present"
          }
          disabled={
            saving
          }
          onClick={() =>
            onSave(
              student.student_id,
              "present"
            )
          }
          tone="success"
        />

        <AttendanceButton
          label="غائب"
          icon={
            <X
              size={14}
            />
          }
          active={
            record?.status ===
            "absent"
          }
          disabled={
            saving
          }
          onClick={() =>
            onSave(
              student.student_id,
              "absent"
            )
          }
          tone="danger"
        />

        <AttendanceButton
          label="متأخر"
          icon={
            <Clock3
              size={14}
            />
          }
          active={
            record?.status ===
            "late"
          }
          disabled={
            saving
          }
          onClick={() =>
            onSave(
              student.student_id,
              "late"
            )
          }
          tone="warning"
        />

        <AttendanceButton
          label="معتذر"
          icon={
            <CircleSlash2
              size={14}
            />
          }
          active={
            record?.status ===
            "excused"
          }
          disabled={
            saving
          }
          onClick={() =>
            onSave(
              student.student_id,
              "excused"
            )
          }
          tone="neutral"
        />

        {saving && (
          <Loader2
            size={16}
            style={{
              color:
                "#0f5132",
              animation:
                "spin .8s linear infinite",
            }}
          />
        )}
      </div>
    </div>
  );
}

/* =========================================================
   ATTENDANCE BUTTON
========================================================= */

function AttendanceButton({
  label,
  icon,
  active,
  disabled,
  onClick,
  tone,
}) {
  const tones = {
    success: {
      activeBg:
        "#e8f6ed",
      activeColor:
        "#0f5132",
      activeBorder:
        "#0f5132",
    },

    danger: {
      activeBg:
        "#fff0ef",
      activeColor:
        "#b42318",
      activeBorder:
        "#b42318",
    },

    warning: {
      activeBg:
        "#fff8e6",
      activeColor:
        "#927536",
      activeBorder:
        "#c79d43",
    },

    neutral: {
      activeBg:
        "#eef0ef",
      activeColor:
        "#59635d",
      activeBorder:
        "#7d8780",
    },
  };

  const current =
    tones[tone];

  return (
    <button
      type="button"
      onClick={
        onClick
      }
      disabled={
        disabled
      }
      style={{
        display:
          "inline-flex",
        alignItems:
          "center",
        justifyContent:
          "center",
        gap: "5px",
        minWidth:
          "76px",
        padding:
          "7px 9px",
        borderRadius:
          "8px",
        border: active
          ? `1.5px solid ${current.activeBorder}`
          : "1px solid #dfe3e0",
        background:
          active
            ? current.activeBg
            : "#fff",
        color:
          active
            ? current.activeColor
            : "#6f7872",
        cursor:
          disabled
            ? "wait"
            : "pointer",
        fontSize:
          "10px",
        fontWeight:
          active
            ? "850"
            : "650",
        opacity:
          disabled
            ? 0.6
            : 1,
      }}
    >
      {icon}

      {label}
    </button>
  );
}

/* =========================================================
   STATUS BADGE
========================================================= */

function StatusBadge({
  status,
}) {
  const data = {
    present: {
      label:
        "حاضر",
      background:
        "#e8f6ed",
      color:
        "#0f5132",
    },

    absent: {
      label:
        "غائب",
      background:
        "#fff0ef",
      color:
        "#b42318",
    },

    late: {
      label:
        "متأخر",
      background:
        "#fff8e6",
      color:
        "#927536",
    },

    excused: {
      label:
        "معتذر",
      background:
        "#eef0ef",
      color:
        "#59635d",
    },
  };

  if (!status) {
    return (
      <span
        style={{
          minWidth:
            "70px",
          textAlign:
            "center",
          padding:
            "6px 9px",
          borderRadius:
            "18px",
          background:
            "#f5f6f5",
          color:
            "#929993",
          fontSize:
            "9px",
          fontWeight:
            "700",
        }}
      >
        لم يسجل
      </span>
    );
  }

  const current =
    data[status] ||
    data.excused;

  return (
    <span
      style={{
        minWidth:
          "70px",
        textAlign:
          "center",
        padding:
          "6px 9px",
        borderRadius:
          "18px",
        background:
          current.background,
        color:
          current.color,
        fontSize:
          "9px",
        fontWeight:
          "850",
      }}
    >
      {current.label}
    </span>
  );
}

/* =========================================================
   EMPTY
========================================================= */

function EmptyHalaqat() {
  return (
    <div
      style={
        emptyBoxStyle
      }
    >
      <Users
        size={30}
        strokeWidth={1.5}
      />

      <strong>
        لا توجد حلقات
      </strong>

      <span>
        أضف الحلقات أولًا حتى تتمكن من تسجيل الحضور.
      </span>
    </div>
  );
}

function EmptyStudents({
  search,
  onlyUnrecorded,
}) {
  return (
    <div
      style={{
        padding:
          "50px 20px",
        textAlign:
          "center",
        color:
          "#8a938d",
      }}
    >
      <Search
        size={31}
        strokeWidth={1.5}
        style={{
          marginBottom:
            "10px",
          color:
            "#0f5132",
        }}
      />

      <div
        style={{
          color:
            "#465149",
          fontWeight:
            "800",
          fontSize:
            "14px",
          marginBottom:
            "5px",
        }}
      >
        {search
          ? "لا توجد نتائج للبحث"
          : onlyUnrecorded
          ? "تم تسجيل جميع الطلاب"
          : "لا يوجد طلاب"}
      </div>

      <div
        style={{
          fontSize:
            "11px",
        }}
      >
        {search
          ? "جرب اسمًا أو رقمًا مختلفًا."
          : onlyUnrecorded
          ? "جميع طلاب الحلقة لديهم حالة مسجلة لهذا اليوم."
          : "لا يوجد طلاب مرتبطون بهذه الحلقة."}
      </div>
    </div>
  );
}

/* =========================================================
   HELPERS
========================================================= */

function getStatusLabel(
  status
) {
  const labels = {
    present:
      "حاضر",
    absent:
      "غائب",
    late:
      "متأخر",
    excused:
      "معتذر",
  };

  return (
    labels[status] ||
    status
  );
}

/* =========================================================
   STYLES
========================================================= */

const headerStyle = {
  display:
    "flex",
  justifyContent:
    "space-between",
  alignItems:
    "center",
  gap: "15px",
  flexWrap:
    "wrap",
  marginBottom:
    "22px",
};

const backButtonStyle = {
  display:
    "inline-flex",
  alignItems:
    "center",
  gap: "6px",
  padding:
    "10px 13px",
  border:
    "1px solid #dce1dd",
  borderRadius:
    "10px",
  background:
    "#fff",
  color:
    "#59635d",
  cursor:
    "pointer",
  fontSize:
    "11px",
  fontWeight:
    "750",
};

const headerIconStyle = {
  width: "48px",
  height: "48px",
  borderRadius:
    "14px",
  background:
    "#0f5132",
  color:
    "#fff",
  display:
    "flex",
  alignItems:
    "center",
  justifyContent:
    "center",
  boxShadow:
    "0 8px 20px rgba(15,81,50,.14)",
};

const pageTitleStyle = {
  margin: 0,
  color:
    "#173d2b",
  fontSize:
    "27px",
  fontWeight:
    "850",
};

const pageSubtitleStyle = {
  margin:
    "4px 0 0",
  color:
    "#7e8781",
  fontSize:
    "11px",
};

const refreshButtonStyle = {
  display:
    "inline-flex",
  alignItems:
    "center",
  gap: "7px",
  padding:
    "10px 14px",
  border:
    "1px solid #d9dfdb",
  borderRadius:
    "10px",
  background:
    "#fff",
  color:
    "#173d2b",
  cursor:
    "pointer",
  fontSize:
    "11px",
  fontWeight:
    "750",
};

const datePanelStyle = {
  background:
    "#fff",
  border:
    "1px solid #e2e7e3",
  borderRadius:
    "19px",
  padding:
    "18px",
  marginBottom:
    "20px",
  boxShadow:
    "0 5px 18px rgba(0,0,0,.035)",
};

const dateNavigationStyle = {
  display:
    "flex",
  alignItems:
    "center",
  gap: "15px",
};

const dateArrowButton = {
  display:
    "inline-flex",
  alignItems:
    "center",
  gap: "7px",
  padding:
    "10px 13px",
  border:
    "1px solid #dfe4e1",
  borderRadius:
    "10px",
  background:
    "#fff",
  color:
    "#4e5952",
  cursor:
    "pointer",
  fontSize:
    "10px",
  fontWeight:
    "750",
};

const dateSmallLabel = {
  display:
    "flex",
  alignItems:
    "center",
  justifyContent:
    "center",
  gap: "5px",
  color:
    "#8a938d",
  fontSize:
    "10px",
  marginBottom:
    "5px",
};

const dateMainText = {
  color:
    "#0f5132",
  fontSize:
    "17px",
  fontWeight:
    "850",
};

const dateBottomControls = {
  display:
    "flex",
  alignItems:
    "center",
  justifyContent:
    "center",
  gap: "8px",
  marginTop:
    "14px",
};

const dateInputStyle = {
  height: "39px",
  padding:
    "0 10px",
  border:
    "1px solid #d9dfdb",
  borderRadius:
    "9px",
  background:
    "#fff",
  color:
    "#36423b",
  outline:
    "none",
  fontSize:
    "11px",
  fontFamily:
    "inherit",
};

const todayButtonStyle = {
  height: "39px",
  padding:
    "0 15px",
  border:
    "none",
  borderRadius:
    "9px",
  background:
    "#0f5132",
  color:
    "#fff",
  cursor:
    "pointer",
  fontSize:
    "11px",
  fontWeight:
    "800",
};

const statsGridStyle = {
  display:
    "grid",
  gridTemplateColumns:
    "repeat(auto-fit,minmax(175px,1fr))",
  gap: "12px",
  marginBottom:
    "25px",
};

const sectionHeaderStyle = {
  display:
    "flex",
  alignItems:
    "center",
  justifyContent:
    "space-between",
  gap: "15px",
  marginBottom:
    "13px",
};

const sectionTitleStyle = {
  margin: 0,
  color:
    "#173d2b",
  fontSize:
    "19px",
  fontWeight:
    "850",
};

const sectionSubtitleStyle = {
  margin:
    "4px 0 0",
  color:
    "#8b938d",
  fontSize:
    "10px",
};

const overallPercentageStyle = {
  display:
    "flex",
  alignItems:
    "center",
  gap: "8px",
  color:
    "#8a938d",
  fontSize:
    "10px",
};

const halaqaGridStyle = {
  display:
    "grid",
  gridTemplateColumns:
    "repeat(auto-fit,minmax(270px,1fr))",
  gap: "13px",
  marginBottom:
    "25px",
};

const attendancePanelStyle = {
  background:
    "#fff",
  border:
    "1px solid #e1e6e2",
  borderRadius:
    "20px",
  overflow:
    "hidden",
  boxShadow:
    "0 7px 24px rgba(0,0,0,.045)",
  animation:
    "fadeUp .25s ease",
};

const panelHeaderStyle = {
  display:
    "flex",
  alignItems:
    "center",
  justifyContent:
    "space-between",
  gap: "15px",
  padding:
    "20px",
  borderBottom:
    "1px solid #edf0ee",
};

const panelEyebrowStyle = {
  display:
    "flex",
  alignItems:
    "center",
  gap: "6px",
  color:
    "#0f5132",
  fontSize:
    "9px",
  fontWeight:
    "850",
  marginBottom:
    "4px",
};

const liveDotStyle = {
  width: "6px",
  height: "6px",
  borderRadius:
    "50%",
  background:
    "#2e9f62",
};

const panelTitleStyle = {
  margin: 0,
  color:
    "#173d2b",
  fontSize:
    "21px",
  fontWeight:
    "850",
};

const panelSubtitleStyle = {
  margin:
    "4px 0 0",
  color:
    "#8c958f",
  fontSize:
    "10px",
};

const panelPercentageStyle = {
  width: "75px",
  height: "75px",
  borderRadius:
    "50%",
  background:
    "#edf5ef",
  display:
    "flex",
  alignItems:
    "center",
  justifyContent:
    "center",
  flexDirection:
    "column",
  color:
    "#0f5132",
  flexShrink: 0,
};

const quickActionsStyle = {
  display:
    "flex",
  gap: "8px",
  flexWrap:
    "wrap",
  padding:
    "14px 20px",
  background:
    "#fbfcfb",
  borderBottom:
    "1px solid #edf0ee",
};

const bulkPresentButton = {
  display:
    "inline-flex",
  alignItems:
    "center",
  gap: "6px",
  padding:
    "9px 12px",
  border:
    "1px solid #cfe5d7",
  borderRadius:
    "9px",
  background:
    "#edf8f1",
  color:
    "#0f5132",
  cursor:
    "pointer",
  fontSize:
    "10px",
  fontWeight:
    "800",
};

const bulkAbsentButton = {
  display:
    "inline-flex",
  alignItems:
    "center",
  gap: "6px",
  padding:
    "9px 12px",
  border:
    "1px solid #efd0cd",
  borderRadius:
    "9px",
  background:
    "#fff5f4",
  color:
    "#b42318",
  cursor:
    "pointer",
  fontSize:
    "10px",
  fontWeight:
    "800",
};

const filterButtonStyle = {
  display:
    "inline-flex",
  alignItems:
    "center",
  gap: "6px",
  padding:
    "9px 12px",
  border:
    "1px solid #dfe4e1",
  borderRadius:
    "9px",
  background:
    "#fff",
  color:
    "#69736d",
  cursor:
    "pointer",
  fontSize:
    "10px",
  fontWeight:
    "750",
};

const filterButtonActiveStyle = {
  background:
    "#edf5ef",
  color:
    "#0f5132",
  borderColor:
    "#bcd8c6",
};

const searchRowStyle = {
  display:
    "flex",
  alignItems:
    "center",
  gap: "12px",
  padding:
    "15px 20px",
  borderBottom:
    "1px solid #edf0ee",
};

const searchBoxStyle = {
  position:
    "relative",
  flex: 1,
};

const searchIconStyle = {
  position:
    "absolute",
  right: "13px",
  top: "50%",
  transform:
    "translateY(-50%)",
  color:
    "#89938c",
  pointerEvents:
    "none",
};

const searchInputStyle = {
  width: "100%",
  height: "42px",
  boxSizing:
    "border-box",
  padding:
    "0 40px 0 38px",
  border:
    "1px solid #dce2de",
  borderRadius:
    "10px",
  outline:
    "none",
  background:
    "#fff",
  color:
    "#354139",
  fontSize:
    "11px",
  fontFamily:
    "inherit",
};

const clearSearchButton = {
  position:
    "absolute",
  left: "7px",
  top: "50%",
  transform:
    "translateY(-50%)",
  width: "27px",
  height: "27px",
  border:
    "none",
  borderRadius:
    "7px",
  background:
    "#f0f2f1",
  color:
    "#7a837d",
  cursor:
    "pointer",
  display:
    "flex",
  alignItems:
    "center",
  justifyContent:
    "center",
};

const resultCountStyle = {
  display:
    "flex",
  alignItems:
    "center",
  gap: "5px",
  whiteSpace:
    "nowrap",
  color:
    "#929a94",
  fontSize:
    "9px",
};

const studentListStyle = {
  minHeight:
    "100px",
};

const selectHalaqaHint = {
  background:
    "#fff",
  border:
    "1px solid #e2e7e3",
  borderRadius:
    "18px",
  padding:
    "45px 20px",
  textAlign:
    "center",
  color:
    "#89928c",
  marginTop:
    "5px",
};

const hintIconStyle = {
  width: "58px",
  height: "58px",
  borderRadius:
    "16px",
  background:
    "#edf5ef",
  color:
    "#0f5132",
  display:
    "flex",
  alignItems:
    "center",
  justifyContent:
    "center",
  margin:
    "0 auto 12px",
};

const emptyBoxStyle = {
  background:
    "#fff",
  border:
    "1px solid #e2e7e3",
  borderRadius:
    "18px",
  padding:
    "50px 20px",
  display:
    "flex",
  alignItems:
    "center",
  justifyContent:
    "center",
  flexDirection:
    "column",
  gap: "8px",
  color:
    "#87908a",
  fontSize:
    "11px",
};