import { lazy, Suspense } from "react";
import {
  createBrowserRouter,
  Navigate,
} from "react-router-dom";

import AdminLayout from "./components/AdminLayout";

const CHUNK_RELOAD_KEY = "sadiq:chunk-reload";

function lazyWithRetry(importer) {
  return lazy(async () => {
    try {
      const module = await importer();

      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem(CHUNK_RELOAD_KEY);
      }

      return module;
    } catch (error) {
      const message = String(error?.message || error || "");
      const isChunkLoadError =
        /Failed to fetch dynamically imported module/i.test(message) ||
        /Importing a module script failed/i.test(message) ||
        /Loading chunk/i.test(message) ||
        /dynamically imported module/i.test(message);

      if (isChunkLoadError && typeof window !== "undefined") {
        const lastReload = Number(
          window.sessionStorage.getItem(CHUNK_RELOAD_KEY) || 0
        );

        // A production deployment can replace hashed Vite chunks while an
        // already-open tab still has the previous app shell in memory.
        // Reload once to fetch the current index and chunk manifest.
        if (!lastReload || Date.now() - lastReload > 15000) {
          window.sessionStorage.setItem(
            CHUNK_RELOAD_KEY,
            String(Date.now())
          );
          window.location.reload();

          return new Promise(() => {});
        }
      }

      throw error;
    }
  });
}

const Login = lazyWithRetry(() => import("./pages/Login"));
const ForgotPassword = lazyWithRetry(() => import("./pages/ForgotPassword"));
const ResetPassword = lazyWithRetry(() => import("./pages/ResetPassword"));
const SystemAdmin = lazyWithRetry(() => import("./pages/SystemAdmin"));
const AdminDashboard = lazyWithRetry(() => import("./pages/AdminDashboard"));
const Profile = lazyWithRetry(() => import("./pages/Profile"));
const Reports = lazyWithRetry(() => import("./pages/Reports"));
const RewardsPage = lazyWithRetry(() => import("./pages/RewardsPage"));
const Competitions = lazyWithRetry(() => import("./pages/Competitions"));
const Badges = lazyWithRetry(() => import("./pages/Badges"));
const Mosques = lazyWithRetry(() => import("./pages/Mosques"));
const Halaqat = lazyWithRetry(() => import("./pages/Halaqat"));
const Teachers = lazyWithRetry(() => import("./pages/Teachers"));
const Students = lazyWithRetry(() => import("./pages/Students"));
const HalaqaStudents = lazyWithRetry(() => import("./pages/HalaqaStudents"));
const HalaqaTeachers = lazyWithRetry(() => import("./pages/HalaqaTeachers"));
const Attendance = lazyWithRetry(() => import("./pages/Attendance"));
const Recitations = lazyWithRetry(() => import("./pages/Recitations"));
const Exams = lazyWithRetry(() => import("./pages/Exams"));
const MonthlyAchievement = lazyWithRetry(() => import("./pages/MonthlyAchievement"));
const TVLeaderboardPage = lazyWithRetry(() => import("./pages/TVLeaderboardPage"));
const SettingsPage = lazyWithRetry(() => import("./pages/SettingsPage"));
const JoinRequests = lazyWithRetry(() => import("./pages/JoinRequests"));
const AdminInvoices = lazyWithRetry(() => import("./pages/AdminInvoices"));
const Notifications = lazyWithRetry(() => import("./pages/Notifications"));
const InvoicePage = lazyWithRetry(() => import("./pages/InvoicePage"));
/* =========================================================
   Teacher Portal
========================================================= */
import TeacherLayout from "./layouts/TeacherLayout";

const TeacherDashboard = lazyWithRetry(() => import("./pages/teacher/Dashboard"));
const TeacherStudents = lazyWithRetry(() => import("./pages/teacher/Students"));
const TeacherAttendance = lazyWithRetry(() => import("./pages/teacher/Attendance"));
const TeacherRecitations = lazyWithRetry(() => import("./pages/teacher/Recitations"));
const TeacherPoints = lazyWithRetry(() => import("./pages/teacher/Points"));
const TeacherMonthlyAchievement = lazyWithRetry(() => import("./pages/teacher/MonthlyAchievement"));
const TeacherExams = lazyWithRetry(() => import("./pages/teacher/Exams"));
const TeacherReports = lazyWithRetry(() => import("./pages/teacher/Reports"));
const TeacherProfile = lazyWithRetry(() => import("./pages/teacher/Profile"));
const TeacherSettings = lazyWithRetry(() => import("./pages/teacher/Settings"));
const TeacherHalaqat = lazyWithRetry(() => import("./pages/teacher/Halaqat"));
const TeacherMonthlyPlan = lazyWithRetry(() => import("./pages/teacher/MonthlyPlan"));
const TeacherStudentCare = lazyWithRetry(() => import("./pages/teacher/StudentCare"));
const TeacherRecords = lazyWithRetry(() => import("./pages/teacher/Records"));
const TeacherJoinRequests = lazyWithRetry(() => import("./pages/teacher/JoinRequests"));
/* =========================================================
   Student Portal
========================================================= */
import StudentLayout from "./layouts/StudentLayout";

const StudentDashboard = lazyWithRetry(() => import("./pages/student/Dashboard"));
const MyHalaqa = lazyWithRetry(() => import("./pages/student/MyHalaqa"));
const Classmates = lazyWithRetry(() => import("./pages/student/Classmates"));
const StudentRecitations = lazyWithRetry(() => import("./pages/student/Recitations"));
const StudentMonthlyPlan = lazyWithRetry(() => import("./pages/student/MonthlyPlan"));
const StudentMonthlyAchievement = lazyWithRetry(() => import("./pages/student/MonthlyAchievement"));
const StudentAttendance = lazyWithRetry(() => import("./pages/student/Attendance"));
const StudentPoints = lazyWithRetry(() => import("./pages/student/Points"));
const StudentExams = lazyWithRetry(() => import("./pages/student/Exams"));
const StudentNotifications = lazyWithRetry(() => import("./pages/student/Notifications"));
const StudentSettings = lazyWithRetry(() => import("./pages/student/Settings"));
const StudentProfile = lazyWithRetry(() => import("./pages/student/Profile"));
/* =========================================================
   Public / Setup
========================================================= */
import PublicLayout from "./layouts/PublicLayout";
const LandingPage = lazyWithRetry(() => import("./pages/LandingPage"));
const Register = lazyWithRetry(() => import("./pages/Register"));
const StudentOnboarding = lazyWithRetry(() => import("./pages/student/Onboarding"));
const SupervisorSetup = lazyWithRetry(() => import("./pages/supervisor/SupervisorSetup"));

function renderLazy(Component) {
  return (
    <Suspense
      fallback={
        <div
          role="status"
          aria-live="polite"
          style={{
            minHeight: "160px",
            display: "grid",
            placeItems: "center",
            color: "#60736b",
            fontWeight: 800,
          }}
        >
          جارٍ تحميل الصفحة…
        </div>
      }
    >
      <Component />
    </Suspense>
  );
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <PublicLayout />,
    children: [
      {
        index: true,
        element: renderLazy(LandingPage),
      },
    ],
  },

  {
    path: "/login",
    element: renderLazy(Login),
  },

  {
    path: "/forgot-password",
    element: renderLazy(ForgotPassword),
  },

  {
    path: "/reset-password",
    element: renderLazy(ResetPassword),
  },

  {
    path: "/register",
    element: renderLazy(Register),
  },

  {
    path: "/student/onboarding",
    element: renderLazy(StudentOnboarding),
  },

  {
    path: "/system-admin",
    element: renderLazy(SystemAdmin),
  },

  {
    path: "/supervisor/setup",
    element: renderLazy(SupervisorSetup),
  },

  {
    path: "/admin",
    element: <AdminLayout />,

    children: [
      {
        index: true,
        element: renderLazy(AdminDashboard),
      },

      {
        path: "profile",
        element: renderLazy(Profile),
      },

      {
        path: "notifications",
        element: renderLazy(Notifications),
      },

      {
        path: "reports",
        element: renderLazy(Reports),
      },

      {
        path: "invoices",
        element: renderLazy(AdminInvoices),
      },

      {
        path: "invoices/:invoiceId",
        element: renderLazy(InvoicePage),
      },

      {
        path: "points-transactions",
        element: renderLazy(RewardsPage),
      },

      {
        path: "competitions",
        element: renderLazy(Competitions),
      },

      {
        path: "badges",
        element: renderLazy(Badges),
      },

      {
        path: "mosques",
        element: renderLazy(Mosques),
      },

      {
        path: "halaqat",
        element: renderLazy(Halaqat),
      },

      {
        path: "teachers",
        element: renderLazy(Teachers),
      },

      {
        path: "join-requests",
        element: renderLazy(JoinRequests),
      },

      {
        path: "students",
        element: renderLazy(Students),
      },

      {
        path: "exams",
        element: renderLazy(Exams),
      },

      {
        path: "monthly-achievement",
        element: renderLazy(MonthlyAchievement),
      },

      {
        path: "tv-leaderboard",
        element: renderLazy(TVLeaderboardPage),
      },

      {
        path: "settings",
        element: renderLazy(SettingsPage),
      },

      {
        path: "halaqa-students/:id",
        element: renderLazy(HalaqaStudents),
      },

      {
        path: "halaqa-teachers/:id",
        element: renderLazy(HalaqaTeachers),
      },

      {
        path: "attendance",
        element: renderLazy(Attendance),
      },

      {
        path: "recitations",
        element: renderLazy(Recitations),
      },
    ],
  },

  {
    path: "/teacher",
    element: <TeacherLayout />,

    children: [
      {
        index: true,
        element: renderLazy(TeacherDashboard),
      },

      {
        path: "students",
        element: renderLazy(TeacherStudents),
      },

      {
        path: "join-requests",
        element: renderLazy(TeacherJoinRequests),
      },

      {
        path: "attendance",
        element: renderLazy(TeacherAttendance),
      },

      {
        path: "recitations",
        element: renderLazy(TeacherRecitations),
      },

      {
        path: "points",
        element: renderLazy(TeacherPoints),
      },

      {
        path: "halaqat",
        element: renderLazy(TeacherHalaqat),
      },

      {
        path: "monthly-plan",
        element: renderLazy(TeacherMonthlyPlan),
      },

      {
        path: "monthly-achievement",
        element: renderLazy(TeacherMonthlyAchievement),
      },

      {
        path: "exams",
        element: renderLazy(TeacherExams),
      },

      {
        path: "notifications",
        element: renderLazy(TeacherStudentCare),
      },

{
  path: "records",
  element: renderLazy(TeacherRecords),
},

      {
        path: "reports",
        element: renderLazy(TeacherReports),
      },

      {
        path: "profile",
        element: renderLazy(TeacherProfile),
      },

      {
        path: "settings",
        element: renderLazy(TeacherSettings),
      },
    ],
  },

  {
    path: "/student",
    element: <StudentLayout />,

    children: [
      {
        index: true,
        element: <Navigate to="/student/dashboard" replace />,
      },

      {
        path: "dashboard",
        element: renderLazy(StudentDashboard),
      },

      {
        path: "halaqa",
        element: renderLazy(MyHalaqa),
      },

      {
        path: "classmates",
        element: renderLazy(Classmates),
      },

      {
        path: "recitations",
        element: renderLazy(StudentRecitations),
      },

      {
        path: "monthly-plan",
        element: renderLazy(StudentMonthlyPlan),
      },

      {
        path: "monthly-achievement",
        element: renderLazy(StudentMonthlyAchievement),
      },

      {
        path: "attendance",
        element: renderLazy(StudentAttendance),
      },

      {
        path: "points",
        element: renderLazy(StudentPoints),
      },

      {
        path: "exams",
        element: renderLazy(StudentExams),
      },

      {
        path: "notifications",
        element: renderLazy(StudentNotifications),
      },

      {
        path: "settings",
        element: renderLazy(StudentSettings),
      },

      {
        path: "profile",
        element: renderLazy(StudentProfile),
      },
    ],
  },

  {
    path: "*",
    element: renderLazy(Login),
  },
]);

export default router;
