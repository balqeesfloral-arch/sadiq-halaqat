-- Date-effective learning rules. Existing plans and recitations remain unchanged.
alter table public.quran_student_policies
  add column lesson_enabled boolean,
  add column lesson_start_surah text,
  add column lesson_start_ayah integer check (lesson_start_ayah > 0),
  add column lesson_start_date date,
  add column lesson_daily_amount numeric check (lesson_daily_amount >= 0),
  add column lesson_daily_unit text check (lesson_daily_unit in ('lines','faces')),
  add column side_lesson_switch_percent numeric not null default 50
    check (side_lesson_switch_percent > 0 and side_lesson_switch_percent <= 100),
  add column side_lesson_when_paused text not null default 'keep'
    check (side_lesson_when_paused in ('keep','none','memorized_cycle'));

do $$
declare c record;
begin
  for c in select conname from pg_constraint
    where conrelid='public.quran_student_policies'::regclass
      and contype='c' and pg_get_constraintdef(oid) like 'CHECK ((side_lesson_mode =%'
  loop execute format('alter table public.quran_student_policies drop constraint %I',c.conname); end loop;
end $$;
alter table public.quran_student_policies add constraint quran_student_policies_mode_v2_check
  check (side_lesson_mode in ('none','previous_amount','previous_surah','from_surah_start','custom','adaptive_surah','memorized_cycle'));

create index quran_student_policies_history_idx
  on public.quran_student_policies(student_id,halaqa_id,effective_from desc,id desc);
create index recitations_side_cursor_idx on public.recitations(student_id,halaqa_id,recitation_date desc,id desc)
  where next_to_surah is not null and next_to_ayah is not null;

create policy quran_student_policies_student_read on public.quran_student_policies
  for select to authenticated using (student_id=(select public.current_profile_id()));
create policy student_learning_interventions_student_read on public.student_learning_interventions
  for select to authenticated using (student_id=(select public.current_profile_id()));

create or replace function public.quran_save_learning_policy(
  p_student_id bigint,p_halaqa_id bigint,p_patch jsonb,p_effective_from date default current_date
) returns bigint language plpgsql security invoker set search_path=public as $$
declare
  v_actor bigint := public.current_profile_id();
  v_old public.quran_student_policies%rowtype;
  v_new public.quran_student_policies%rowtype;
  v_date date := coalesce(p_effective_from,(current_timestamp at time zone 'Asia/Riyadh')::date);
  v_id bigint;
  v_keys text[] := array['side_lesson_mode','side_lesson_amount','side_lesson_unit',
    'boundary_suggestion_mode','revision_scope_mode','revision_scope_start_surah',
    'revision_scope_start_ayah','revision_scope_end_surah','revision_scope_end_ayah',
    'revision_scope_updated_at','lesson_enabled','lesson_start_surah','lesson_start_ayah',
    'lesson_daily_amount','lesson_daily_unit','side_lesson_switch_percent','side_lesson_when_paused'];
begin
  if v_actor is null then raise exception 'AUTH_REQUIRED'; end if;
  if not private.can_manage_halaqa_records(p_halaqa_id) or
    not (public.current_profile_role()='admin' or public.is_teacher_of_halaqa(p_halaqa_id))
    then raise exception 'POLICY_FORBIDDEN'; end if;
  if not exists(select 1 from public.student_halaqat
      where student_id=p_student_id and halaqa_id=p_halaqa_id)
    then raise exception 'STUDENT_NOT_IN_HALAQA'; end if;
  if v_date > (current_timestamp at time zone 'Asia/Riyadh')::date or v_date is null
    then raise exception 'POLICY_DATE_INVALID'; end if;
  if p_patch is null or jsonb_typeof(p_patch)<>'object' or
    exists(select 1 from jsonb_object_keys(p_patch) k where not k=any(v_keys))
    then raise exception 'POLICY_PATCH_INVALID'; end if;
  if p_patch->>'lesson_enabled'='true' and
    not exists(select 1 from public.profiles where id=p_student_id and coalesce(cardinality(recitation_days),0)>0) and
    not exists(select 1 from public.monthly_plans where student_id=p_student_id and halaqa_id=p_halaqa_id
      and coalesce(cardinality(recitation_days_snapshot),0)>0) then raise exception 'LESSON_DAYS_REQUIRED'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_student_id::text||':'||p_halaqa_id::text,0));
  select * into v_old from public.quran_student_policies
    where student_id=p_student_id and halaqa_id=p_halaqa_id and active
    order by effective_from desc,id desc limit 1 for update;
  if v_old.id is not null and v_date < v_old.effective_from then raise exception 'POLICY_DATE_BEFORE_LAST_CHANGE'; end if;
  v_new := jsonb_populate_record(v_old,p_patch);
  if p_patch ? 'lesson_start_surah' or p_patch ? 'lesson_start_ayah' then v_new.lesson_start_date:=v_date; end if;
  v_new.side_lesson_mode := coalesce(v_new.side_lesson_mode,'none');
  v_new.side_lesson_switch_percent := coalesce(v_new.side_lesson_switch_percent,50);
  v_new.side_lesson_when_paused := coalesce(v_new.side_lesson_when_paused,'keep');
  v_new.boundary_suggestion_mode := coalesce(v_new.boundary_suggestion_mode,'ayah_and_surah');
  v_new.revision_scope_mode := coalesce(v_new.revision_scope_mode,'lesson_derived');
  if (v_new.side_lesson_mode in ('previous_amount','memorized_cycle') or
      (v_new.side_lesson_mode<>'none' and v_new.side_lesson_when_paused='memorized_cycle'))
    and (coalesce(v_new.side_lesson_amount,0)<=0 or coalesce(v_new.side_lesson_unit,'') not in ('lines','faces'))
    then raise exception 'SIDE_AMOUNT_REQUIRED'; end if;
  if v_new.side_lesson_mode='memorized_cycle' or v_new.side_lesson_when_paused='memorized_cycle' then
    if v_new.revision_scope_mode<>'manual' or v_new.revision_scope_start_surah is null
      or v_new.revision_scope_end_surah is null or v_new.revision_scope_start_ayah is null
      or v_new.revision_scope_end_ayah is null then raise exception 'MEMORIZED_SCOPE_REQUIRED'; end if;
  end if;
  if v_new.revision_scope_mode='manual' and
    (not exists(select 1 from public.quran_position_info(v_new.revision_scope_start_surah,v_new.revision_scope_start_ayah))
      or not exists(select 1 from public.quran_position_info(v_new.revision_scope_end_surah,v_new.revision_scope_end_ayah)))
    then raise exception 'MEMORIZED_SCOPE_INVALID'; end if;
  if v_new.lesson_start_surah is not null then
    if not exists(select 1 from public.quran_position_info(v_new.lesson_start_surah,v_new.lesson_start_ayah))
      then raise exception 'LESSON_START_INVALID'; end if;
  end if;
  if p_patch->>'lesson_enabled'='true' then
    update public.student_learning_interventions set status='completed',end_date=v_date,
      completed_by=v_actor,completion_note='استئناف الدرس من إعداد التسميع',updated_at=now()
      where student_id=p_student_id and halaqa_id=p_halaqa_id and status='active'
        and intervention_type='stabilization_full' and start_date<=v_date;
  end if;
  if v_old.id is not null and (select jsonb_object_agg(k,to_jsonb(v_old)->k) from unnest(v_keys) k)
    = (select jsonb_object_agg(k,to_jsonb(v_new)->k) from unnest(v_keys) k) then return v_old.id; end if;
  if v_old.id is not null and v_date=v_old.effective_from then
    v_id:=v_old.id;
    update public.quran_student_policies set
      side_lesson_mode=v_new.side_lesson_mode,side_lesson_amount=v_new.side_lesson_amount,
      side_lesson_unit=v_new.side_lesson_unit,boundary_suggestion_mode=v_new.boundary_suggestion_mode,
      revision_scope_mode=v_new.revision_scope_mode,revision_scope_start_surah=v_new.revision_scope_start_surah,
      revision_scope_start_ayah=v_new.revision_scope_start_ayah,revision_scope_end_surah=v_new.revision_scope_end_surah,
      revision_scope_end_ayah=v_new.revision_scope_end_ayah,revision_scope_updated_at=v_new.revision_scope_updated_at,
      lesson_enabled=v_new.lesson_enabled,lesson_start_surah=v_new.lesson_start_surah,
      lesson_start_ayah=v_new.lesson_start_ayah,lesson_start_date=v_new.lesson_start_date,lesson_daily_amount=v_new.lesson_daily_amount,
      lesson_daily_unit=v_new.lesson_daily_unit,side_lesson_switch_percent=v_new.side_lesson_switch_percent,
      side_lesson_when_paused=v_new.side_lesson_when_paused,updated_at=now()
    where id=v_id;
  else
    if v_old.id is not null then
      update public.quran_student_policies set active=false,effective_to=v_date-1,updated_at=now() where id=v_old.id;
    end if;
    insert into public.quran_student_policies(student_id,halaqa_id,teacher_id,mushaf_version_id,
      side_lesson_mode,side_lesson_amount,side_lesson_unit,side_lesson_custom_start_word_id,side_lesson_custom_end_word_id,boundary_suggestion_mode,
      revision_scope_mode,revision_scope_start_surah,revision_scope_start_ayah,revision_scope_end_surah,
      revision_scope_end_ayah,revision_scope_updated_at,lesson_enabled,lesson_start_surah,lesson_start_ayah,lesson_start_date,
      lesson_daily_amount,lesson_daily_unit,side_lesson_switch_percent,side_lesson_when_paused,effective_from,active)
    values(p_student_id,p_halaqa_id,v_actor,v_old.mushaf_version_id,
      v_new.side_lesson_mode,v_new.side_lesson_amount,v_new.side_lesson_unit,
      v_old.side_lesson_custom_start_word_id,v_old.side_lesson_custom_end_word_id,v_new.boundary_suggestion_mode,
      v_new.revision_scope_mode,v_new.revision_scope_start_surah,v_new.revision_scope_start_ayah,
      v_new.revision_scope_end_surah,v_new.revision_scope_end_ayah,v_new.revision_scope_updated_at,
      v_new.lesson_enabled,v_new.lesson_start_surah,v_new.lesson_start_ayah,v_new.lesson_start_date,
      v_new.lesson_daily_amount,v_new.lesson_daily_unit,v_new.side_lesson_switch_percent,
      v_new.side_lesson_when_paused,v_date,true) returning id into v_id;
  end if;
  update public.quran_assignments set status='superseded',updated_at=now()
    where student_id=p_student_id and halaqa_id=p_halaqa_id and assignment_date>=v_date
      and status='planned' and source in ('generated','intervention');
  return v_id;
end $$;

-- Targets are computed for the actual Hijri period supplied by the UI.
-- Approval snapshots in monthly_plans are never rewritten by this function.
create or replace function public.quran_effective_monthly_targets(
  p_halaqa_id bigint,p_period_start date,p_period_end date
) returns table(student_id bigint,memorization_sessions integer,revision_sessions integer,
  planned_sessions integer,memorization_target_faces numeric,revision_target_faces numeric,
  memorization_expected_percent numeric,revision_expected_percent numeric)
language plpgsql stable security invoker set search_path=public as $$
declare
  mp public.monthly_plans%rowtype;
  pol public.quran_student_policies%rowtype;
  iv public.student_learning_interventions%rowtype;
  v_days text[];
  d date; v_month_sessions integer; v_sessions integer; v_mem_sessions integer; v_rev_sessions integer;
  v_mem numeric; v_rev numeric; v_mem_elapsed numeric; v_rev_elapsed numeric;
  v_daily_mem numeric; v_daily_rev numeric; v_base_mem numeric; v_base_rev numeric;
  v_nominal_mem numeric; v_nominal_rev numeric;
  v_eligible boolean; v_mem_changed boolean; v_rev_changed boolean;
  v_today date := (current_timestamp at time zone 'Asia/Riyadh')::date;
  day_names text[]:=array['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
begin
  if p_period_end<p_period_start or p_period_end-p_period_start>35 then raise exception 'PLAN_PERIOD_INVALID'; end if;
  for mp in select m.* from public.monthly_plans m
    where m.halaqa_id=p_halaqa_id and m.plan_month=p_period_start
  loop
    v_days:=mp.recitation_days_snapshot;
    if coalesce(cardinality(v_days),0)=0 then
      select p.recitation_days into v_days from public.profiles p where p.id=mp.student_id;
    end if;
    if coalesce(cardinality(v_days),0)=0 then
      return query select mp.student_id,coalesce(mp.planned_sessions,0),coalesce(mp.planned_sessions,0),
        coalesce(mp.planned_sessions,0),mp.memorization_target_faces,mp.revision_target_faces,0::numeric,0::numeric;
      continue;
    end if;
    select count(*)::integer into v_month_sessions from generate_series(p_period_start,p_period_end,interval '1 day') dt
      where day_names[extract(dow from dt)::integer+1]=any(v_days);
    v_base_mem:=case when mp.memorization_daily_amount is not null then
      mp.memorization_daily_amount/case when mp.memorization_daily_unit='lines' then 15 else 1 end
      else coalesce(mp.memorization_target_faces,0)/greatest(coalesce(nullif(mp.planned_sessions,0),v_month_sessions),1) end;
    v_base_rev:=case when mp.revision_daily_amount is not null then
      mp.revision_daily_amount/case when mp.revision_daily_unit='lines' then 15 else 1 end
      else coalesce(mp.revision_target_faces,0)/greatest(coalesce(nullif(mp.planned_sessions,0),v_month_sessions),1) end;
    v_sessions:=0;v_mem_sessions:=0;v_rev_sessions:=0;
    v_mem:=0;v_rev:=0;v_mem_elapsed:=0;v_rev_elapsed:=0;v_mem_changed:=false;v_rev_changed:=false;
    for d in select dt::date from generate_series(p_period_start,p_period_end,interval '1 day') dt loop
      if not day_names[extract(dow from d)::integer+1]=any(v_days) then continue; end if;
      v_eligible:=exists(select 1 from public.student_halaqat sh
        where sh.student_id=mp.student_id and sh.halaqa_id=p_halaqa_id and sh.start_date<=d
          and (sh.end_date is null or sh.end_date>=d));
      if not v_eligible or exists(select 1 from public.attendance_holidays h
        where h.halaqa_id=p_halaqa_id and h.holiday_date=d) then continue; end if;
      v_sessions:=v_sessions+1;
      select * into pol from public.quran_student_policies p
        where p.student_id=mp.student_id and p.halaqa_id=p_halaqa_id
          and (p.active or p.effective_to is not null) and p.effective_from<=d
          and (p.effective_to is null or p.effective_to>=d)
        order by p.effective_from desc,p.id desc limit 1;
      select * into iv from public.student_learning_interventions i
        where i.student_id=mp.student_id and i.halaqa_id=p_halaqa_id
          and i.status in ('active','completed') and i.start_date<=d
          and (i.end_date is null or case when i.status='completed' then d<i.end_date else d<=i.end_date end)
        order by i.start_date desc,i.id desc limit 1;
      v_daily_mem:=case when pol.lesson_daily_amount is not null then
        pol.lesson_daily_amount/case when pol.lesson_daily_unit='lines' then 15 else 1 end else v_base_mem end;
      v_daily_rev:=case when iv.review_daily_amount is not null then
        iv.review_daily_amount/case when iv.review_daily_unit='lines' then 15 else 1 end else v_base_rev end;
      if pol.lesson_enabled=false or pol.lesson_start_date between p_period_start and p_period_end
        or (pol.lesson_daily_amount is not null and v_daily_mem<>v_base_mem)
        or iv.id is not null then v_mem_changed:=true; end if;
      if iv.id is not null then v_rev_changed:=true; end if;
      if iv.intervention_type='stabilization_partial' then
        v_daily_mem:=coalesce(iv.lesson_override_amount,0)/case when iv.lesson_override_unit='lines' then 15 else 1 end;
      end if;
      if coalesce(pol.lesson_enabled,true) and coalesce(iv.intervention_type,'') not in ('pause','stabilization_full')
        and v_daily_mem>0 then
        v_mem_sessions:=v_mem_sessions+1;v_mem:=v_mem+v_daily_mem;
        if d<=v_today then v_mem_elapsed:=v_mem_elapsed+v_daily_mem; end if;
      end if;
      if coalesce(iv.intervention_type,'')<>'pause' and v_daily_rev>0 then
        v_rev_sessions:=v_rev_sessions+1;v_rev:=v_rev+v_daily_rev;
        if d<=v_today then v_rev_elapsed:=v_rev_elapsed+v_daily_rev; end if;
      end if;
    end loop;
    v_nominal_mem:=v_mem;v_nominal_rev:=v_rev;
    if not v_mem_changed and v_sessions=coalesce(mp.planned_sessions,v_month_sessions) then
      v_mem:=coalesce(mp.memorization_target_faces,v_mem);
    end if;
    if not v_rev_changed and v_sessions=coalesce(mp.planned_sessions,v_month_sessions) then
      v_rev:=coalesce(mp.revision_target_faces,v_rev);
    end if;
    return query select mp.student_id,v_mem_sessions,v_rev_sessions,v_sessions,round(v_mem,2),round(v_rev,2),
      case when v_nominal_mem>0 then least(100,round(100*v_mem_elapsed/v_nominal_mem,2)) else 0 end,
      case when v_nominal_rev>0 then least(100,round(100*v_rev_elapsed/v_nominal_rev,2)) else 0 end;
  end loop;
end $$;

-- Reuse the proven range engine for existing modes, with date-effective rules
-- and the direction explicitly supplied by the Hijri plan.
CREATE OR REPLACE FUNCTION public.quran_generate_side_lesson_legacy_v2(p_student_id bigint, p_halaqa_id bigint, p_lesson_start_surah text, p_lesson_start_ayah integer, p_on_date date DEFAULT CURRENT_DATE, p_direction text DEFAULT 'forward', p_mode text DEFAULT NULL)
 RETURNS TABLE(policy_id bigint, side_lesson_mode text, side_lesson_amount numeric, side_lesson_unit text, boundary_suggestion_mode text, start_surah_no integer, start_surah_name text, start_ayah integer, end_surah_no integer, end_surah_name text, end_ayah integer, start_page integer, end_page integer, quran_lines integer, faces numeric, precision_label text)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
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
    and (p.active = true or p.effective_to is not null)
    and p.effective_from <= coalesce(p_on_date,current_date)
    and (p.effective_to is null or p.effective_to >= coalesce(p_on_date,current_date))
  order by p.effective_from desc, p.id desc
  limit 1;

  v_policy.side_lesson_mode := coalesce(p_mode,v_policy.side_lesson_mode);
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

  v_direction := case when p_direction='backward' then 'backward' else 'forward' end;

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

  if v_adjacent.id is null and v_policy.side_lesson_mode = 'previous_amount' then
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


create or replace function public.quran_generate_side_lesson_v2(
  p_student_id bigint,p_halaqa_id bigint,p_lesson_start_surah text,p_lesson_start_ayah integer,
  p_on_date date default current_date,p_direction text default 'forward',
  p_cycle_direction text default 'forward',p_force_cycle boolean default false,
  p_review_end_surah text default null,p_review_end_ayah integer default null
) returns jsonb language plpgsql stable security invoker set search_path=public as $$
declare
  pol public.quran_student_policies%rowtype;
  v_mode text; v_result jsonb; v_range record; v_next record; v_last record;
  v_start text; v_ayah integer; v_direction text;
  v_total record; v_done record; v_end integer; v_no integer; v_progress numeric:=0;
  v_reason text; v_bounds jsonb; v_amount numeric; v_empty jsonb;
begin
  select * into pol from public.quran_student_policies p
    where p.student_id=p_student_id and p.halaqa_id=p_halaqa_id
      and (p.active or p.effective_to is not null) and p.effective_from<=p_on_date
      and (p.effective_to is null or p.effective_to>=p_on_date)
    order by p.effective_from desc,p.id desc limit 1;
  v_mode:=coalesce(pol.side_lesson_mode,'none');
  v_empty:=jsonb_build_object('policy_id',pol.id,'side_lesson_mode','none');
  if v_mode='none' then return v_empty; end if;
  if pol.lesson_enabled=false or p_force_cycle then
    if pol.side_lesson_when_paused='none' then return v_empty; end if;
    if pol.side_lesson_when_paused='memorized_cycle' then v_mode:='memorized_cycle'; end if;
  end if;
  if v_mode='memorized_cycle' then
    if pol.revision_scope_mode<>'manual' or pol.revision_scope_start_surah is null
      or pol.revision_scope_end_surah is null then
      return v_empty||jsonb_build_object('generated_reason','حدد نطاق المحفوظ لتشغيل الدورة');
    end if;
    v_direction:=case when p_cycle_direction='backward' then 'backward' else 'forward' end;
    v_start:=pol.revision_scope_start_surah;v_ayah:=pol.revision_scope_start_ayah;
    select r.next_to_surah,r.next_to_ayah into v_last from public.recitations r
      where r.student_id=p_student_id and r.halaqa_id=p_halaqa_id and r.recitation_date<=p_on_date
        and r.next_to_surah is not null and r.next_to_ayah is not null
        and r.next_evaluation is distinct from 'إعادة'
        and not exists(select 1 from public.recitation_segments s
          where s.recitation_id=r.id and s.segment_type='side_lesson' and s.sequence_no=1
            and s.completion_status in ('repeat','skipped'))
      order by r.recitation_date desc,r.id desc limit 1;
    -- A fresh side cycle starts after today's revision; later it has its own cursor.
    if v_last.next_to_surah is null and p_review_end_surah is not null then
      v_last.next_to_surah:=p_review_end_surah;v_last.next_to_ayah:=p_review_end_ayah;
    end if;
    if v_last.next_to_surah is not null and
      not (public.quran_resolve_surah_no(v_last.next_to_surah)=public.quran_resolve_surah_no(pol.revision_scope_end_surah)
        and v_last.next_to_ayah=pol.revision_scope_end_ayah) then
      if v_direction='backward' then
        select * into v_next from public.quran_next_reverse_surah_position(v_last.next_to_surah,v_last.next_to_ayah);
      else
        select * into v_next from public.quran_next_ayah(v_last.next_to_surah,v_last.next_to_ayah);
      end if;
      if v_next.surah_name is not null then v_start:=v_next.surah_name;v_ayah:=v_next.ayah; end if;
    end if;
    if v_direction='backward' then
      select * into v_total from public.quran_reverse_surah_range_metrics(pol.revision_scope_start_surah,
        pol.revision_scope_start_ayah,pol.revision_scope_end_surah,pol.revision_scope_end_ayah);
    else
      select * into v_total from public.quran_range_metrics(pol.revision_scope_start_surah,
        pol.revision_scope_start_ayah,pol.revision_scope_end_surah,pol.revision_scope_end_ayah);
    end if;
    v_amount:=least(pol.side_lesson_amount,case when pol.side_lesson_unit='lines'
      then v_total.quran_lines::numeric else v_total.faces end);
    if coalesce(v_amount,0)<=0 then return v_empty; end if;
    select * into v_range from public.quran_generate_cyclic_assignment(v_start,v_ayah,
      pol.revision_scope_start_surah,pol.revision_scope_start_ayah,
      pol.revision_scope_end_surah,pol.revision_scope_end_ayah,v_direction,v_amount,pol.side_lesson_unit);
    v_bounds:=jsonb_build_object('startSurah',pol.revision_scope_start_surah,'startAyah',pol.revision_scope_start_ayah,
      'endSurah',pol.revision_scope_end_surah,'endAyah',pol.revision_scope_end_ayah);
    return to_jsonb(v_range)||jsonb_build_object('policy_id',pol.id,'side_lesson_mode','memorized_cycle',
      'side_lesson_amount',v_amount,'side_lesson_unit',pol.side_lesson_unit,'direction',v_direction,
      'cycle_bounds',v_bounds,'generated_reason','دورة مستقلة على كامل المحفوظ');
  end if;
  if p_lesson_start_surah is null or p_lesson_start_ayah is null then return v_empty; end if;
  if v_mode='adaptive_surah' then
    v_no:=public.quran_resolve_surah_no(p_lesson_start_surah);
    select max(a.aya_no) into v_end from public.quran_ayahs a
      join public.quran_mushaf_versions m on m.id=a.mushaf_version_id and m.is_active where a.sura_no=v_no;
    if p_lesson_start_ayah>1 then
      select * into v_total from public.quran_range_metrics(p_lesson_start_surah,1,p_lesson_start_surah,v_end);
      select * into v_done from public.quran_range_metrics(p_lesson_start_surah,1,p_lesson_start_surah,p_lesson_start_ayah-1);
      v_progress:=100*v_done.quran_lines/nullif(v_total.quran_lines,0);
    end if;
    if v_progress>=pol.side_lesson_switch_percent then
      v_mode:='from_surah_start';v_reason:='من بداية السورة بعد بلوغ حد التثبيت';
    else
      v_mode:='previous_surah';v_reason:='السورة السابقة حتى بلوغ حد التثبيت';
    end if;
    -- An explicit memorized scope must include the entire previous surah.
    if v_mode='previous_surah' and pol.revision_scope_mode='manual' then
      v_no:=v_no+case when p_direction='backward' then 1 else -1 end;
      if v_no not between least(public.quran_resolve_surah_no(pol.revision_scope_start_surah),
          public.quran_resolve_surah_no(pol.revision_scope_end_surah))
        and greatest(public.quran_resolve_surah_no(pol.revision_scope_start_surah),
          public.quran_resolve_surah_no(pol.revision_scope_end_surah)) then
        return v_empty||jsonb_build_object('generated_reason','لا توجد سورة سابقة في المحفوظ المحدد');
      end if;
      select max(a.aya_no) into v_end from public.quran_ayahs a
        join public.quran_mushaf_versions m on m.id=a.mushaf_version_id and m.is_active where a.sura_no=v_no;
      if (v_no=public.quran_resolve_surah_no(pol.revision_scope_start_surah) and pol.revision_scope_start_ayah<>1)
        or (v_no=public.quran_resolve_surah_no(pol.revision_scope_end_surah) and pol.revision_scope_end_ayah<>v_end) then
        return v_empty||jsonb_build_object('generated_reason','السورة السابقة غير مكتملة في المحفوظ المحدد');
      end if;
    end if;
  end if;
  select to_jsonb(r) into v_result from public.quran_generate_side_lesson_legacy_v2(
    p_student_id,p_halaqa_id,p_lesson_start_surah,p_lesson_start_ayah,p_on_date,p_direction,v_mode) r;
  return coalesce(v_result,v_empty)||jsonb_build_object('resolved_mode',v_mode,
    'configured_mode',pol.side_lesson_mode,'progress_percent',round(v_progress,1),'generated_reason',v_reason);
end $$;

revoke all on function public.quran_save_learning_policy(bigint,bigint,jsonb,date) from public,anon;
revoke all on function public.quran_effective_monthly_targets(bigint,date,date) from public,anon;
revoke all on function public.quran_generate_side_lesson_legacy_v2(bigint,bigint,text,integer,date,text,text) from public,anon;
revoke all on function public.quran_generate_side_lesson_v2(bigint,bigint,text,integer,date,text,text,boolean,text,integer) from public,anon;
grant execute on function public.quran_save_learning_policy(bigint,bigint,jsonb,date) to authenticated,service_role;
grant execute on function public.quran_effective_monthly_targets(bigint,date,date) to authenticated,service_role;
grant execute on function public.quran_generate_side_lesson_legacy_v2(bigint,bigint,text,integer,date,text,text) to authenticated,service_role;
grant execute on function public.quran_generate_side_lesson_v2(bigint,bigint,text,integer,date,text,text,boolean,text,integer) to authenticated,service_role;
notify pgrst,'reload schema';
