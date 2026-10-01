export function sideLessonAmount(faces, lines, linesPerFace = 15) {
  const faceCount = Number(faces || 0);
  const lineCount = Number(lines || 0);
  if (!Number.isSafeInteger(faceCount) || !Number.isSafeInteger(lineCount) || faceCount < 0 || lineCount < 0) {
    throw new Error("أدخل عددًا صحيحًا للأوجه والأسطر، دون أرقام سالبة.");
  }
  const totalLines = faceCount * linesPerFace + lineCount;
  if (!Number.isSafeInteger(totalLines) || totalLines > 10000 * linesPerFace + linesPerFace - 1) {
    throw new Error("مقدار جنب الدرس أكبر من المسموح.");
  }
  return { faces: Math.floor(totalLines / linesPerFace), lines: totalLines % linesPerFace,
    totalFaces: totalLines / linesPerFace, totalLines };
}

export function validateSideLesson(faces, lines, evaluation, linesPerFace = 15) {
  const amount = sideLessonAmount(faces, lines, linesPerFace);
  if (amount.totalLines > 0 && !evaluation) throw new Error("حدد تقييم جنب الدرس.");
  if (amount.totalLines === 0 && evaluation) throw new Error("أدخل مقدار جنب الدرس أو امسح تقييمه.");
  return amount;
}

export function storedSideLesson(record, program = "quran") {
  const linesPerFace = program === "noorania" ? 10 : 15;
  const manual = record?.side_lesson_faces != null || record?.side_lesson_lines != null;
  const totalFaces = manual
    ? Number(record.side_lesson_faces || 0) + Number(record.side_lesson_lines || 0) / linesPerFace
    : Number(record?._side_lesson_raw_faces || 0);
  const totalLines = Math.round(totalFaces * linesPerFace);
  return { faces: Math.floor(totalLines / linesPerFace), lines: totalLines % linesPerFace,
    totalFaces, totalLines, manual,
    evaluation: program === "quran" ? record?.next_evaluation || "" : record?.side_lesson_evaluation || "" };
}

export function formatSideLesson(faces, lines, linesPerFace = 15) {
  const amount = sideLessonAmount(faces, lines, linesPerFace);
  const parts = [];
  if (amount.faces) parts.push(`${amount.faces} وجه`);
  if (amount.lines) parts.push(`${amount.lines} سطر`);
  return parts.join(" و ") || "بدون";
}

export function formatSideLessonTotal(totalFaces, linesPerFace = 15) {
  const total = Number(totalFaces || 0);
  if (!total) return "بدون";
  const totalLines = Math.round(total * linesPerFace);
  if (!linesPerFace || Math.abs(total * linesPerFace - totalLines) > 0.002) {
    return `${Number(total.toFixed(4))} وجه`;
  }
  return formatSideLesson(Math.floor(totalLines / linesPerFace), totalLines % linesPerFace, linesPerFace);
}

export function formatMonthlySideLessons(rows) {
  const amounts = rows.filter(row => Number(row.side_lesson_faces || 0) > 0);
  const units = new Set(amounts.map(row => row.side_lesson_lines_per_face ?? 15));
  return formatSideLessonTotal(amounts.reduce((sum, row) => sum + Number(row.side_lesson_faces), 0),
    units.size === 1 ? [...units][0] : 0);
}

export function sideLessonPayload({ original, changed, faces, lines, evaluation, program = "quran" }) {
  if (original && !changed && !storedSideLesson(original, program).manual) return {};
  const amount = validateSideLesson(faces, lines, evaluation, program === "noorania" ? 10 : 15);
  const result = { side_lesson_faces: amount.faces, side_lesson_lines: amount.lines };
  if (program === "noorania") return { ...result, side_lesson: null, side_lesson_evaluation: evaluation || null };
  return { ...result, next_surah: null, next_from_ayah: null, next_to_surah: null, next_to_ayah: null,
    next_evaluation: evaluation || null, next2_surah: null, next2_from_ayah: null, next2_to_surah: null,
    next2_to_ayah: null, next2_evaluation: null };
}

export async function withSideLessonMetrics(supabase, records, program = "quran") {
  if (!records.length) return records;
  const results = await Promise.all(Array.from({ length: Math.ceil(records.length / 200) }, (_, index) =>
    supabase.from("recitation_side_lesson_totals").select("recitation_id,raw_faces,accepted_faces")
      .eq("program", program).in("recitation_id", records.slice(index * 200, (index + 1) * 200).map(row => row.id))));
  const metrics = new Map();
  for (const result of results) {
    if (result.error) throw result.error;
    for (const row of result.data || []) metrics.set(Number(row.recitation_id), row);
  }
  return records.map(row => ({ ...row, _side_lesson_raw_faces: Number(metrics.get(Number(row.id))?.raw_faces || 0),
    _side_lesson_accepted_faces: Number(metrics.get(Number(row.id))?.accepted_faces || 0) }));
}

export async function monthlySideLessonTotals(supabase, halaqaId, studentIds, period) {
  const totals = new Map();
  totals.linesPerFace = new Map();
  if (!studentIds.length) return totals;
  const batches = Array.from({ length: Math.ceil(studentIds.length / 200) }, (_, index) => studentIds.slice(index * 200, (index + 1) * 200));
  await Promise.all(batches.map(async ids => {
    for (let offset = 0; ; offset += 1000) {
      const { data, error } = await supabase.from("recitation_side_lesson_totals")
        .select("student_id,program,accepted_faces").eq("halaqa_id", Number(halaqaId)).in("student_id", ids)
        .gte("recitation_date", period.start).lte("recitation_date", period.end)
        .order("program").order("recitation_id").range(offset, offset + 999);
      if (error) throw error;
      for (const row of data || []) {
        const studentId = Number(row.student_id);
        const amount = Number(row.accepted_faces || 0);
        totals.set(studentId, (totals.get(studentId) || 0) + amount);
        if (amount > 0) {
          const unit = row.program === "noorania" ? 10 : 15;
          const previous = totals.linesPerFace.get(studentId);
          totals.linesPerFace.set(studentId, previous == null || previous === unit ? unit : 0);
        }
      }
      if ((data || []).length < 1000) break;
    }
  }));
  return totals;
}
