# Supabase Security Snapshot — 2026-09-26

> فحص قراءة فقط لمشروع الإنتاج. لم يتم تطبيق SQL أو تغيير RLS أو Edge Functions أثناء هذه اللقطة.

## حرِج / أولوية أولى

1. **RLS غير مفعل على جدولين مكشوفين عبر public schema**
   - `public.mosques`
   - `public.halaqat`

   `halaqat` لديه Policy قراءة موجودة لكن RLS نفسه غير مفعل، لذلك الـPolicy لا تحمي الجدول.

2. **SECURITY DEFINER واسع الصلاحيات**
   - إجمالي SECURITY DEFINER functions في `public`: **123**
   - قابل للتنفيذ من `anon`: **84**
   - قابل للتنفيذ من `authenticated`: **113**

   هذا لا يعني أن 84 دالة قابلة للاستغلال حتمًا؛ بعض الدوال تتحقق داخليًا من `auth.uid()` أو الدور، وبعضها عام عمدًا. لكن `EXECUTE` العام يوسّع سطح الهجوم ويجب مراجعته دالة بدالة وسحب الصلاحية الافتراضية من غير المحتاجين.

3. **أربع Views أبلغ عنها Security Advisor بأنها Security Definer**
   - `vw_student_report`
   - `vw_attendance_report`
   - `vw_recitations_report`
   - `vw_monthly_progress_report`

   الخطة: تحويلها إلى `security_invoker = true` إن كان ذلك متوافقًا مع الاستخدام، أو حجبها عن Data API ونقل الوصول إلى RPC محكوم.

## أولوية ثانية

4. Security Advisor أبلغ عن **7 functions** ذات `search_path` غير مثبت بالشكل المطلوب.

5. **Leaked Password Protection** في Supabase Auth غير مفعّل.

6. **26 جدولًا** عليها RLS لكن بدون Policies. هذا غالبًا يعني أنها مغلقة بالكامل أمام Data API، وهو ليس عيبًا أمنيًا بحد ذاته، لكنه يحتاج مراجعة للتأكد أن الإغلاق مقصود وليس كسر وظائف.

## Edge Functions

الموجود حاليًا:
- `register-account` — `verify_jwt=false` (عام عمدًا للتسجيل)
- `student-login` — `verify_jwt=false` (عام عمدًا لدخول الطالب)
- `teacher-create-student` — `verify_jwt=false` لكن الكود يتحقق يدويًا من Bearer token ودور المعلم
- `teacher-delete-student` — `verify_jwt=false` لكن الكود يتحقق يدويًا من Bearer token ودور المعلم

### ملاحظات

- دالتي المعلم يمكن تشديدهما لاحقًا إلى `verify_jwt=true` مع الإبقاء على التحقق الداخلي كطبقة ثانية، بعد اختبار الاستدعاءات الحالية.
- `register-account` يسمح بتسجيل معلم ذاتيًا حسب تصميم المنتج الحالي، ثم يطلب الانضمام لمسجد/حلقة. يجب ضمان أن RLS تمنع المعلم غير المرتبط من قراءة بيانات غيره.
- `student-login` يعتمد حاليًا على **رقم الطالب + الاسم**، ودالة المطابقة تقبل جزءًا من الاسم. هذا سهل الاستخدام لكنه ضعيف كاعتماد أمني إذا تسرب رقم الطالب. الخطة المقترحة: PIN سري للطالب مع rate limiting، مع إبقاء الاسم للعرض وليس كعامل سرّي.

## Owner Vault

لن يتم فرض Passkey على مدير النظام قبل:
1. إصلاح RLS/RPC/Views الحرجة.
2. تفعيل Passkeys في Supabase Auth بدومين production ثابت.
3. تسجيل Passkey أساسي + Passkey احتياطي.
4. إضافة MFA/AAL2 للعمليات الحرجة.
5. اختبار الاستعادة وعدم حدوث lockout.

## قاعدة الاعتماد

لا يكفي منع صفحة React أو إخفاء زر. أي عملية حساسة يجب أن تفشل أيضًا لو نُفذت مباشرة عبر REST/RPC باستخدام جلسة غير مصرح بها.
