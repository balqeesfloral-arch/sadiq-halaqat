-- Normalize Quran surah labels consistently between the UI and Mushaf data.
-- Some Mushaf labels contain Quranic combining marks (for example الرحمٰن)
-- while the UI uses the plain spelling (الرحمن). These must resolve to the
-- same surah number or cyclic review generation can fail.

create or replace function public.quran_normalize_surah_label(p_value text)
returns text
language sql
immutable
set search_path = public
as $function$
  select regexp_replace(
    replace(
      translate(
        translate(
          trim(coalesce(p_value, '')),
          'إأآٱىة',
          'اااايه'
        ),
        'ًٌٍَُِّْٰـ',
        ''
      ),
      'سورة',
      ''
    ),
    '[[:space:]]+',
    '',
    'g'
  );
$function$;

revoke all on function public.quran_normalize_surah_label(text) from public;
grant execute on function public.quran_normalize_surah_label(text) to authenticated;
