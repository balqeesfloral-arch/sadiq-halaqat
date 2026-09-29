# Supabase Live Security Audit — 2026-09-29

> مشروع الإنتاج: `Noor-halaqat` (`mdkhklotknuseilyrvqe`).  
> هذا الفحص كان قراءةً فقط؛ لم يغيّر بيانات الإنتاج أو الصلاحيات.

## الملخص التنفيذي

- **0 جدول public بدون RLS**: جميع الجداول الأساسية المكشوفة عبر `public` أصبحت محمية بـ RLS على مستوى الجدول.
- **24 جدولًا** عليها RLS لكن بلا Policies. هذا يعني أن Data API يغلقها افتراضيًا أمام الأدوار العادية، ويجب مراجعة كون هذا الإغلاق مقصودًا عند الحاجة الوظيفية.
- يوجد **132 دالة SECURITY DEFINER** في `public`.
  - 6 قابلة للاستدعاء من `anon`.
  - 108 قابلة للاستدعاء من `authenticated`.
  - **0 SECURITY DEFINER بدون search_path مثبت** وفق الفحص الحالي.
- Supabase Advisor ما زال يبلغ عن **Leaked Password Protection** غير مفعّلة.
- `pg_net` موجود داخل schema `public` ويظهر كتحذير Hardening من Security Advisor.

## دوال anon التي راجعناها

الدوال الست التالية عامة حاليًا، وكلها تحتوي `search_path` مثبتًا:

1. `get_public_mosque_directory()` — دليل المساجد العام.
2. `get_public_mosque_insights(bigint)` — مؤشرات عامة مجمعة.
3. `get_public_mosque_stats(bigint)` — إحصاءات عامة مجمعة.
4. `get_public_mosques()` — أسماء المساجد العامة.
5. `get_push_public_key()` — يعيد **VAPID public key فقط** وهو عام بطبيعته.
6. `submit_public_support_request(...)` — نموذج تواصل عام مع تحقق من المدخلات وRate Limit حالي يعتمد رقم واتساب خلال 90 ثانية.

وجود هذه الدوال ضمن `anon` ليس سببًا كافيًا وحده لسحب الصلاحية؛ بعضها يخدم الصفحة العامة عمدًا. أي تغيير على EXECUTE يجب أن يسبقه اختبار للصفحة العامة والإشعارات ونموذج التواصل.

## Edge Functions الحالية

- `register-account` — `verify_jwt=false` لأن التسجيل العام يحتاج الوصول قبل إنشاء جلسة.
- `student-login` — `verify_jwt=false` لأنه مسار دخول مخصص.
- `teacher-create-student` — `verify_jwt=true`.
- `teacher-delete-student` — `verify_jwt=true`.
- `push-notify` — `verify_jwt=false` (نسخة قديمة يجب إبقاؤها تحت المراجعة إلى أن نتأكد من عدم وجود مستهلكين لها).
- `push-notify-v2` — `verify_jwt=false` عمدًا لأن خط Web Push يعتمد مصادقة webhook/server secret داخل الدالة.

## الأولويات التالية

### أولوية عالية

- مراجعة الـ **108 SECURITY DEFINER** القابلة لـ `authenticated` حسب الدور الفعلي، خصوصًا الدوال التي تبدأ بـ `admin_`, `system_admin_`, `supervisor_`, `teacher_`.
- الاختبار المطلوب ليس مجرد وجود شرط داخل الواجهة؛ يجب أن تفشل الدالة نفسها عند استدعائها بجلسة ذات دور غير مصرح.
- مراجعة `student-login` ضد brute force / enumeration مع إبقاء سهولة دخول الطالب.

### Hardening

- تفعيل **Leaked Password Protection** من إعدادات Supabase Auth بعد التأكد من سياسة كلمات المرور الحالية.
- تقييم نقل `pg_net` خارج `public` وفق إرشادات Supabase، بعد التأكد من عدم كسر خط Web Push.
- مراجعة الجداول الـ24 المغلقة بـRLS دون Policies وتوثيق أيها مغلق عمدًا وأيها يحتاج Policy وظيفية.

## قاعدة العمل

لا تُصلَح تحذيرات RLS/RPC جماعيًا أو آليًا. كل تعديل أمني في قاعدة البيانات يجب أن يمر بالترتيب:

1. تحديد الوظيفة والدور المسموح.
2. كتابة migration محدودة النطاق.
3. اختبار حالة السماح.
4. اختبار حالة الرفض المباشر عبر RPC/REST.
5. إعادة تشغيل Supabase Security Advisor بعد التغيير.

## روابط المعالجة الرسمية

- RLS enabled with no policy: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy
- Extension in public schema: https://supabase.com/docs/guides/database/database-linter?lint=0014_extension_in_public
- Anonymous SECURITY DEFINER execution: https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable
- Authenticated SECURITY DEFINER execution: https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable
- Leaked password protection: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection
