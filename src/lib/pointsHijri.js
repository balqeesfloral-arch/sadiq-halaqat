const UMM_AL_QURA = new Intl.DateTimeFormat(
  "en-US-u-ca-islamic-umalqura",
  {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }
);

export const HIJRI_MONTHS = [
  "محرم",
  "صفر",
  "ربيع الأول",
  "ربيع الآخر",
  "جمادى الأولى",
  "جمادى الآخرة",
  "رجب",
  "شعبان",
  "رمضان",
  "شوال",
  "ذو القعدة",
  "ذو الحجة",
];

export function getHijriParts(date = new Date()) {
  const parts = {};

  UMM_AL_QURA.formatToParts(date).forEach((part) => {
    if (["year", "month", "day"].includes(part.type)) {
      parts[part.type] = Number(part.value);
    }
  });

  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
  };
}

export function getCurrentHijriPeriod() {
  const { year, month } = getHijriParts();

  return {
    year,
    month,
  };
}

export function shiftHijriPeriod(period, delta) {
  let year = Number(period.year);
  let month = Number(period.month) + Number(delta);

  while (month < 1) {
    month += 12;
    year -= 1;
  }

  while (month > 12) {
    month -= 12;
    year += 1;
  }

  return { year, month };
}

export function isSameHijriPeriod(a, b) {
  return (
    Number(a?.year) === Number(b?.year) &&
    Number(a?.month) === Number(b?.month)
  );
}

export function hijriPeriodLabel(period) {
  if (!period?.year || !period?.month) {
    return "—";
  }

  return `${HIJRI_MONTHS[Number(period.month) - 1]} ${period.year} هـ`;
}

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

const gregorianCache = new Map();

export function findGregorianForHijri(year, month, day = 1) {
  const cacheKey = `${year}-${month}-${day}`;

  if (gregorianCache.has(cacheKey)) {
    return gregorianCache.get(cacheKey);
  }

  const approxYear = Math.floor(Number(year) * 0.970224 + 621.5774);
  const cursor = new Date(approxYear - 1, 0, 1, 12);
  const end = new Date(approxYear + 1, 11, 31, 12);

  while (cursor <= end) {
    const hijri = getHijriParts(cursor);

    if (
      hijri.year === Number(year) &&
      hijri.month === Number(month) &&
      hijri.day === Number(day)
    ) {
      const value = toDateKey(cursor);
      gregorianCache.set(cacheKey, value);
      return value;
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  throw new Error("تعذر تحديد نطاق الشهر الهجري.");
}

export function getHijriMonthRange(period) {
  const start = findGregorianForHijri(
    Number(period.year),
    Number(period.month),
    1
  );

  const next = shiftHijriPeriod(period, 1);

  const nextStart = findGregorianForHijri(
    Number(next.year),
    Number(next.month),
    1
  );

  const endDate = new Date(`${nextStart}T12:00:00`);
  endDate.setDate(endDate.getDate() - 1);

  return {
    start,
    end: toDateKey(endDate),
  };
}

export function groupPointTransactions(rows = []) {
  const map = new Map();

  for (const row of rows) {
    const sessionKey =
      row.session_id ||
      `legacy-${row.id}`;

    if (!map.has(sessionKey)) {
      map.set(sessionKey, {
        id: sessionKey,
        session_id: row.session_id || null,
        student_id: row.student_id,
        student_name: row.student_name || "—",
        category: row.category,
        halaqa_id: row.halaqa_id,
        transaction_date: row.transaction_date,
        created_at: row.created_at,
        notes: row.notes || "",
        items: [],
        totalPoints: 0,
      });
    }

    const session = map.get(sessionKey);

    session.items.push(row);
    session.totalPoints += Number(row.points || 0);

    if (
      row.created_at &&
      (!session.created_at ||
        new Date(row.created_at) > new Date(session.created_at))
    ) {
      session.created_at = row.created_at;
    }
  }

  return [...map.values()].sort((a, b) => {
    const aDate = new Date(a.created_at || a.transaction_date || 0);
    const bDate = new Date(b.created_at || b.transaction_date || 0);
    return bDate - aDate;
  });
}

export function buildMonthlyStudentTotals(
  rows = [],
  students = []
) {
  const map = new Map();

  students.forEach((student) => {
    map.set(Number(student.id), {
      student_id: Number(student.id),
      student_name: student.full_name || "—",
      grants: 0,
      deductions: 0,
      net: 0,
      sessions: 0,
    });
  });

  for (const row of rows) {
    const studentId = Number(row.student_id);

    if (!map.has(studentId)) {
      map.set(studentId, {
        student_id: studentId,
        student_name: row.student_name || "—",
        grants: 0,
        deductions: 0,
        net: 0,
        sessions: 0,
      });
    }

    const item = map.get(studentId);
    const points = Number(row.points || 0);

    if (row.category === "grant") {
      item.grants += points;
    } else if (row.category === "deduction") {
      item.deductions += Math.abs(points);
    }

    item.net += points;
  }

  const sessions = groupPointTransactions(rows);

  sessions.forEach((session) => {
    const item = map.get(Number(session.student_id));
    if (item) item.sessions += 1;
  });

  return [...map.values()].sort((a, b) =>
    String(a.student_name).localeCompare(
      String(b.student_name),
      "ar"
    )
  );
}

export function createPointsSessionId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
    /[xy]/g,
    (char) => {
      const random = Math.floor(Math.random() * 16);
      const value = char === "x" ? random : (random & 0x3) | 0x8;
      return value.toString(16);
    }
  );
}

export async function syncStudentCurrentMonthPoints(
  supabase,
  studentId
) {
  const current = getCurrentHijriPeriod();
  const range = getHijriMonthRange(current);

  const { data, error } = await supabase
    .from("points_transactions")
    .select("points")
    .eq("student_id", studentId)
    .gte("transaction_date", range.start)
    .lte("transaction_date", range.end);

  if (error) {
    throw error;
  }

  const total = (data || []).reduce(
    (sum, row) => sum + Number(row.points || 0),
    0
  );

  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      total_points: total,
    })
    .eq("id", studentId);

  if (updateError) {
    throw updateError;
  }

  return total;
}

export async function syncStudentsCurrentMonthPointsFromRows(
  supabase,
  students,
  monthRows
) {
  const summary = buildMonthlyStudentTotals(
    monthRows,
    students
  );

  await Promise.all(
    summary.map((item) =>
      supabase
        .from("profiles")
        .update({
          total_points: item.net,
        })
        .eq("id", item.student_id)
    )
  );

  return summary;
}
