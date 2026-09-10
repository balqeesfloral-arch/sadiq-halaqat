export function buildTeacherAlerts({
  attendance,
  recitations,
  exams,
  monthlyProgress,
}) {
  const alerts = [];

  const today =
    new Date()
      .toISOString()
      .split("T")[0];

  attendance
    .filter(
      (a) =>
        a.status ===
          "absent" &&
        a.attendance_date ===
          today
    )
    .forEach((a) => {
      alerts.push({
        id:
          "absent-" +
          a.id,

        type:
          "absent",

        message:
          "يوجد طالب غائب اليوم",
      });
    });

  monthlyProgress
    .filter(
      (p) =>
        !p.approved
    )
    .forEach((p) => {
      alerts.push({
        id:
          "monthly-" +
          p.id,

        type:
          "monthly_plan",

        message:
          "خطة شهرية بانتظار الاعتماد",
      });
    });

  const nextWeek =
    new Date();

  nextWeek.setDate(
    nextWeek.getDate() + 7
  );

  exams.forEach((e) => {
    const examDate =
      new Date(
        e.exam_date
      );

    if (
      examDate <= nextWeek
    ) {
      alerts.push({
        id:
          "exam-" +
          e.id,

        type: "exam",

        message:
          e.title,
      });
    }
  });

  return alerts
    .slice(0, 10);
}