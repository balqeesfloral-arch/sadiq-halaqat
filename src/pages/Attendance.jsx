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
  // RENDER
  // ==========================================

  if (initialLoading) {
    return (
      <PageShell>
        <LoadingScreen />
      </PageShell>
    );
  }

  return (
    <PageShell>
      {/* ================================== */}
      {/* HEADER */}
      {/* ================================== */}

      <div
        style={headerStyle}
      >
        <div
          style={{
            display: "flex",
            alignItems:
              "center",
            gap: "13px",
          }}
        >
          <button
            type="button"
            onClick={() =>
              navigate("/admin")
            }
            style={
              backButtonStyle
            }
          >
            <ArrowRight
              size={18}
            />

            <span>
              لوحة المشرف
            </span>
          </button>

          <div
            style={
              headerIconStyle
            }
          >
            <ClipboardCheck
              size={25}
              strokeWidth={1.8}
            />
          </div>

          <div>
            <h1
              style={
                pageTitleStyle
              }
            >
              الحضور والغياب
            </h1>

            <p
              style={
                pageSubtitleStyle
              }
            >
              إدارة حضور الطلاب ومتابعة الالتزام اليومي
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={
            loadAttendanceData
          }
          disabled={loading}
          style={{
            ...refreshButtonStyle,
            opacity:
              loading ? 0.65 : 1,
          }}
        >
          <RefreshCw
            size={16}
            style={{
              animation:
                loading
                  ? "spin .8s linear infinite"
                  : "none",
            }}
          />

          تحديث
        </button>
      </div>

      {/* ================================== */}
      {/* DATE CONTROL */}
      {/* ================================== */}

      <section
        style={
          datePanelStyle
        }
      >
        <div
          style={
            dateNavigationStyle
          }
        >
          <button
            type="button"
            onClick={() =>
              changeDate(-1)
            }
            style={
              dateArrowButton
            }
          >
            <ArrowRight
              size={17}
            />

            اليوم السابق
          </button>

          <div
            style={{
              textAlign:
                "center",
              flex: 1,
            }}
          >
            <div
              style={
                dateSmallLabel
              }
            >
              <CalendarDays
                size={14}
              />

              تاريخ التسجيل
            </div>

            <div
              style={
                dateMainText
              }
            >
              {formatDateArabic(
                selectedDate
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              changeDate(1)
            }
            disabled={
              selectedDate ===
              getLocalDate()
            }
            style={{
              ...dateArrowButton,
              opacity:
                selectedDate ===
                getLocalDate()
                  ? 0.35
                  : 1,
              cursor:
                selectedDate ===
                getLocalDate()
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            اليوم التالي

            <ArrowLeft
              size={17}
            />
          </button>
        </div>

        <div
          style={
            dateBottomControls
          }
        >
          <input
            type="date"
            value={
              selectedDate
            }
            max={getLocalDate()}
            onChange={(e) =>
              setSelectedDate(
                e.target.value
              )
            }
            style={
              dateInputStyle
            }
          />

          <button
            type="button"
            onClick={
              goToToday
            }
            style={
              todayButtonStyle
            }
          >
            اليوم
          </button>
        </div>
      </section>

      {/* ================================== */}
      {/* GLOBAL STATS */}
      {/* ================================== */}

      <div
        style={
          statsGridStyle
        }
      >
        <SummaryCard
          icon={
            <Users
              size={21}
            />
          }
          title="إجمالي الطلاب"
          value={
            globalStats.total
          }
          description="في جميع الحلقات"
        />

        <SummaryCard
          icon={
            <CheckCircle2
              size={21}
            />
          }
          title="حاضر"
          value={
            globalStats.present
          }
          description="حضور فعلي"
          tone="success"
        />

        <SummaryCard
          icon={
            <XCircle
              size={21}
            />
          }
          title="غائب"
          value={
            globalStats.absent
          }
          description="غياب مسجل"
          tone="danger"
        />

        <SummaryCard
          icon={
            <Clock3
              size={21}
            />
          }
          title="متأخر"
          value={
            globalStats.late
          }
          description="حضور متأخر"
          tone="warning"
        />

        <SummaryCard
          icon={
            <CircleSlash2
              size={21}
            />
          }
          title="لم يسجل"
          value={
            globalStats.unrecorded
          }
          description="بانتظار التسجيل"
          tone="neutral"
        />
      </div>

      {/* ================================== */}
      {/* HALAQAT */}
      {/* ================================== */}

      <section>
        <div
          style={
            sectionHeaderStyle
          }
        >
          <div>
            <h2
              style={
                sectionTitleStyle
              }
            >
              الحلقات
            </h2>

            <p
              style={
                sectionSubtitleStyle
              }
            >
              اختر الحلقة لبدء تسجيل الحضور
            </p>
          </div>

          <div
            style={
              overallPercentageStyle
            }
          >
            <span>
              نسبة الحضور العامة
            </span>

            <strong>
              {globalStats.percentage}%
            </strong>
          </div>
        </div>

        {halaqat.length ===
        0 ? (
          <EmptyHalaqat />
        ) : (
          <div
            style={
              halaqaGridStyle
            }
          >
            {halaqat.map(
              (halaqa) => {
                const stats =
                  getHalaqaStats(
                    halaqa.id
                  );

                const selected =
                  Number(
                    selectedHalaqa
                  ) ===
                  Number(
                    halaqa.id
                  );

                return (
                  <HalaqaCard
                    key={
                      halaqa.id
                    }
                    halaqa={
                      halaqa
                    }
                    stats={
                      stats
                    }
                    selected={
                      selected
                    }
                    onClick={() =>
                      setSelectedHalaqa(
                        String(
                          halaqa.id
                        )
                      )
                    }
                  />
                );
              }
            )}
          </div>
        )}
      </section>

      {/* ================================== */}
      {/* SELECTED HALAQA */}
      {/* ================================== */}

      {selectedHalaqa && (
        <section
          style={
            attendancePanelStyle
          }
        >
          {/* PANEL HEADER */}

          <div
            style={
              panelHeaderStyle
            }
          >
            <div>
              <div
                style={
                  panelEyebrowStyle
                }
              >
                <span
                  style={
                    liveDotStyle
                  }
                />

                سجل الحضور
              </div>

              <h2
                style={
                  panelTitleStyle
                }
              >
                {selectedHalaqaData?.name ||
                  "الحلقة"}
              </h2>

              <p
                style={
                  panelSubtitleStyle
                }
              >
                {formatDateArabic(
                  selectedDate
                )}
              </p>
            </div>

            <div
              style={
                panelPercentageStyle
              }
            >
              <strong>
                {
                  selectedStats.attendancePercentage
                }
                %
              </strong>

              <span>
                نسبة الحضور
              </span>
            </div>
          </div>

          {/* QUICK ACTIONS */}

          <div
            style={
              quickActionsStyle
            }
          >
            <button
              type="button"
              disabled={
                bulkSaving ||
                selectedStats.total ===
                  0
              }
              onClick={() =>
                markAll(
                  "present"
                )
              }
              style={
                bulkPresentButton
              }
            >
              {bulkSaving ? (
                <Loader2
                  size={17}
                  style={{
                    animation:
                      "spin .8s linear infinite",
                  }}
                />
              ) : (
                <Check
                  size={17}
                />
              )}

              تسجيل الجميع حاضر
            </button>

            <button
              type="button"
              disabled={
                bulkSaving ||
                selectedStats.total ===
                  0
              }
              onClick={() =>
                markAll(
                  "absent"
                )
              }
              style={
                bulkAbsentButton
              }
            >
              <X
                size={17}
              />

              تسجيل الجميع غائب
            </button>

            <button
              type="button"
              onClick={() =>
                setShowOnlyUnrecorded(
                  !showOnlyUnrecorded
                )
              }
              style={{
                ...filterButtonStyle,
                ...(showOnlyUnrecorded
                  ? filterButtonActiveStyle
                  : {}),
              }}
            >
              <Filter
                size={16}
              />

              {showOnlyUnrecorded
                ? "عرض الجميع"
                : "غير المسجلين فقط"}
            </button>
          </div>

          {/* SEARCH */}

          <div
            style={
              searchRowStyle
            }
          >
            <div
              style={
                searchBoxStyle
              }
            >
              <Search
                size={18}
                style={
                  searchIconStyle
                }
              />

              <input
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
                placeholder="ابحث باسم الطالب أو رقم الطالب..."
                style={
                  searchInputStyle
                }
              />

              {search && (
                <button
                  type="button"
                  onClick={() =>
                    setSearch("")
                  }
                  style={
                    clearSearchButton
                  }
                >
                  <X
                    size={15}
                  />
                </button>
              )}
            </div>

            <div
              style={
                resultCountStyle
              }
            >
              <strong>
                {
                  filteredStudents.length
                }
              </strong>

              <span>
                طالب معروض
              </span>
            </div>
          </div>

          {/* STUDENTS */}

          <div
            style={
              studentListStyle
            }
          >
            {filteredStudents.length ===
            0 ? (
              <EmptyStudents
                search={
                  search
                }
                onlyUnrecorded={
                  showOnlyUnrecorded
                }
              />
            ) : (
              filteredStudents.map(
                (
                  student,
                  index
                ) => {
                  const record =
                    getAttendanceRecord(
                      student.student_id,
                      selectedHalaqa
                    );

                  return (
                    <StudentAttendanceRow
                      key={
                        student.student_id
                      }
                      student={
                        student
                      }
                      record={
                        record
                      }
                      index={
                        index
                      }
                      saving={
                        savingStudentId ===
                        student.student_id
                      }
                      onSave={
                        saveAttendance
                      }
                    />
                  );
                }
              )
            )}
          </div>
        </section>
      )}

      {!selectedHalaqa &&
        halaqat.length > 0 && (
          <div
            style={
              selectHalaqaHint
            }
          >
            <div
              style={
                hintIconStyle
              }
            >
              <ClipboardCheck
                size={25}
              />
            </div>

            <h3>
              اختر حلقة للبدء
            </h3>

            <p>
              اختر إحدى الحلقات أعلاه لعرض الطلاب وتسجيل حضورهم.
            </p>
          </div>
        )}

      <style>
        {`
          @keyframes spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }

          @keyframes fadeUp {
            from {
              opacity: 0;
              transform: translateY(8px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .attendance-hover:hover {
            transform: translateY(-2px);
            box-shadow: 0 12px 28px rgba(15,81,50,.09) !important;
          }

          .student-row:hover {
            background: #fbfcfb !important;
          }

          button {
            font-family: inherit;
          }

          input,
          select {
            font-family: inherit;
          }
        `}
      </style>
    </PageShell>
  );
}

/* =========================================================
   PAGE SHELL
========================================================= */

function PageShell({
  children,
}) {
  return (
    <div
      dir="rtl"
      style={{
        minHeight: "100vh",
        padding: "28px",
        boxSizing: "border-box",
        background:
          "radial-gradient(circle at 10% 10%, rgba(15,81,50,.045), transparent 25%), radial-gradient(circle at 90% 80%, rgba(184,145,72,.045), transparent 25%), #f7f5ef",
      }}
    >
      <div
        style={{
          maxWidth: "1380px",
          margin: "0 auto",
        }}
      >
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