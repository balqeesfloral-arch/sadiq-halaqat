export function buildTeacherStats(data) {
  if (!data) return null;

  const presentCount =
    data.todayAttendance?.filter(
      (a) => a.status === "present"
    ).length || 0;

  const absentCount =
    data.todayAttendance?.filter(
      (a) => a.status === "absent"
    ).length || 0;

  const totalPoints =
    data.todayRecitations?.reduce(
      (sum, item) => sum + (item.points || 0),
      0
    ) || 0;

  const completedPlans =
    data.monthlyProgress?.filter(
      (p) => p.memorization_completed
    ).length || 0;

  return {
    studentsCount:
      data.students?.length || 0,

    halaqatCount:
      data.teacherHalaqat?.length || 0,

    presentCount,

    absentCount,

    recitationsCount:
      data.todayRecitations?.length || 0,

    examsCount:
      data.exams?.length || 0,

    totalPoints,

    completedPlans,
  };
}