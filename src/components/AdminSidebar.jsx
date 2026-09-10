import { createBrowserRouter } from "react-router-dom";

import AdminLayout from "./components/AdminLayout";

import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import Profile from "./pages/Profile";

import Reports from "./pages/Reports";
import MonthlyProgress from "./pages/MonthlyProgress";
import PointsTransactions from "./pages/PointsTransactions";
import Competitions from "./pages/Competitions";
import Badges from "./pages/Badges";

import Mosques from "./pages/Mosques";
import Halaqat from "./pages/Halaqat";
import Teachers from "./pages/Teachers";
import Students from "./pages/Students";

import StudentAssignments from "./pages/StudentAssignments";
import TeacherAssignments from "./pages/TeacherAssignments";

import Attendance from "./pages/Attendance";
import Recitations from "./pages/Recitations";

const router = createBrowserRouter([
  /* =====================================
     LOGIN
  ===================================== */

  {
    path: "/",
    element: <Login />,
  },

  {
    path: "/login",
    element: <Login />,
  },

  /* =====================================
     ADMIN PANEL
  ===================================== */

  {
    path: "/admin",
    element: <AdminLayout />,

    children: [
      /* Dashboard */

      {
        index: true,
        element: <AdminDashboard />,
      },

      /* Profile */

      {
        path: "profile",
        element: <Profile />,
      },

      /* Reports */

      {
        path: "reports",
        element: <Reports />,
      },

      {
        path: "monthly-progress",
        element: <MonthlyProgress />,
      },

      {
        path: "points-transactions",
        element: <PointsTransactions />,
      },

      {
        path: "competitions",
        element: <Competitions />,
      },

      {
        path: "badges",
        element: <Badges />,
      },

      /* Mosques */

      {
        path: "mosques",
        element: <Mosques />,
      },

      /* Halaqat */

      {
        path: "halaqat",
        element: <Halaqat />,
      },

      /* Teachers */

      {
        path: "teachers",
        element: <Teachers />,
      },

      /* Students */

      {
        path: "students",
        element: <Students />,
      },

      /* Student Assignments */

      {
        path: "student-assignments",
        element: <StudentAssignments />,
      },

      /* Teacher Assignments */

      {
        path: "teacher-assignments",
        element: <TeacherAssignments />,
      },

      /* Attendance */

      {
        path: "attendance",
        element: <Attendance />,
      },

      /* Recitations */

      {
        path: "recitations",
        element: <Recitations />,
      },
    ],
  },

  /* =====================================
     REDIRECT UNKNOWN ROUTES
  ===================================== */

  {
    path: "*",
    element: <Login />,
  },
]);

export default router;