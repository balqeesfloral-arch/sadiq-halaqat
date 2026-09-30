-- Run after the migration. All fixtures and cloned functions are temporary.
-- The production Quran dataset is read-only; no student records are changed.
begin;
create temp table profiles as select * from public.profiles where false;
create temp table monthly_plans as select * from public.monthly_plans where false;
create temp table student_halaqat as select * from public.student_halaqat where false;
create temp table attendance_holidays as select * from public.attendance_holidays where false;
create temp table student_learning_interventions as select * from public.student_learning_interventions where false;
create temp table quran_student_policies as select * from public.quran_student_policies where false;
create temp table recitations as select * from public.recitations where false;
create temp table recitation_segments as select * from public.recitation_segments where false;
create temp table quran_assignments as select * from public.quran_assignments where false;
create temp sequence fixture_policy_id start 1000;
alter table pg_temp.quran_student_policies alter column id set default nextval('pg_temp.fixture_policy_id');
create unique index fixture_one_active on pg_temp.quran_student_policies(student_id,halaqa_id) where active;

create function pg_temp.actor_id() returns bigint language sql as $$
  select case current_setting('test.learning_actor',true) when 'teacher' then 101::bigint when 'outside' then 202::bigint else null::bigint end;
$$;
create function pg_temp.actor_role() returns text language sql as $$ select 'teacher'::text; $$;
create function pg_temp.can_manage(bigint) returns boolean language sql as $$
  select coalesce(current_setting('test.learning_actor',true)='teacher',false);
$$;

-- Exercise the exact installed bodies against isolated fixtures.
do $$
declare f record; definition text; relation_name text;
begin
  for f in select p.oid from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname in ('quran_save_learning_policy','quran_effective_monthly_targets',
      'quran_generate_side_lesson_legacy_v2','quran_generate_side_lesson_v2')
  loop
    definition:=pg_get_functiondef(f.oid);
    foreach relation_name in array array['profiles','monthly_plans','student_halaqat','attendance_holidays',
      'student_learning_interventions','quran_student_policies','recitations','recitation_segments','quran_assignments',
      'quran_save_learning_policy','quran_effective_monthly_targets','quran_generate_side_lesson_legacy_v2','quran_generate_side_lesson_v2']
    loop definition:=replace(definition,'public.'||relation_name,'pg_temp.'||relation_name); end loop;
    definition:=replace(definition,'public.current_profile_id()','pg_temp.actor_id()');
    definition:=replace(definition,'public.current_profile_role()','pg_temp.actor_role()');
    definition:=replace(definition,'public.is_teacher_of_halaqa(','pg_temp.can_manage(');
    definition:=replace(definition,'private.can_manage_halaqa_records(','pg_temp.can_manage(');
    execute definition;
  end loop;
end $$;

insert into pg_temp.profiles(id,recitation_days) values
  (1,array['sunday','monday','tuesday','wednesday','thursday']);
insert into pg_temp.student_halaqat(student_id,halaqa_id,start_date,is_current) values(1,10,'2026-09-01',true);
insert into pg_temp.monthly_plans(id,student_id,halaqa_id,plan_month,planned_sessions,recitation_days_snapshot,
  memorization_daily_amount,memorization_daily_unit,memorization_target_faces,
  revision_daily_amount,revision_daily_unit,revision_target_faces)
  values(1,1,10,'2026-09-01',22,array['sunday','monday','tuesday','wednesday','thursday'],0.5,'faces',11,1,'faces',22);
insert into pg_temp.quran_student_policies(id,student_id,halaqa_id,effective_from,effective_to,active,lesson_enabled,
  side_lesson_mode,side_lesson_switch_percent,side_lesson_when_paused,revision_scope_mode)
  values(1,1,10,'2026-09-01','2026-09-15',false,false,'adaptive_surah',50,'keep','lesson_derived'),
        (2,1,10,'2026-09-16',null,true,true,'adaptive_surah',50,'keep','lesson_derived');

create temp table learning_test_results(name text primary key,passed boolean not null);
do $$
declare result record; generated jsonb; generated2 jsonb; new_id bigint;
  old_id bigint; day_today date:=(current_timestamp at time zone 'Asia/Riyadh')::date;
begin
  select * into result from pg_temp.quran_effective_monthly_targets(10,'2026-09-01','2026-09-30');
  if result.memorization_sessions<>11 or result.memorization_target_faces<>5.5 or result.revision_target_faces<>22
    then raise exception 'FAIL: mid-month resume: %',to_jsonb(result); end if;
  insert into learning_test_results values('resume_mid_month_independent_revision',true);
  insert into pg_temp.attendance_holidays(halaqa_id,holiday_date) values(10,'2026-09-23'),(10,'2026-09-23');
  select * into result from pg_temp.quran_effective_monthly_targets(10,'2026-09-01','2026-09-30');
  if result.memorization_sessions<>10 or result.memorization_target_faces<>5 or result.revision_target_faces<>21
    then raise exception 'FAIL: holidays'; end if;
  insert into learning_test_results values('holidays_excluded_once',true);
  delete from pg_temp.attendance_holidays;
  delete from pg_temp.quran_student_policies;
  update pg_temp.student_halaqat set start_date='2026-09-16';
  select * into result from pg_temp.quran_effective_monthly_targets(10,'2026-09-01','2026-09-30');
  if result.memorization_sessions<>11 or result.revision_sessions<>11 then raise exception 'FAIL: enrollment'; end if;
  insert into learning_test_results values('late_enrollment',true);
  update pg_temp.student_halaqat set start_date='2026-09-01';
  insert into pg_temp.student_learning_interventions(id,student_id,halaqa_id,intervention_type,status,start_date,end_date)
    values(1,1,10,'stabilization_full','completed','2026-09-05','2026-09-16');
  select * into result from pg_temp.quran_effective_monthly_targets(10,'2026-09-01','2026-09-30');
  if result.memorization_sessions<>14 or result.memorization_target_faces<>7 or result.revision_target_faces<>22
    then raise exception 'FAIL: completed intervention: %',to_jsonb(result); end if;
  insert into learning_test_results values('completed_intervention_history',true);
  delete from pg_temp.student_learning_interventions;
  select * into result from pg_temp.quran_effective_monthly_targets(10,'2026-09-01','2026-09-30');
  if result.memorization_target_faces<>11 or result.revision_target_faces<>22 then raise exception 'FAIL: unchanged plan'; end if;
  insert into learning_test_results values('unchanged_plan_targets_preserved',true);
  insert into pg_temp.quran_student_policies(id,student_id,halaqa_id,effective_from,active,lesson_enabled,
    side_lesson_mode,side_lesson_switch_percent,side_lesson_when_paused,revision_scope_mode)
    values(3,1,10,'2026-09-01',true,true,'adaptive_surah',50,'keep','lesson_derived');
  generated:=pg_temp.quran_generate_side_lesson_v2(1,10,'الملك',1,'2026-09-20','forward');
  if generated->>'resolved_mode'<>'previous_surah' or public.quran_resolve_surah_no(generated->>'start_surah_name')<>66
    then raise exception 'FAIL: previous forward: %',generated; end if;
  insert into learning_test_results values('adaptive_previous_forward',true);
  generated:=pg_temp.quran_generate_side_lesson_v2(1,10,'الملك',30,'2026-09-20','forward');
  if generated->>'resolved_mode'<>'from_surah_start' or (generated->>'start_ayah')::integer<>1
    or (generated->>'end_ayah')::integer<>29 then raise exception 'FAIL: adaptive threshold: %',generated; end if;
  insert into learning_test_results values('adaptive_switch_at_threshold',true);
  generated:=pg_temp.quran_generate_side_lesson_v2(1,10,'الملك',1,'2026-09-20','backward');
  if public.quran_resolve_surah_no(generated->>'start_surah_name')<>68 then raise exception 'FAIL: previous backward'; end if;
  insert into learning_test_results values('adaptive_previous_backward',true);
  generated:=pg_temp.quran_generate_side_lesson_v2(1,10,'الناس',6,'2026-09-20','backward');
  if (generated->>'start_ayah')::integer<>1 or (generated->>'end_ayah')::integer<>5 then raise exception 'FAIL: last surah'; end if;
  insert into learning_test_results values('adaptive_at_mushaf_boundary',true);
  update pg_temp.quran_student_policies set revision_scope_mode='manual',revision_scope_start_surah='التحريم',
    revision_scope_start_ayah=2,revision_scope_end_surah='التحريم',revision_scope_end_ayah=12;
  generated:=pg_temp.quran_generate_side_lesson_v2(1,10,'الملك',1,'2026-09-20','forward');
  if generated->>'side_lesson_mode'<>'none' then raise exception 'FAIL: partial previous surah'; end if;
  insert into learning_test_results values('adaptive_respects_memorized_scope',true);
  update pg_temp.quran_student_policies set lesson_enabled=false,side_lesson_mode='adaptive_surah',
    side_lesson_when_paused='memorized_cycle',side_lesson_amount=1,side_lesson_unit='faces',
    revision_scope_mode='manual',revision_scope_start_surah='الإخلاص',revision_scope_start_ayah=1,
    revision_scope_end_surah='الناس',revision_scope_end_ayah=6;
  generated:=pg_temp.quran_generate_side_lesson_v2(1,10,null,null,'2026-09-20','forward','forward');
  if generated->>'side_lesson_mode'<>'memorized_cycle' or generated->>'start_surah_name' is null
    then raise exception 'FAIL: side cycle while paused: %',generated; end if;
  insert into learning_test_results values('paused_lesson_keeps_side_cycle',true);
  insert into pg_temp.recitations(id,student_id,halaqa_id,recitation_date,next_to_surah,next_to_ayah,next_evaluation)
    values(1,1,10,'2026-09-19','الناس',5,'ممتاز');
  generated:=pg_temp.quran_generate_side_lesson_v2(1,10,null,null,'2026-09-20','forward','forward');
  if (generated->>'wrap_count')::integer<>1 then raise exception 'FAIL: wrap forward: %',generated; end if;
  insert into learning_test_results values('side_cycle_wrap_forward',true);
  insert into pg_temp.recitations(id,student_id,halaqa_id,recitation_date,next_to_surah,next_to_ayah,next_evaluation)
    values(2,1,10,'2026-09-20','الإخلاص',4,'إعادة');
  generated2:=pg_temp.quran_generate_side_lesson_v2(1,10,null,null,'2026-09-20','forward','forward');
  if generated<>generated2 then raise exception 'FAIL: repeat advanced cursor'; end if;
  insert into learning_test_results values('repeat_preserves_cursor',true);
  delete from pg_temp.recitations;
  update pg_temp.quran_student_policies set revision_scope_start_surah='الناس',revision_scope_end_surah='الإخلاص',revision_scope_end_ayah=4;
  insert into pg_temp.recitations(id,student_id,halaqa_id,recitation_date,next_to_surah,next_to_ayah,next_evaluation)
    values(1,1,10,'2026-09-19','الإخلاص',3,'ممتاز');
  generated:=pg_temp.quran_generate_side_lesson_v2(1,10,null,null,'2026-09-20','backward','backward');
  if (generated->>'wrap_count')::integer<>1 then raise exception 'FAIL: wrap backward: %',generated; end if;
  insert into learning_test_results values('side_cycle_wrap_backward',true);
  perform set_config('test.learning_actor','teacher',true);
  select id into old_id from pg_temp.quran_student_policies where active;
  new_id:=pg_temp.quran_save_learning_policy(1,10,'{"lesson_enabled":true}',day_today);
  if new_id=old_id or not exists(select 1 from pg_temp.quran_student_policies where id=old_id and effective_to=day_today-1 and not active)
    then raise exception 'FAIL: version history'; end if;
  insert into learning_test_results values('policy_version_preserves_history',true);
  if new_id<>pg_temp.quran_save_learning_policy(1,10,'{"lesson_enabled":true}',day_today)
    then raise exception 'FAIL: idempotent save'; end if;
  insert into learning_test_results values('unchanged_save_is_idempotent',true);
  if new_id<>pg_temp.quran_save_learning_policy(1,10,'{"lesson_enabled":false}',day_today)
    then raise exception 'FAIL: same-day duplicate'; end if;
  insert into learning_test_results values('same_day_change_has_one_version',true);
  begin
    perform pg_temp.quran_save_learning_policy(1,10,'{"lesson_enabled":true}',day_today+1);
    raise exception 'FAIL: future date allowed';
  exception when others then if sqlerrm<>'POLICY_DATE_INVALID' then raise; end if; end;
  insert into learning_test_results values('future_policy_date_rejected',true);
  begin
    perform pg_temp.quran_save_learning_policy(1,10,'{"lesson_enabled":true}',day_today-1);
    raise exception 'FAIL: history overwrite allowed';
  exception when others then if sqlerrm<>'POLICY_DATE_BEFORE_LAST_CHANGE' then raise; end if; end;
  insert into learning_test_results values('policy_history_overwrite_rejected',true);
  perform set_config('test.learning_actor','outside',true);
  begin
    perform pg_temp.quran_save_learning_policy(1,10,'{"lesson_enabled":true}',day_today);
    raise exception 'FAIL: outside teacher allowed';
  exception when others then if sqlerrm<>'POLICY_FORBIDDEN' then raise; end if; end;
  insert into learning_test_results values('outside_teacher_write_rejected',true);
  perform set_config('test.learning_actor','anonymous',true);
  begin
    perform pg_temp.quran_save_learning_policy(1,10,'{"lesson_enabled":false}',day_today);
    raise exception 'FAIL: unauthenticated write allowed';
  exception when others then if sqlerrm<>'AUTH_REQUIRED' then raise; end if; end;
  insert into learning_test_results values('unauthenticated_write_rejected',true);
end $$;
select count(*) as passed_tests, bool_and(passed) as all_passed from learning_test_results;
rollback;
