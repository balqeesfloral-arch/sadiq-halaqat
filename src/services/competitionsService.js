import { supabase } from "../lib/supabase";

/**
 * جلب المسابقات
 */
export async function getCompetitions({
  status,
  fromDate,
  toDate,
} = {}) {
  let query = supabase
    .from("competitions")
    .select("*")
    .order("start_date", {
      ascending: false,
    });

  if (status) {
    query = query.eq(
      "status",
      status
    );
  }

  if (fromDate) {
    query = query.gte(
      "start_date",
      fromDate
    );
  }

  if (toDate) {
    query = query.lte(
      "end_date",
      toDate
    );
  }

  const { data, error } =
    await query;

  if (error) {
    throw new Error(
      `تعذر تحميل المسابقات: ${error.message}`
    );
  }

  return data || [];
}

/**
 * إنشاء مسابقة
 */
export async function createCompetition(
  competition
) {
  const { data, error } =
    await supabase
      .from("competitions")
      .insert([
        {
          title:
            competition.title,
          description:
            competition.description ||
            null,
          start_date:
            competition.start_date,
          end_date:
            competition.end_date,
          status:
            competition.status ||
            "active",
          created_by:
            competition.created_by ||
            null,
        },
      ])
      .select()
      .single();

  if (error) {
    throw new Error(
      `تعذر إنشاء المسابقة: ${error.message}`
    );
  }

  return data;
}

/**
 * تعديل مسابقة
 */
export async function updateCompetition(
  competitionId,
  updates
) {
  const { data, error } =
    await supabase
      .from("competitions")
      .update(updates)
      .eq("id", competitionId)
      .select()
      .single();

  if (error) {
    throw new Error(
      `تعذر تعديل المسابقة: ${error.message}`
    );
  }

  return data;
}

/**
 * حذف مسابقة
 */
export async function deleteCompetition(
  competitionId
) {
  const { error } =
    await supabase
      .from("competitions")
      .delete()
      .eq("id", competitionId);

  if (error) {
    throw new Error(
      `تعذر حذف المسابقة: ${error.message}`
    );
  }

  return true;
}

/**
 * جلب المشاركين
 */
export async function getCompetitionParticipants(
  competitionId
) {
  const { data, error } =
    await supabase
      .from("competition_participants")
      .select("*")
      .eq(
        "competition_id",
        competitionId
      )
      .order("rank", {
        ascending: true,
        nullsFirst: false,
      });

  if (error) {
    throw new Error(
      `تعذر تحميل المشاركين: ${error.message}`
    );
  }

  return data || [];
}

/**
 * إضافة مشارك
 */
export async function addCompetitionParticipant(
  participant
) {
  const { data, error } =
    await supabase
      .from(
        "competition_participants"
      )
      .insert([
        {
          competition_id:
            participant.competition_id,
          student_id:
            participant.student_id,
          score:
            participant.score || 0,
          rank:
            participant.rank || null,
          notes:
            participant.notes ||
            null,
        },
      ])
      .select()
      .single();

  if (error) {
    throw new Error(
      `تعذر إضافة المشارك: ${error.message}`
    );
  }

  return data;
}

/**
 * تعديل نتيجة مشارك
 */
export async function updateCompetitionParticipant(
  participantId,
  updates
) {
  const { data, error } =
    await supabase
      .from(
        "competition_participants"
      )
      .update(updates)
      .eq("id", participantId)
      .select()
      .single();

  if (error) {
    throw new Error(
      `تعذر تعديل نتيجة المشارك: ${error.message}`
    );
  }

  return data;
}

/**
 * حذف مشارك
 */
export async function deleteCompetitionParticipant(
  participantId
) {
  const { error } =
    await supabase
      .from(
        "competition_participants"
      )
      .delete()
      .eq("id", participantId);

  if (error) {
    throw new Error(
      `تعذر حذف المشارك: ${error.message}`
    );
  }

  return true;
}