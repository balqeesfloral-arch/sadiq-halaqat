-- Isolated fixtures: no emails, notifications or persistent student changes.
begin;
create temp table simple_side_test_results(name text primary key,passed boolean not null);
grant insert on simple_side_test_results to authenticated;
do $tests$
declare t record; st record; n bigint; value numeric; denied boolean;
begin
  if private.legacy_side_lesson_faces('1.5',null,null,null)<>1.5
    or private.legacy_side_lesson_faces('٢.٩',null,null,null)<>2.9
    or private.legacy_side_lesson_faces('وجهان',null,null,null)<>2
    or private.legacy_side_lesson_faces('وجه',null,null,null)<>1
    or private.legacy_side_lesson_faces('ثلاثة اوجه',null,null,null)<>3
    or private.legacy_side_lesson_faces('15 سطر',null,null,null)<>1 then raise exception 'LEGACY_QUANTITY_TEXT_LOST'; end if;
  insert into simple_side_test_results values('historical_numeric_and_arabic_amounts_preserved',true);
  select p.id,p.auth_user_id,th.halaqa_id into t from public.profiles p
    join public.teacher_halaqat th on th.teacher_id=p.id
    where p.role='teacher' and p.status='active' and p.is_active and p.auth_user_id is not null
    order by p.id,th.id limit 1;
  select p.id,p.auth_user_id into st from public.profiles p
    join public.student_halaqat sh on sh.student_id=p.id
    where p.role='student' and sh.halaqa_id=t.halaqa_id and sh.is_current and p.auth_user_id is not null
    order by p.id limit 1;
  if t.id is null or st.id is null then raise exception 'TEST_ACTORS_UNAVAILABLE'; end if;
  insert into public.profiles(id,role,user_number,full_name,status,is_active) overriding system value
    values(-920000001,'student','SIDE-QUANTITY-FIXTURE','Side quantity test','active',true);
  insert into public.student_halaqat(id,student_id,halaqa_id,teacher_id,is_current) overriding system value
    values(-920000002,-920000001,t.halaqa_id,t.id,true);
  insert into public.quran_student_policies(student_id,halaqa_id,teacher_id,lesson_enabled,side_lesson_mode,effective_from)
    values(-920000001,t.halaqa_id,t.id,false,'none',current_date-2);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',t.auth_user_id,'role','authenticated')::text,true);
  perform set_config('request.jwt.claim.sub',t.auth_user_id::text,true);
  execute 'set local role authenticated';

  insert into public.recitations(id,student_id,halaqa_id,teacher_id,recitation_date,side_lesson_faces,side_lesson_lines,next_evaluation)
    overriding system value values(-920000003,-920000001,t.halaqa_id,t.id,'2026-10-01',2,7,'ممتاز');
  select accepted_faces into value from public.recitation_side_lesson_totals where program='quran' and recitation_id=-920000003;
  if abs(value-37/15.0)>0.00001 then raise exception 'WRONG_QUANTITY_TOTAL'; end if;
  insert into simple_side_test_results values('faces_and_lines_count_automatically',true);
  if exists(select 1 from public.monthly_plans where student_id=-920000001) then raise exception 'FIXTURE_HAS_PLAN'; end if;
  if not exists(select 1 from public.quran_student_policies where student_id=-920000001 and not lesson_enabled) then raise exception 'FIXTURE_NOT_PAUSED'; end if;
  insert into simple_side_test_results values('no_plan_and_paused_lesson_supported',true);
  select count(*) into n from public.recitation_segments where recitation_id=-920000003 and segment_type='side_lesson'
    and actual_start_ayah_id is null and actual_end_ayah_id is null and planned_amount is null and actual_quran_lines=37;
  if n<>1 then raise exception 'QUANTITY_SEGMENT_NOT_ATOMIC'; end if;
  insert into simple_side_test_results values('single_quantity_segment_without_ranges_or_target',true);

  update public.recitations set side_lesson_faces=3,side_lesson_lines=8 where id=-920000003;
  select accepted_faces into value from public.recitation_side_lesson_totals where program='quran' and recitation_id=-920000003;
  if abs(value-53/15.0)>0.00001 then raise exception 'EDIT_NOT_REFLECTED'; end if;
  select count(*) into n from public.recitation_segments where recitation_id=-920000003 and segment_type='side_lesson';
  if n<>1 then raise exception 'EDIT_DOUBLE_COUNTED'; end if;
  insert into simple_side_test_results values('edit_replaces_amount_without_duplicate_count',true);
  update public.recitations set next_evaluation='إعادة' where id=-920000003;
  select accepted_faces into value from public.recitation_side_lesson_totals where program='quran' and recitation_id=-920000003;
  if value<>0 then raise exception 'REPEAT_COUNTED'; end if;
  if not exists(select 1 from public.recitation_segments where recitation_id=-920000003 and completion_status='repeat' and actual_quran_lines=53) then raise exception 'REPEAT_HISTORY_LOST'; end if;
  insert into simple_side_test_results values('repeat_is_recorded_but_not_achievement',true);
  update public.recitations set next_evaluation='جيد',recitation_date='2026-09-01' where id=-920000003;
  select coalesce(sum(accepted_faces),0) into value from public.recitation_side_lesson_totals
    where student_id=-920000001 and recitation_date between '2026-10-01' and '2026-10-31';
  if value<>0 then raise exception 'OLD_MONTH_TOTAL_STALE'; end if;
  select accepted_faces into value from public.recitation_side_lesson_totals where recitation_id=-920000003 and program='quran';
  if abs(value-53/15.0)>0.00001 then raise exception 'NEW_MONTH_TOTAL_WRONG'; end if;
  insert into simple_side_test_results values('date_change_moves_achievement_to_its_month',true);

  denied:=false;
  begin update public.recitations set side_lesson_lines=-1 where id=-920000003; exception when check_violation then denied:=true; end;
  if not denied then raise exception 'NEGATIVE_AMOUNT_ACCEPTED'; end if;
  insert into simple_side_test_results values('negative_amount_rejected',true);
  denied:=false;
  begin update public.recitations set side_lesson_lines=15 where id=-920000003; exception when check_violation then denied:=true; end;
  if not denied then raise exception 'UNNORMALIZED_LINES_ACCEPTED'; end if;
  insert into simple_side_test_results values('line_remainder_validated',true);
  denied:=false;
  begin update public.recitations set next_evaluation=null where id=-920000003; exception when check_violation then denied:=true; end;
  if not denied then raise exception 'MISSING_EVALUATION_ACCEPTED'; end if;
  insert into simple_side_test_results values('positive_amount_requires_evaluation',true);
  denied:=false;
  begin update public.recitations set side_lesson_lines=null where id=-920000003; exception when check_violation then denied:=true; end;
  if not denied then raise exception 'PARTIAL_QUANTITY_ACCEPTED'; end if;
  insert into simple_side_test_results values('partial_quantity_rejected',true);

  update public.recitations set side_lesson_faces=0,side_lesson_lines=0,next_evaluation=null where id=-920000003;
  if exists(select 1 from public.recitation_segments where recitation_id=-920000003 and segment_type='side_lesson') then raise exception 'CLEAR_KEPT_AMOUNT'; end if;
  insert into simple_side_test_results values('clearing_amount_clears_its_achievement',true);
  delete from public.recitations where id=-920000003;
  if exists(select 1 from public.recitation_side_lesson_totals where recitation_id=-920000003 and program='quran') then raise exception 'DELETED_TOTAL_STALE'; end if;
  insert into simple_side_test_results values('deletion_removes_achievement',true);

  insert into public.recitations(id,student_id,halaqa_id,teacher_id,recitation_date,next_surah,next_from_ayah,next_to_surah,next_to_ayah,next_evaluation,
    next2_surah,next2_from_ayah,next2_to_surah,next2_to_ayah,next2_evaluation) overriding system value
    values(-920000004,-920000001,t.halaqa_id,t.id,'2026-10-01','الملك',1,'الملك',2,'ممتاز','الملك',3,'الملك',4,'إعادة');
  select accepted_faces into value from public.recitation_side_lesson_totals where recitation_id=-920000004 and program='quran';
  if abs(value-(select faces from public.quran_range_metrics('الملك',1,'الملك',2)))>0.00001 then raise exception 'LEGACY_RANGE_TOTAL_WRONG'; end if;
  if not exists(select 1 from public.recitations where id=-920000004 and next_surah='الملك' and side_lesson_faces is null and next2_evaluation='إعادة') then raise exception 'LEGACY_DATA_CHANGED'; end if;
  insert into simple_side_test_results values('historical_ranges_and_separate_evaluations_preserved',true);
  insert into public.recitation_segments(recitation_id,student_id,halaqa_id,teacher_id,segment_type,sequence_no,actual_faces,evaluation,completion_status)
    values(-920000004,-920000001,t.halaqa_id,t.id,'side_lesson',1,3.2,'ممتاز','exact');
  select accepted_faces into value from public.recitation_side_lesson_totals where recitation_id=-920000004 and program='quran';
  if value<>3.2 then raise exception 'LEGACY_SEGMENT_DOUBLE_COUNTED'; end if;
  insert into simple_side_test_results values('legacy_segments_precede_ranges_without_double_count',true);

  insert into public.noorania_recitations(id,student_id,halaqa_id,teacher_id,recitation_date,lesson,side_lesson_faces,side_lesson_lines,side_lesson_evaluation)
    overriding system value values(-920000005,-920000001,t.halaqa_id,t.id,'2026-10-01','',2,4,'ممتاز');
  select accepted_faces into value from public.recitation_side_lesson_totals where recitation_id=-920000005 and program='noorania';
  if value<>2.4 then raise exception 'NOORANIA_LINES_WRONG'; end if;
  insert into simple_side_test_results values('noorania_uses_ten_lines_per_face',true);
  update public.noorania_recitations set side_lesson_evaluation='إعادة' where id=-920000005;
  select accepted_faces into value from public.recitation_side_lesson_totals where recitation_id=-920000005 and program='noorania';
  if value<>0 then raise exception 'NOORANIA_REPEAT_COUNTED'; end if;
  insert into simple_side_test_results values('noorania_repeat_excluded',true);
  perform public.quran_save_learning_policy(-920000001,t.halaqa_id,'{"side_lesson_mode":"memorized_cycle"}',current_date);
  if exists(select 1 from public.quran_student_policies where student_id=-920000001 and active and side_lesson_mode<>'none') then raise exception 'POLICY_REENABLED_SIDE_GENERATION'; end if;
  if has_function_privilege('authenticated','public.quran_generate_side_lesson_v2(bigint,bigint,text,integer,date,text,text,boolean,text,integer)','EXECUTE') then raise exception 'RETIRED_GENERATOR_STILL_CALLABLE'; end if;
  insert into simple_side_test_results values('old_side_policy_and_generator_retired',true);
  execute 'reset role';

  perform set_config('request.jwt.claims',jsonb_build_object('sub',st.auth_user_id,'role','authenticated')::text,true);
  perform set_config('request.jwt.claim.sub',st.auth_user_id::text,true); execute 'set local role authenticated';
  select count(*) into n from public.recitation_side_lesson_totals where student_id=-920000001;
  if n<>0 then raise exception 'OTHER_STUDENT_AMOUNT_LEAK'; end if;
  execute 'reset role';
  insert into simple_side_test_results values('student_cannot_read_other_student_totals',true);
end $tests$;
select count(*) as passed_tests,bool_and(passed) as all_passed,true as fixtures_rolled_back from simple_side_test_results;
rollback;
