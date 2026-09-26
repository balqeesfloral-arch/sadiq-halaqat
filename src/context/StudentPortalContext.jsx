import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { supabase } from "../lib/supabase";

const StudentPortalContext = createContext(null);

export function StudentPortalProvider({ children }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [accessDenied, setAccessDenied] = useState(false);
  const [profile, setProfile] = useState(null);
  const [assignment, setAssignment] = useState(null);
  const [halaqa, setHalaqa] = useState(null);
  const [mosque, setMosque] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [classmatesCount, setClassmatesCount] = useState(0);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      setAccessDenied(false);

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      if (!user) {
        setAccessDenied(true);
        setProfile(null);
        return;
      }

      const { data: student, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("auth_user_id", user.id)
        .eq("role", "student")
        .maybeSingle();

      if (profileError) throw profileError;

      if (
        !student ||
        student.status !== "active" ||
        student.is_active === false
      ) {
        setAccessDenied(true);
        setProfile(null);
        return;
      }

      setProfile(student);

      const { data: studentAssignment, error: assignmentError } =
        await supabase
          .from("student_halaqat")
          .select("id, student_id, halaqa_id, teacher_id, start_date, end_date, is_current")
          .eq("student_id", student.id)
          .eq("is_current", true)
          .maybeSingle();

      if (assignmentError) throw assignmentError;
      setAssignment(studentAssignment || null);

      if (!studentAssignment?.halaqa_id) {
        setHalaqa(null);
        setMosque(null);
        setTeachers([]);
        setClassmatesCount(0);
        return;
      }

      const { data: halaqaRow, error: halaqaError } = await supabase
        .from("halaqat")
        .select(
          "id, name, mosque_id, main_teacher_id, assistant_teacher_id, capacity, status, description, halaqa_period"
        )
        .eq("id", studentAssignment.halaqa_id)
        .maybeSingle();

      if (halaqaError) throw halaqaError;
      setHalaqa(halaqaRow || null);

      if (halaqaRow?.mosque_id) {
        const result = await supabase
          .from("mosques")
          .select("id, name, address, status")
          .eq("id", halaqaRow.mosque_id)
          .maybeSingle();

        if (result.error) throw result.error;
        setMosque(result.data || null);
      } else {
        setMosque(null);
      }

      const { data: teacherLinks, error: teacherLinksError } = await supabase
        .from("teacher_halaqat")
        .select("teacher_id, role")
        .eq("halaqa_id", studentAssignment.halaqa_id);

      if (teacherLinksError) throw teacherLinksError;

      const teacherIds = [
        ...new Set(
          (teacherLinks || [])
            .map((item) => Number(item.teacher_id))
            .filter(Boolean)
        ),
      ];

      if (teacherIds.length) {
        const result = await supabase
          .from("profiles")
          .select("id, full_name, user_number, phone")
          .in("id", teacherIds);

        if (result.error) throw result.error;

        const roleMap = new Map(
          (teacherLinks || []).map((item) => [
            Number(item.teacher_id),
            item.role,
          ])
        );

        setTeachers(
          (result.data || []).map((teacher) => ({
            ...teacher,
            halaqa_role: roleMap.get(Number(teacher.id)) || "assistant",
          }))
        );
      } else {
        setTeachers([]);
      }

      const countResult = await supabase
        .from("student_halaqat")
        .select("student_id", { count: "exact", head: true })
        .eq("halaqa_id", studentAssignment.halaqa_id)
        .eq("is_current", true);

      if (!countResult.error) {
        setClassmatesCount(Math.max(0, Number(countResult.count || 0) - 1));
      }
    } catch (loadError) {
      console.error("Student portal context:", loadError);
      setError("تعذر تجهيز حساب الطالب. أعد تسجيل الدخول ثم حاول مرة أخرى.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const mainTeacher = useMemo(
    () =>
      teachers.find((teacher) => teacher.halaqa_role === "main") ||
      teachers[0] ||
      null,
    [teachers]
  );

  const value = useMemo(
    () => ({
      loading,
      error,
      accessDenied,
      profile,
      assignment,
      halaqa,
      mosque,
      teachers,
      mainTeacher,
      classmatesCount,
      refresh,
    }),
    [
      loading,
      error,
      accessDenied,
      profile,
      assignment,
      halaqa,
      mosque,
      teachers,
      mainTeacher,
      classmatesCount,
      refresh,
    ]
  );

  return (
    <StudentPortalContext.Provider value={value}>
      {children}
    </StudentPortalContext.Provider>
  );
}

export function useStudentPortal() {
  const value = useContext(StudentPortalContext);
  if (!value) {
    throw new Error(
      "useStudentPortal must be used inside StudentPortalProvider"
    );
  }
  return value;
}
