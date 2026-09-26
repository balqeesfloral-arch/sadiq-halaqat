-- الصديق — الخطة الشهرية الذكية
-- إضافة اتجاه مستقل للحفظ والمراجعة + تمييز النطاق التلقائي.
-- التغيير إضافي ومحافظ على الخطط القديمة: auto_range=false للصفوف الموجودة.

alter table public.monthly_plans
  add column if not exists memorization_direction text not null default 'forward',
  add column if not exists revision_direction text not null default 'forward',
  add column if not exists memorization_auto_range boolean not null default false,
  add column if not exists revision_auto_range boolean not null default false;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.monthly_plans'::regclass
      and conname = 'monthly_plans_mem_direction_chk'
  ) then
    alter table public.monthly_plans
      add constraint monthly_plans_mem_direction_chk
      check (memorization_direction in ('forward', 'backward'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.monthly_plans'::regclass
      and conname = 'monthly_plans_rev_direction_chk'
  ) then
    alter table public.monthly_plans
      add constraint monthly_plans_rev_direction_chk
      check (revision_direction in ('forward', 'backward'));
  end if;
end
$$;

create or replace function public.quran_apply_monthly_plan_metrics()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_metrics record;
begin
  if new.memorization_from_surah is not null
     and new.memorization_from_ayah is not null
     and new.memorization_to_surah is not null
     and new.memorization_to_ayah is not null then

    if coalesce(new.memorization_direction, 'forward') = 'backward' then
      select * into v_metrics
      from public.quran_range_metrics(
        new.memorization_to_surah,
        new.memorization_to_ayah,
        new.memorization_from_surah,
        new.memorization_from_ayah
      );
    else
      select * into v_metrics
      from public.quran_range_metrics(
        new.memorization_from_surah,
        new.memorization_from_ayah,
        new.memorization_to_surah,
        new.memorization_to_ayah
      );
    end if;

    new.memorization_target_faces := v_metrics.faces;

  elsif new.memorization_from_surah is null
     and new.memorization_from_ayah is null
     and new.memorization_to_surah is null
     and new.memorization_to_ayah is null then
    new.memorization_target_faces := 0;
  end if;

  if new.revision_from_surah is not null
     and new.revision_from_ayah is not null
     and new.revision_to_surah is not null
     and new.revision_to_ayah is not null then

    if coalesce(new.revision_direction, 'forward') = 'backward' then
      select * into v_metrics
      from public.quran_range_metrics(
        new.revision_to_surah,
        new.revision_to_ayah,
        new.revision_from_surah,
        new.revision_from_ayah
      );
    else
      select * into v_metrics
      from public.quran_range_metrics(
        new.revision_from_surah,
        new.revision_from_ayah,
        new.revision_to_surah,
        new.revision_to_ayah
      );
    end if;

    new.revision_target_faces := v_metrics.faces;

  elsif new.revision_from_surah is null
     and new.revision_from_ayah is null
     and new.revision_to_surah is null
     and new.revision_to_ayah is null then
    new.revision_target_faces := 0;
  end if;

  return new;
end;
$function$;

comment on column public.monthly_plans.memorization_direction is
  'forward = ترتيب المصحف من الفاتحة نحو الناس، backward = من الناس نحو الفاتحة';
comment on column public.monthly_plans.revision_direction is
  'forward = ترتيب المصحف من الفاتحة نحو الناس، backward = من الناس نحو الفاتحة';
comment on column public.monthly_plans.memorization_auto_range is
  'إذا كان true يحسب العميل نهاية الحفظ تلقائيًا من البداية والمقدار والجلسات الفعلية';
comment on column public.monthly_plans.revision_auto_range is
  'إذا كان true يحسب العميل نهاية المراجعة تلقائيًا من البداية والمقدار والجلسات الفعلية';
