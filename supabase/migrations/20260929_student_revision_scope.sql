-- الصديق — نطاق المحفوظ الفردي لدورة المراجعة
-- لكل طالب إعداد مستقل يحدد حدود محفوظِه للمراجعة.
-- الوضع الافتراضي lesson_derived يحافظ على السلوك القديم للطلاب الحاليين.
-- الوضع manual يجعل دورة المراجعة تدور فقط داخل النطاق الذي يعتمده المعلم.

alter table public.quran_student_policies
  add column if not exists revision_scope_mode text not null default 'lesson_derived',
  add column if not exists revision_scope_start_surah text,
  add column if not exists revision_scope_start_ayah integer,
  add column if not exists revision_scope_end_surah text,
  add column if not exists revision_scope_end_ayah integer,
  add column if not exists revision_scope_updated_at timestamp with time zone;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.quran_student_policies'::regclass
      and conname = 'quran_student_policies_revision_scope_mode_check'
  ) then
    alter table public.quran_student_policies
      add constraint quran_student_policies_revision_scope_mode_check
      check (revision_scope_mode in ('lesson_derived', 'manual'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.quran_student_policies'::regclass
      and conname = 'quran_student_policies_revision_scope_start_ayah_check'
  ) then
    alter table public.quran_student_policies
      add constraint quran_student_policies_revision_scope_start_ayah_check
      check (revision_scope_start_ayah is null or revision_scope_start_ayah > 0);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.quran_student_policies'::regclass
      and conname = 'quran_student_policies_revision_scope_end_ayah_check'
  ) then
    alter table public.quran_student_policies
      add constraint quran_student_policies_revision_scope_end_ayah_check
      check (revision_scope_end_ayah is null or revision_scope_end_ayah > 0);
  end if;
end
$$;

comment on column public.quran_student_policies.revision_scope_mode is
  'lesson_derived = السلوك القديم المشتق من موضع الحفظ، manual = نطاق محفوظ فردي يحدده المعلم';

comment on column public.quran_student_policies.revision_scope_start_surah is
  'بداية دورة المراجعة الفردية حسب اتجاه المراجعة';
comment on column public.quran_student_policies.revision_scope_start_ayah is
  'آية بداية دورة المراجعة الفردية';
comment on column public.quran_student_policies.revision_scope_end_surah is
  'نهاية دورة المراجعة الفردية حسب اتجاه المراجعة';
comment on column public.quran_student_policies.revision_scope_end_ayah is
  'آية نهاية دورة المراجعة الفردية';
comment on column public.quran_student_policies.revision_scope_updated_at is
  'آخر وقت اعتمد فيه المعلم حدود محفوظ الطالب';
