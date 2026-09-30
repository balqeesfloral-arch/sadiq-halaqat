-- Fix lesson-derived revision cycles for the "toward An-Nas / reverse surah" direction.
--
-- Example:
--   lesson = Ya-Sin (36)
--   current review = Sad (38)
--   direction = backward
-- Expected cycle:
--   An-Nas (114) -> ... -> Sad (38) -> As-Saffat (37) -> wrap -> An-Nas (114)
--
-- The previous implementation incorrectly built the backward cycle from
-- lesson_no - 1 down to Al-Baqarah, which placed the cycle on the wrong
-- side of the student's memorized lesson.

create or replace function public.quran_revision_cycle_bounds(
  p_lesson_surah text,
  p_direction text
)
returns table(
  cycle_start_surah_no integer,
  cycle_start_surah_name text,
  cycle_start_ayah integer,
  cycle_end_surah_no integer,
  cycle_end_surah_name text,
  cycle_end_ayah integer
)
language plpgsql
stable
set search_path = public
as $function$
declare
  v_mushaf_id bigint;
  v_lesson_no integer;
  v_start public.quran_ayahs%rowtype;
  v_end public.quran_ayahs%rowtype;
begin
  if p_direction not in ('forward','backward') then
    raise exception 'QURAN_DIRECTION_INVALID';
  end if;

  select id into v_mushaf_id
  from public.quran_mushaf_versions
  where is_active = true
  order by id
  limit 1;

  if v_mushaf_id is null then
    raise exception 'QURAN_ACTIVE_MUSHAF_NOT_FOUND';
  end if;

  v_lesson_no := public.quran_resolve_surah_no(p_lesson_surah);

  if v_lesson_no is null then
    raise exception 'QURAN_LESSON_SURAH_INVALID';
  end if;

  if p_direction = 'forward' then
    -- Normal Qur'an order: the review cycle starts immediately after the
    -- student's lesson and continues through An-Nas.
    if v_lesson_no >= 114 then
      return;
    end if;

    select * into v_start
    from public.quran_ayahs
    where mushaf_version_id = v_mushaf_id
      and sura_no = v_lesson_no + 1
    order by aya_no
    limit 1;

    select * into v_end
    from public.quran_ayahs
    where mushaf_version_id = v_mushaf_id
      and sura_no = 114
    order by aya_no desc
    limit 1;
  else
    -- Reverse-surah review ("from An-Nas upward"):
    -- the complete memorized cycle is An-Nas down to the surah immediately
    -- after the current lesson. Once that lower boundary is reached, the
    -- cyclic generator wraps back to An-Nas for the next cycle.
    if v_lesson_no >= 114 then
      return;
    end if;

    select * into v_start
    from public.quran_ayahs
    where mushaf_version_id = v_mushaf_id
      and sura_no = 114
    order by aya_no
    limit 1;

    select * into v_end
    from public.quran_ayahs
    where mushaf_version_id = v_mushaf_id
      and sura_no = v_lesson_no + 1
    order by aya_no desc
    limit 1;
  end if;

  if v_start.id is null or v_end.id is null then
    return;
  end if;

  return query
  select
    v_start.sura_no::integer,
    v_start.sura_name_ar,
    v_start.aya_no::integer,
    v_end.sura_no::integer,
    v_end.sura_name_ar,
    v_end.aya_no::integer;
end;
$function$;

revoke all on function public.quran_revision_cycle_bounds(text, text) from public;
grant execute on function public.quran_revision_cycle_bounds(text, text) to authenticated;
