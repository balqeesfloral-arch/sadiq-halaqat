export function buildAttendanceChart(
  attendance
) {
  const map = {};

  attendance.forEach((item) => {

    const date =
      item.attendance_date;

    if (!map[date]) {
      map[date] = 0;
    }

    if (
      item.status === "present"
    ) {
      map[date]++;
    }

  });

  return Object.entries(map)
    .map(([date, count]) => ({
      date,
      attendance: count,
    }))
    .slice(-30);
}

export function buildRecitationChart(
  recitations
) {
  const map = {};

  recitations.forEach((item) => {

    const date =
      item.recitation_date;

    if (!map[date]) {
      map[date] = 0;
    }

    map[date]++;

  });

  return Object.entries(map)
    .map(([date, count]) => ({
      date,
      recitations: count,
    }))
    .slice(-30);
}