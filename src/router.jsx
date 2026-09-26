import { lazy, Suspense } from "react";
import {
  createBrowserRouter,
  Navigate,
} from "react-router-dom";

import AdminLayout from "./components/AdminLayout";

const Login = lazy(() => import("./pages/Login"));
const SystemAdmin = lazy(() => import("./pages/SystemAdmin"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const Profile = lazy(() => import("./pages/Profile"));
const Reports = lazy(() => import("./pages/Reports"));
const RewardsPage = lazy(() => import("./pages/RewardsPage"));
const Competitions = lazy(() => import("./pages/Competitions"));
const Badges = lazy(() => import("./pages/Badges"));
const Mosques = lazy(() => import("./pages/Mosques"));
const Halaqat = lazy(() => import("./pages/Halaqat"));
const Teachers = lazy(() => import("./pages/Teachers"));
const Students = lazy(() => import("./pages/Students"));
const HalaqaStudents = lazy(() => import("./pages/HalaqaStudents"));
const HalaqaTeachers = lazy(() => import("./pages/HalaqaTeachers"));
const Attendance = lazy(() => import("./pages/Attendance"));
const Recitations = lazy(() => import("./pages/Recitations"));
const Exams = lazy(() => import("./pages/Exams"));
const MonthlyAchievement = lazy(() => import("./pages/MonthlyAchievement"));
const TVLeaderboardPage = lazy(() => import("./pages/TVLeaderboardPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const JoinRequests = lazy(() => import("./pages/JoinRequests"));
const AdminInvoices = lazy(() => import("./pages/AdminInvoices"));
const Notifications = lazy(() => import("./pages/Notifications"));
const InvoicePage = lazy(() => import("./pages/InvoicePage"));
/* =========================================================
   Teacher Portal
========================================================= */
import TeacherLayout from "./layouts/TeacherLayout";

const TeacherDashboard = lazy(() => import("./pages/teacher/Dashboard"));
const TeacherStudents = lazy(() => import("./pages/teacher/Students"));
const TeacherAttendance = lazy(() => import("./pages/teacher/Attendance"));
const TeacherRecitations = lazy(() => import("./pages/teacher/Recitations"));
const TeacherPoints = lazy(() => import("./pages/teacher/Points"));
const TeacherMonthlyAchievement = lazy(() => import("./pages/teacher/MonthlyAchievement"));
const TeacherExams = lazy(() => import("./pages/teacher/Exams"));
const TeacherReports = lazy(() => import("./pages/teacher/Reports"));
const TeacherProfile = lazy(() => import("./pages/teacher/Profile"));
const TeacherSettings = lazy(() => import("./pages/teacher/Settings"));
const TeacherHalaqat = lazy(() => import("./pages/teacher/Halaqat"));
const TeacherMonthlyPlan = lazy(() => import("./pages/teacher/MonthlyPlan"));
const TeacherStudentCare = lazy(() => import("./pages/teacher/StudentCare"));
const TeacherRecords = lazy(() => import("./pages/teacher/Records"));
const TeacherJoinRequests = lazy(() => import("./pages/teacher/JoinRequests"));
/* =========================================================
   Student Portal
========================================================= */
import StudentLayout from "./layouts/StudentLayout";

const StudentDashboard = lazy(() => import("./pages/student/Dashboard"));
const MyHalaqa = lazy(() => import("./pages/student/MyHalaqa"));
const Classmates = lazy(() => import("./pages/student/Classmates"));
const StudentRecitations = lazy(() => import("./pages/student/Recitations"));
const StudentMonthlyPlan = lazy(() => import("./pages/student/MonthlyPlan"));
const StudentMonthlyAchievement = lazy(() => import("./pages/student/MonthlyAchievement"));
const StudentAttendance = lazy(() => import("./pages/student/Attendance"));
const StudentPoints = lazy(() => import("./pages/student/Points"));
const StudentExams = lazy(() => import("./pages/student/Exams"));
const StudentNotifications = lazy(() => import("./pages/student/Notifications"));
const StudentSettings = lazy(() => import("./pages/student/Settings"));
const StudentProfile = lazy(() => import("./pages/student/Profile"));
/* =========================================================
   Public / Setup
========================================================= */
import PublicLayout from "./layouts/PublicLayout";
const LandingPage = lazy(() => import("./pages/LandingPage"));
const Register = lazy(() => import("./pages/Register"));
const StudentOnboarding = lazy(() => import("./pages/student/Onboarding"));
const SupervisorSetup = lazy(() => import("./pages/supervisor/SupervisorSetup"));

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
