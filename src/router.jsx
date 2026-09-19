import {
  createBrowserRouter,
  Navigate,
} from "react-router-dom";

import AdminLayout from "./components/AdminLayout";

import Login from "./pages/Login";
import SystemAdmin from "./pages/SystemAdmin";
import AdminDashboard from "./pages/AdminDashboard";

import Profile from "./pages/Profile";

import Reports from "./pages/Reports";
import RewardsPage from "./pages/RewardsPage";
import Competitions from "./pages/Competitions";
import Badges from "./pages/Badges";

import Mosques from "./pages/Mosques";
import Halaqat from "./pages/Halaqat";
import Teachers from "./pages/Teachers";
import Students from "./pages/Students";

import HalaqaStudents from "./pages/HalaqaStudents";
import HalaqaTeachers from "./pages/HalaqaTeachers";

import Attendance from "./pages/Attendance";
import Recitations from "./pages/Recitations";

import Exams from "./pages/Exams";
import MonthlyAchievement from "./pages/MonthlyAchievement";

import TVLeaderboardPage from "./pages/TVLeaderboardPage";
import SettingsPage from "./pages/SettingsPage";
import JoinRequests from "./pages/JoinRequests";
import AdminInvoices from "./pages/AdminInvoices";
import InvoicePage from "./pages/InvoicePage";

/* =========================================================
   Teacher Portal
========================================================= */
import TeacherLayout from "./layouts/TeacherLayout";

import TeacherDashboard from "./pages/teacher/Dashboard";
import TeacherStudents from "./pages/teacher/Students";
import TeacherAttendance from "./pages/teacher/Attendance";
import TeacherRecitations from "./pages/teacher/Recitations";
import TeacherPoints from "./pages/teacher/Points";
import TeacherMonthlyAchievement from "./pages/teacher/MonthlyAchievement";
import TeacherExams from "./pages/teacher/Exams";
import TeacherReports from "./pages/teacher/Reports";
import TeacherProfile from "./pages/teacher/Profile";
import TeacherSettings from "./pages/teacher/Settings";
import TeacherHalaqat from "./pages/teacher/Halaqat";
import TeacherMonthlyPlan from "./pages/teacher/MonthlyPlan";
import TeacherStudentCare from "./pages/teacher/StudentCare";
import TeacherRecords from "./pages/teacher/Records";
import TeacherJoinRequests from "./pages/teacher/JoinRequests";

/* =========================================================
   Student Portal
========================================================= */
import StudentLayout from "./layouts/StudentLayout";

import StudentDashboard from "./pages/student/Dashboard";
import MyHalaqa from "./pages/student/MyHalaqa";
import Classmates from "./pages/student/Classmates";
import StudentRecitations from "./pages/student/Recitations";
import StudentMonthlyPlan from "./pages/student/MonthlyPlan";
import StudentMonthlyAchievement from "./pages/student/MonthlyAchievement";
import StudentAttendance from "./pages/student/Attendance";
import StudentPoints from "./pages/student/Points";
import StudentExams from "./pages/student/Exams";
import StudentNotifications from "./pages/student/Notifications";
import StudentSettings from "./pages/student/Settings";
import StudentProfile from "./pages/student/Profile";

/* =========================================================
   Public / Setup
========================================================= */
import PublicLayout from "./layouts/PublicLayout";
import LandingPage from "./pages/LandingPage";
import Register from "./pages/Register";
import StudentOnboarding from "./pages/student/Onboarding";
import SupervisorSetup from "./pages/supervisor/SupervisorSetup";

const router = createBrowserRouter([
  {
    path: "/",
    element: <PublicLayout />,
    children: [
      {
        index: true,
        element: <LandingPage />,
      },
    ],
  },

  {
    path: "/login",
    element: <Login />,
  },

  {
    path: "/register",
    element: <Register />,
  },

  {
    path: "/student/onboarding",
    element: <StudentOnboarding />,
  },

  {
    path: "/system-admin",
    element: <SystemAdmin />,
  },

  {
    path: "/supervisor/setup",
    element: <SupervisorSetup />,
  },

  {
    path: "/admin",
    element: <AdminLayout />,

    children: [
      {
        index: true,
        element: <AdminDashboard />,
      },

      {
        path: "profile",
        element: <Profile />,
      },

      {
        path: "reports",
        element: <Reports />,
      },

      {
        path: "invoices",
        element: <AdminInvoices />,
      },

      {
        path: "invoices/:invoiceId",
        element: <InvoicePage />,
      },

      {
        path: "points-transactions",
        element: <RewardsPage />,
      },

      {
        path: "competitions",
        element: <Competitions />,
      },

      {
        path: "badges",
        element: <Badges />,
      },

      {
        path: "mosques",
        element: <Mosques />,
      },

      {
        path: "halaqat",
        element: <Halaqat />,
      },

      {
        path: "teachers",
        element: <Teachers />,
      },

      {
        path: "join-requests",
        element: <JoinRequests />,
      },

      {
        path: "students",
        element: <Students />,
      },

      {
        path: "exams",
        element: <Exams />,
      },

      {
        path: "monthly-achievement",
        element: <MonthlyAchievement />,
      },

      {
        path: "tv-leaderboard",
        element: <TVLeaderboardPage />,
      },

      {
        path: "settings",
        element: <SettingsPage />,
      },

      {
        path: "halaqa-students/:id",
        element: <HalaqaStudents />,
      },

      {
        path: "halaqa-teachers/:id",
        element: <HalaqaTeachers />,
      },

      {
        path: "attendance",
        element: <Attendance />,
      },

      {
        path: "recitations",
        element: <Recitations />,
      },
    ],
  },

  {
    path: "/teacher",
    element: <TeacherLayout />,

    children: [
      {
        index: true,
        element: <TeacherDashboard />,
      },

      {
        path: "students",
        element: <TeacherStudents />,
      },

      {
        path: "join-requests",
        element: <TeacherJoinRequests />,
      },

      {
        path: "attendance",
        element: <TeacherAttendance />,
      },

      {
        path: "recitations",
        element: <TeacherRecitations />,
      },

      {
        path: "points",
        element: <TeacherPoints />,
      },

      {
        path: "halaqat",
        element: <TeacherHalaqat />,
      },

      {
        path: "monthly-plan",
        element: <TeacherMonthlyPlan />,
      },

      {
        path: "monthly-achievement",
        element: <TeacherMonthlyAchievement />,
      },

      {
        path: "exams",
        element: <TeacherExams />,
      },

      {
        path: "notifications",
        element: <TeacherStudentCare />,
      },

{
  path: "records",
  element: <TeacherRecords />,
},

      {
        path: "reports",
        element: <TeacherReports />,
      },

      {
        path: "profile",
        element: <TeacherProfile />,
      },

      {
        path: "settings",
        element: <TeacherSettings />,
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
        element: <StudentDashboard />,
      },

      {
        path: "halaqa",
        element: <MyHalaqa />,
      },

      {
        path: "classmates",
        element: <Classmates />,
      },

      {
        path: "recitations",
        element: <StudentRecitations />,
      },

      {
        path: "monthly-plan",
        element: <StudentMonthlyPlan />,
      },

      {
        path: "monthly-achievement",
        element: <StudentMonthlyAchievement />,
      },

      {
        path: "attendance",
        element: <StudentAttendance />,
      },

      {
        path: "points",
        element: <StudentPoints />,
      },

      {
        path: "exams",
        element: <StudentExams />,
      },

      {
        path: "notifications",
        element: <StudentNotifications />,
      },

      {
        path: "settings",
        element: <StudentSettings />,
      },

      {
        path: "profile",
        element: <StudentProfile />,
      },
    ],
  },

  {
    path: "*",
    element: <Login />,
  },
]);

export default router;
