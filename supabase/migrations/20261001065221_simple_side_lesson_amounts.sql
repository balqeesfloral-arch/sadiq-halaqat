-- Quantity-only side lessons. Historical ranges remain intact.
alter table public.recitations
  add column side_lesson_faces integer,
  add column side_lesson_lines integer,
  add constraint recitations_simple_side_amount check (
    (side_lesson_faces is null and side_lesson_lines is null) or
    (side_lesson_faces is not null and side_lesson_lines is not null and
      side_lesson_faces between 0 and 10000 and side_lesson_lines between 0 and 14 and
      ((side_lesson_faces*15+side_lesson_lines=0 and next_evaluation is null) or
       (side_lesson_faces*15+side_lesson_lines>0 and next_evaluation is not null and next_evaluation in ('ممتاز','جيد جداً','جيد','إعادة'))))
  );
alter table public.noorania_recitations
  add column side_lesson_faces integer,
  add column side_lesson_lines integer,
  add constraint noorania_simple_side_amount check (
    (side_lesson_faces is null and side_lesson_lines is null) or
    (side_lesson_faces is not null and side_lesson_lines is not null and
      side_lesson_faces between 0 and 10000 and side_lesson_lines between 0 and 9 and
      ((side_lesson_faces*10+side_lesson_lines=0 and side_lesson_evaluation is null) or
       (side_lesson_faces*10+side_lesson_lines>0 and side_lesson_evaluation is not null and side_lesson_evaluation in ('ممتاز','جيد جداً','جيد','إعادة'))))
  );

create or replace function private.sync_simple_side_lesson_segment()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  if new.side_lesson_faces is null then return new; end if;
  delete from public.recitation_segments where recitation_id=new.id and segment_type='side_lesson';
  if new.side_lesson_faces*15+new.side_lesson_lines>0 then
    insert into public.recitation_segments(recitation_id,student_id,halaqa_id,teacher_id,segment_type,
      sequence_no,actual_quran_lines,actual_faces,evaluation,completion_status)
    values(new.id,new.student_id,new.halaqa_id,new.teacher_id,'side_lesson',1,
      new.side_lesson_faces*15+new.side_lesson_lines,new.side_lesson_faces+new.side_lesson_lines/15.0,
      new.next_evaluation,case when new.next_evaluation='إعادة' then 'repeat' else 'exact' end);
  end if;
  return new;
end $$;
revoke all on function private.sync_simple_side_lesson_segment() from public,anon,authenticated;
create trigger recitations_simple_side_segment after insert or update on public.recitations
for each row execute function private.sync_simple_side_lesson_segment();

-- Read legacy measurements without rewriting their records or evaluations.
create or replace function private.legacy_side_lesson_faces(
  p_from_surah text,p_from_ayah integer,p_to_surah text,p_to_ayah integer,p_lines_per_face integer default 15)
returns numeric language plpgsql stable set search_path='' as $$
declare v_faces numeric; v_text text; v_match text[]; v_word record;
begin
  if p_from_surah is null then return 0; end if;
  if p_from_ayah is not null and p_to_ayah is not null then
    begin
      select faces into v_faces from public.quran_range_metrics(p_from_surah,p_from_ayah,coalesce(p_to_surah,p_from_surah),p_to_ayah);
      return coalesce(v_faces,0);
    exception when raise_exception then
      if sqlerrm='QURAN_RANGE_REVERSED' then
        select faces into v_faces from public.quran_range_metrics(coalesce(p_to_surah,p_from_surah),p_to_ayah,p_from_surah,p_from_ayah);
        return coalesce(v_faces,0);
      end if;
      if sqlerrm not like 'QURAN_RANGE_%' then raise; end if;
    end;
  end if;
  v_text:=trim(translate(p_from_surah,'٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹ةأإآ','01234567890123456789هااا'));
  if v_text ~ '^[0-9]+([.][0-9]+)?$' then return v_text::numeric; end if;
  v_match:=regexp_match(v_text,'([0-9]+([.][0-9]+)?)');
  if v_match is not null and v_text ~ '(وجه|أوجه|اوجه|صفحة|صفحه|صفحات)' then return v_match[1]::numeric; end if;
  if v_match is not null and v_text ~ '(سطر|أسطر|اسطر)' then return v_match[1]::numeric/nullif(p_lines_per_face,0); end if;
  if v_text ~ '(نصف.*(وجه|صفحة|صفحه))' then return 0.5; end if;
  if v_text ~ '(ربع.*(وجه|صفحة|صفحه))' then return 0.25; end if;
  if v_text ~ '(ثلاثه ارباع.*(وجه|صفحه))' then return 0.75; end if;
  if v_text ~ '(وجهان|وجهين|صفحتان|صفحتين)' then
    return case when v_text like '%ونصف%' then 2.5 else 2 end;
  end if;
  if v_text ~ '(وجه|صفحه).*ونصف' then return 1.5; end if;
  for v_word in select * from (values ('عشره',10),('تسعه',9),('ثمانيه',8),('سبعه',7),
      ('سته',6),('خمسه',5),('اربعه',4),('ثلاثه',3),('اثنان',2),('اثنين',2),('اثنتان',2),
      ('اثنتين',2),('واحد',1)) as words(word,amount)
  loop
    if position(v_word.word in v_text)>0 and v_text ~ '(وجه|اوجه|صفحه|صفحات)' then return v_word.amount; end if;
  end loop;
  if v_text in ('وجه','صفحه') then return 1; end if;
  if v_text in ('سطران','سطرين') then return 2.0/nullif(p_lines_per_face,0); end if;
  if v_text='سطر' then return 1.0/nullif(p_lines_per_face,0); end if;
  return 0;
end $$;
revoke all on function private.legacy_side_lesson_faces(text,integer,text,integer,integer) from public,anon;
grant execute on function private.legacy_side_lesson_faces(text,integer,text,integer,integer) to authenticated,service_role;

create view public.recitation_side_lesson_totals with(security_invoker=true) as
select 'quran'::text as program,r.id as recitation_id,r.student_id,r.halaqa_id,r.recitation_date,
  case when r.side_lesson_faces is not null then r.side_lesson_faces+r.side_lesson_lines/15.0
    when s.segment_count>0 then s.raw_faces else legacy.first_faces+legacy.second_faces end as raw_faces,
  case when r.side_lesson_faces is not null then
    case when r.next_evaluation='إعادة' then 0 else r.side_lesson_faces+r.side_lesson_lines/15.0 end
    when s.segment_count>0 then s.accepted_faces
    else (case when coalesce(r.next_evaluation,'') in ('إعادة','اعادة','repeat') then 0 else legacy.first_faces end)
      +(case when coalesce(r.next2_evaluation,'') in ('إعادة','اعادة','repeat') then 0 else legacy.second_faces end)
    end as accepted_faces
from public.recitations r
left join lateral (
  select count(*) as segment_count,coalesce(sum(coalesce(actual_faces,actual_quran_lines/15.0,0)),0) as raw_faces,
    coalesce(sum(coalesce(actual_faces,actual_quran_lines/15.0,0)) filter(
      where completion_status not in ('repeat','skipped') and coalesce(evaluation,'') not in ('إعادة','اعادة','repeat')),0) as accepted_faces
  from public.recitation_segments where recitation_id=r.id and segment_type='side_lesson'
) s on true
left join lateral (
  select case when r.side_lesson_faces is null and s.segment_count=0
      then private.legacy_side_lesson_faces(r.next_surah,r.next_from_ayah,r.next_to_surah,r.next_to_ayah) else 0 end as first_faces,
    case when r.side_lesson_faces is null and s.segment_count=0
      then private.legacy_side_lesson_faces(r.next2_surah,r.next2_from_ayah,r.next2_to_surah,r.next2_to_ayah) else 0 end as second_faces
) legacy on true
union all
select 'noorania'::text,r.id,r.student_id,r.halaqa_id,r.recitation_date,
  amount.faces as raw_faces,
  case when coalesce(r.side_lesson_evaluation,'') in ('إعادة','اعادة','repeat') then 0 else amount.faces end as accepted_faces
from public.noorania_recitations r
cross join lateral(select case when r.side_lesson_faces is not null then r.side_lesson_faces+r.side_lesson_lines/10.0
  else private.legacy_side_lesson_faces(r.side_lesson,null,null,null,10) end as faces) amount;
revoke all on public.recitation_side_lesson_totals from public,anon;
grant select on public.recitation_side_lesson_totals to authenticated,service_role;

-- Retain history while retiring unperformed generated side lessons.
CREATE OR REPLACE FUNCTION public.quran_save_learning_policy(p_student_id bigint, p_halaqa_id bigint, p_patch jsonb, p_effective_from date DEFAULT CURRENT_DATE)
 RETURNS bigint
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
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
  v_new.side_lesson_mode := 'none';
  v_new.side_lesson_amount := null;
  v_new.side_lesson_unit := null;
  v_new.side_lesson_switch_percent := coalesce(v_new.side_lesson_switch_percent,50);
  v_new.side_lesson_when_paused := 'none';
  v_new.boundary_suggestion_mode := coalesce(v_new.boundary_suggestion_mode,'ayah_and_surah');
  v_new.revision_scope_mode := coalesce(v_new.revision_scope_mode,'lesson_derived');
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
end $function$;

update public.quran_assignments set status='superseded',updated_at=now()
where segment_type='side_lesson' and status='planned';

-- Retired generators are kept for migration/history compatibility only.
revoke execute on function public.quran_generate_side_lesson_from_policy(bigint,bigint,text,integer,date)
  from public,anon,authenticated;
revoke execute on function public.quran_generate_side_lesson_legacy_v2(bigint,bigint,text,integer,date,text,text)
  from public,anon,authenticated;
revoke execute on function public.quran_generate_side_lesson_v2(bigint,bigint,text,integer,date,text,text,boolean,text,integer)
  from public,anon,authenticated;
