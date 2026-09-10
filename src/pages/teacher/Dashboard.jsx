import { useEffect, useState } from "react";





import { supabase } from "../../lib/supabase";

import { getTeacherDashboardData }
from "../../services/teacherDashboardService";

import { buildTeacherStats }
from "../../utils/teacherDashboardStats";

import { buildTeacherAlerts }
from "../../utils/teacherAlertsBuilder";

import DashboardSkeleton
from "./dashboard/DashboardSkeleton";

import TeacherHero
from "./dashboard/TeacherHero";

import TeacherStats
from "./dashboard/TeacherStats";

import TeacherCharts
from "./dashboard/TeacherCharts";

import TopStudents
from "./dashboard/TopStudents";

import LatestRecitations
from "./dashboard/LatestRecitations";

import TeacherAlerts
from "./dashboard/TeacherAlerts";

import QuickActions
from "./dashboard/QuickActions";

import { showToast }
from "../../components/Toast";

export default function Dashboard() {
  const [loading, setLoading] =
  useState(true);

const [teacher, setTeacher] =
  useState(null);

const [stats, setStats] =
  useState(null);

const [alerts, setAlerts] =
  useState([]);

const [topStudents, setTopStudents] =
  useState([]);

const [latestRecitations, setLatestRecitations] =
  useState([]);


  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
  try {

    setLoading(true);

    const {
      data: { user },
    } =
      await supabase.auth.getUser();

    if (!user)
      return;

    const { data: profile } =
      await supabase
        .from("profiles")
        .select("*")
        .eq(
          "auth_user_id",
          user.id
        )
        .single();

    if (!profile)
      return;

    const teacherId =
      profile.id;

    const data =
      await getTeacherDashboardData(
        teacherId
      );

    const teacherStats =
      buildTeacherStats(
        data
      );

    const teacherAlerts =
      buildTeacherAlerts(
        data
      );

    setTeacher(profile);

    setStats(
      teacherStats
    );

    setAlerts(
      teacherAlerts
    );

    setTopStudents(
      data.students
        ?.sort(
          (a, b) =>
            (b.total_points || 0) -
            (a.total_points || 0)
        )
        .slice(0, 5)
        || []
    );

    setLatestRecitations(
      data.recitations
        ?.slice(0, 10)
        || []
    );

  } catch (error) {

    console.error(error);

    showToast(
  "تعذر تحميل لوحة المعلم",
  "error"
);

  } finally {

    setLoading(false);

  }
}

if (loading) {
  return (
    <DashboardSkeleton />
  );
}

return (
  <div className="space-y-8">

    <TeacherHero
  teacherName={
    teacher?.full_name
  }
  halaqaName={
    "حلقة القرآن"
  }
  mosqueName={
    "المسجد"
  }
  studentsCount={
    stats?.studentsCount || 0
  }
  attendanceCount={
    stats?.presentCount || 0
  }
  recitationsCount={
    stats?.recitationsCount || 0
  }
/>

   <TeacherStats
  studentsCount={
    stats?.studentsCount || 0
  }
  presentCount={
    stats?.presentCount || 0
  }
  absentCount={
    stats?.absentCount || 0
  }
  recitationsCount={
    stats?.recitationsCount || 0
  }
  examsCount={
    stats?.examsCount || 0
  }
  achievementRate={
    stats?.achievementRate || 0
  }
/>

    <TeacherCharts
      stats={stats}
    />

    <div
      className="
      grid
      grid-cols-1
      xl:grid-cols-2
      gap-6
    "
    >

      <TopStudents
        students={topStudents}
      />

      <LatestRecitations
        recitations={
          latestRecitations
        }
      />

    </div>

    <TeacherAlerts
      alerts={alerts}
    />

    <QuickActions />

  </div>
);

}

