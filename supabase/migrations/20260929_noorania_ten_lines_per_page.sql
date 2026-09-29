-- الصديق — منطق مقدار القاعدة النورانية
-- 10 أسطر = صفحة واحدة.
-- نحفظ الإدخال الخام (مقدار + وحدة) ونستمر في حفظ lesson_faces/revision_faces
-- كقيمة صفحات موحدة حتى تبقى التقارير الحالية متوافقة.

alter table public.noorania_recitations
  add column if not exists lesson_amount_value numeric,
  add column if not exists lesson_amount_unit text,
  add column if not exists revision_amount_value numeric,
  add column if not exists revision_amount_unit text;

update public.noorania_recitations
set
  lesson_amount_value = coalesce(lesson_amount_value, lesson_faces),
  lesson_amount_unit = coalesce(lesson_amount_unit, 'faces'),
  revision_amount_value = coalesce(revision_amount_value, revision_faces),
  revision_amount_unit = case
    when revision_faces is null then revision_amount_unit
    else coalesce(revision_amount_unit, 'faces')
  end
where
  lesson_amount_value is null
  or lesson_amount_unit is null
  or (revision_faces is not null and (revision_amount_value is null or revision_amount_unit is null));

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid='public.noorania_recitations'::regclass
      and conname='noorania_recitations_lesson_amount_unit_check'
  ) then
    alter table public.noorania_recitations
      add constraint noorania_recitations_lesson_amount_unit_check
      check (lesson_amount_unit is null or lesson_amount_unit in ('lines','faces'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid='public.noorania_recitations'::regclass
      and conname='noorania_recitations_revision_amount_unit_check'
  ) then
    alter table public.noorania_recitations
      add constraint noorania_recitations_revision_amount_unit_check
      check (revision_amount_unit is null or revision_amount_unit in ('lines','faces'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid='public.noorania_recitations'::regclass
      and conname='noorania_recitations_lesson_amount_value_check'
  ) then
    alter table public.noorania_recitations
      add constraint noorania_recitations_lesson_amount_value_check
      check (lesson_amount_value is null or lesson_amount_value >= 0);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid='public.noorania_recitations'::regclass
      and conname='noorania_recitations_revision_amount_value_check'
  ) then
    alter table public.noorania_recitations
      add constraint noorania_recitations_revision_amount_value_check
      check (revision_amount_value is null or revision_amount_value >= 0);
  end if;
end $$;

comment on column public.noorania_recitations.lesson_amount_value is
  'المقدار الخام الذي أدخله المعلم في تسميع القاعدة';
comment on column public.noorania_recitations.lesson_amount_unit is
  'lines أو faces؛ في القاعدة 10 أسطر = صفحة واحدة';
comment on column public.noorania_recitations.revision_amount_value is
  'مقدار المراجعة الخام في القاعدة';
comment on column public.noorania_recitations.revision_amount_unit is
  'lines أو faces؛ في القاعدة 10 أسطر = صفحة واحدة';
