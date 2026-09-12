import { createBrowserRouter } from "react-router-dom";

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

import TeacherLayout from "./layouts/TeacherLayout";

import TeacherDashboard from "./pages/teacher/Dashboard";
import TeacherStudents from "./pages/teacher/Students";
import TeacherAttendance from "./pages/teacher/Attendance";
import TeacherRecitations from "./pages/teacher/Recitations";
import TeacherPoints from "./pages/teacher/Points";
import TeacherMonthlyAchievement from "./pages/teacher/MonthlyAchievement";
import TeacherExams from "./pages/teacher/Exams";
import TeacherNotifications from "./pages/teacher/Notifications";
import TeacherReports from "./pages/teacher/Reports";
import TeacherProfile from "./pages/teacher/Profile";
import TeacherSettings from "./pages/teacher/Settings";
import TeacherHalaqat
  from "./pages/teacher/Halaqat";
import TeacherMonthlyPlan from "./pages/teacher/MonthlyPlan";
import TeacherStudentCare from "./pages/teacher/StudentCare";
import PublicLayout from "./layouts/PublicLayout";
import LandingPage from "./pages/LandingPage";

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
  path: "/system-admin",
  element: <SystemAdmin />,
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

  

      // =========================
      // طلاب الحلقات
      // =========================
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
      path: "monthly-achievement",
      element: <TeacherMonthlyAchievement />,
    },

    {
      path: "exams",
      element: <TeacherExams />,
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
{
  path: "monthly-plan",
  element: <TeacherMonthlyPlan />,
},
{
  path: "notifications",
  element: <TeacherStudentCare />,
},
  ],
},


  {
    path: "*",
    element: <Login />,
  },
]);

export default router;