-- Make "previous_surah" follow the student's memorization direction.
--
-- For forward memorization (Al-Fatihah -> An-Nas), the adjacent learned surah
-- is lesson_no - 1.
-- For backward memorization (An-Nas -> Al-Fatihah), the adjacent learned surah
-- is lesson_no + 1.
--
-- Example: lesson At-Tahrim (66), backward => side lesson Al-Mulk (67).

create or replace function public.quran_generate_side_lesson_from_policy(
  p_student_id bigint,
  p_halaqa_id bigint,
  p_lesson_start_surah text,
  p_lesson_start_ayah integer,
  p_on_date date default current_date
)
returns table(
  policy_id bigint,
  side_lesson_mode text,
  side_lesson_amount numeric,
  side_lesson_unit text,
  boundary_suggestion_mode text,
  start_surah_no integer,
  start_surah_name text,
  start_ayah integer,
  end_surah_no integer,
  end_surah_name text,
  end_ayah integer,
  start_page integer,
  end_page integer,
  quran_lines integer,
  faces numeric,
  precision_label text
)
language plpgsql
stable
set search_path = public
as $function$
declare
  v_policy public.quran_student_policies%rowtype;
  v_lesson public.quran_ayahs%rowtype;
  v_adjacent public.quran_ayahs%rowtype;
  v_start public.quran_ayahs%rowtype;
  v_end public.quran_ayahs%rowtype;
  v_prev_range record;
  v_metrics record;
  v_mushaf_id bigint;
  v_direction text := 'forward';
  v_adjacent_surah_no integer;
begin
  select id into v_mushaf_id
  from public.quran_mushaf_versions
  where is_active = true
  order by id
  limit 1;

  if v_mushaf_id is null then
    raise exception 'QURAN_ACTIVE_MUSHAF_NOT_FOUND';
  end if;

  select * into v_policy
  from public.quran_student_policies p
  where p.student_id = p_student_id
    and p.halaqa_id = p_halaqa_id
    and p.active = true
    and p.effective_from <= coalesce(p_on_date,current_date)
    and (p.effective_to is null or p.effective_to >= coalesce(p_on_date,current_date))
  order by p.effective_from desc, p.id desc
  limit 1;

  if v_policy.id is null or v_policy.side_lesson_mode = 'none' then
    return query
    select v_policy.id, coalesce(v_policy.side_lesson_mode,'none'),
      v_policy.side_lesson_amount, v_policy.side_lesson_unit,
      coalesce(v_policy.boundary_suggestion_mode,'ayah_and_surah'),
      null::integer,null::text,null::integer,
      null::integer,null::text,null::integer,
      null::integer,null::integer,null::integer,null::numeric,'none'::text;
    return;
  end if;

  select a.* into v_lesson
  from public.quran_ayahs a
  where a.mushaf_version_id = v_mushaf_id
    and a.sura_no = public.quran_resolve_surah_no(p_lesson_start_surah)
    and a.aya_no = p_lesson_start_ayah
  limit 1;

  if v_lesson.id is null then
    raise exception 'QURAN_LESSON_START_NOT_FOUND';
  end if;

  -- Resolve the student's active memorization direction from the plan covering
  -- the requested date. Default remains forward for legacy rows.
  select case
           when mp.memorization_direction in ('forward','backward')
             then mp.memorization_direction
           else 'forward'
         end
    into v_direction
  from public.monthly_plans mp
  where mp.student_id = p_student_id
    and mp.halaqa_id = p_halaqa_id
    and mp.plan_type = 'quran'
    and mp.active = true
    and make_date(mp.gregorian_year, mp.gregorian_month, 1)
        <= coalesce(p_on_date,current_date)
    and (make_date(mp.gregorian_year, mp.gregorian_month, 1) + interval '1 month - 1 day')::date
        >= coalesce(p_on_date,current_date)
  order by mp.updated_at desc nulls last, mp.id desc
  limit 1;

  v_direction := coalesce(v_direction, 'forward');

  -- "Previous amount" means immediately behind the lesson in the student's
  -- learning path, not always behind in printed Mushaf order.
  if v_direction = 'backward' then
    select a.* into v_adjacent
    from public.quran_ayahs a
    where a.mushaf_version_id = v_mushaf_id
      and a.source_id > v_lesson.source_id
    order by a.source_id
    limit 1;
  else
    select a.* into v_adjacent
    from public.quran_ayahs a
    where a.mushaf_version_id = v_mushaf_id
      and a.source_id < v_lesson.source_id
    order by a.source_id desc
    limit 1;
  end if;

  if v_adjacent.id is null then
    return query
    select v_policy.id,v_policy.side_lesson_mode,v_policy.side_lesson_amount,
      v_policy.side_lesson_unit,v_policy.boundary_suggestion_mode,
      null::integer,null::text,null::integer,
      null::integer,null::text,null::integer,
      null::integer,null::integer,null::integer,null::numeric,'no_adjacent_ayah'::text;
    return;
  end if;

  if v_policy.side_lesson_mode = 'previous_amount' then
    if coalesce(v_policy.side_lesson_amount,0) <= 0
       or v_policy.side_lesson_unit not in ('lines','faces') then
      raise exception 'QURAN_SIDE_LESSON_AMOUNT_INVALID';
    end if;

    if v_direction = 'backward' then
      select * into v_prev_range
      from public.quran_generate_assignment(
        v_adjacent.sura_name_ar,
        v_adjacent.aya_no,
        v_policy.side_lesson_amount,
        v_policy.side_lesson_unit
      );
    else
      select * into v_prev_range
      from public.quran_generate_previous_assignment(
        v_adjacent.sura_name_ar,
        v_adjacent.aya_no,
        v_policy.side_lesson_amount,
        v_policy.side_lesson_unit
      );
    end if;

    return query
    select v_policy.id, v_policy.side_lesson_mode, v_policy.side_lesson_amount,
      v_policy.side_lesson_unit, v_policy.boundary_suggestion_mode,
      v_prev_range.start_surah_no, v_prev_range.start_surah_name, v_prev_range.start_ayah,
      v_prev_range.end_surah_no, v_prev_range.end_surah_name, v_prev_range.end_ayah,
      v_prev_range.start_page, v_prev_range.end_page, v_prev_range.quran_lines,
      v_prev_range.faces, v_prev_range.precision_label;
    return;
  end if;

  if v_policy.side_lesson_mode = 'previous_surah' then
    v_adjacent_surah_no :=
      case when v_direction = 'backward'
        then v_lesson.sura_no + 1
        else v_lesson.sura_no - 1
      end;

    if v_adjacent_surah_no < 1 or v_adjacent_surah_no > 114 then
      return query
      select v_policy.id,v_policy.side_lesson_mode,v_policy.side_lesson_amount,
        v_policy.side_lesson_unit,v_policy.boundary_suggestion_mode,
        null::integer,null::text,null::integer,
        null::integer,null::text,null::integer,
        null::integer,null::integer,null::integer,null::numeric,'no_adjacent_surah'::text;
      return;
    end if;

    select * into v_start
    from public.quran_ayahs a
    where a.mushaf_version_id = v_mushaf_id and a.sura_no = v_adjacent_surah_no
    order by a.aya_no limit 1;

    select * into v_end
    from public.quran_ayahs a
    where a.mushaf_version_id = v_mushaf_id and a.sura_no = v_adjacent_surah_no
    order by a.aya_no desc limit 1;

  elsif v_policy.side_lesson_mode = 'from_surah_start' then
    if v_lesson.aya_no <= 1 then
      return query
      select v_policy.id,v_policy.side_lesson_mode,v_policy.side_lesson_amount,
        v_policy.side_lesson_unit,v_policy.boundary_suggestion_mode,
        null::integer,null::text,null::integer,
        null::integer,null::text,null::integer,
        null::integer,null::integer,null::integer,null::numeric,'lesson_at_surah_start'::text;
      return;
    end if;

    select * into v_start
    from public.quran_ayahs a
    where a.mushaf_version_id = v_mushaf_id
      and a.sura_no = v_lesson.sura_no and a.aya_no = 1
    limit 1;

    select * into v_end
    from public.quran_ayahs a
    where a.mushaf_version_id = v_mushaf_id
      and a.source_id = v_lesson.source_id - 1
    limit 1;

  elsif v_policy.side_lesson_mode = 'custom' then
    return query
    select v_policy.id,v_policy.side_lesson_mode,v_policy.side_lesson_amount,
      v_policy.side_lesson_unit,v_policy.boundary_suggestion_mode,
      null::integer,null::text,null::integer,
      null::integer,null::text,null::integer,
      null::integer,null::integer,null::integer,null::numeric,'custom_requires_word_boundaries'::text;
    return;
  else
    raise exception 'QURAN_SIDE_LESSON_MODE_INVALID';
  end if;

  if v_start.id is null or v_end.id is null then
    raise exception 'QURAN_SIDE_LESSON_RANGE_NOT_FOUND';
  end if;

  select * into v_metrics
  from public.quran_range_metrics(
    v_start.sura_name_ar,v_start.aya_no,v_end.sura_name_ar,v_end.aya_no
  );

  return query
  select v_policy.id,v_policy.side_lesson_mode,v_policy.side_lesson_amount,
    v_policy.side_lesson_unit,v_policy.boundary_suggestion_mode,
    v_start.sura_no::integer,v_start.sura_name_ar,v_start.aya_no::integer,
    v_end.sura_no::integer,v_end.sura_name_ar,v_end.aya_no::integer,
    v_start.page::integer,v_end.page::integer,
    v_metrics.quran_lines,v_metrics.faces,v_metrics.precision_label;
end;
$function$;
