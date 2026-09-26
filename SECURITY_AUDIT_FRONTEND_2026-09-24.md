# مشروع الصديق — Frontend Security Hardening

التاريخ: 2026-09-24

هذه الجولة تخص React/Vite/Vercel فقط. لم يتم تعديل Supabase schema أو RLS أو RPC أو Edge Functions.

## إصلاحات أمنية منفذة

1. **إيقاف حفظ بيانات الدخول الحساسة في localStorage**
   - لم يعد يتم حفظ Password للموظفين.
   - لم يعد يتم حفظ Student Number المستخدم كبيانات دخول.
   - عند فتح النسخة الجديدة يتم تنظيف سجلات `sadiq_remember_login` و`sadiq_quick_accounts` القديمة تلقائيًا من هذه الحقول.
   - الوصول السريع أصبح يملأ هوية الحساب فقط، ثم يطلب السر/رقم الطالب من المستخدم.

2. **إزالة إعداد Supabase المكرر من `src/reports/reportCalculations.js`**
   - الملف يعيد استخدام `src/lib/supabase.js` فقط.
   - لا توجد مفاتيح Supabase hard-coded داخل `src` بعد الفحص.

3. **تقوية حراسة البوابات**
   - Admin/Supervisor: role صحيح + status=active + is_active ليس false.
   - Teacher: role=teacher + active قبل إظهار البوابة.
   - Student: role=student + active قبل إظهار البوابة.
   - System Admin: admin نشط فقط.
   - Supervisor Setup: supervisor نشط فقط.
   - Student Onboarding: student نشط فقط.
   - بوابة المعلم لا تعرض Child Routes قبل التحقق الأولي من الحساب.

4. **إزالة Hook اختبار إنتاجي خطير**
   - حذف زر ودالة `testActivateSubscription` من `SystemAdmin.jsx`.
   - كانت الدالة تستهدف Mosque ID=5 وتنفذ `admin_activate_subscription` كاختبار End-to-End.
   - لم يتم لمس وظائف الاشتراكات العامة الأخرى.

5. **Security Headers على Vercel**
   - Content-Security-Policy
   - X-Content-Type-Options
   - X-Frame-Options
   - frame-ancestors ضمن CSP
   - Referrer-Policy
   - Permissions-Policy
   - Strict-Transport-Security
   - Cross-Origin-Opener-Policy
   - X-Permitted-Cross-Domain-Policies
   - Origin-Agent-Cluster

6. **تعطيل Production Source Maps صراحة**
   - `vite.config.js -> build.sourcemap = false`.

7. **منع فهرسة المسارات الداخلية**
   - `robots.txt` يمنع: `/admin`, `/teacher`, `/student`, `/system-admin`, `/supervisor`, `/login`, `/register`.
   - الصفحة العامة `/` بقيت متاحة للفهرسة.

8. **حارس أسرار دائم قبل النشر**
   - أضيف `scripts/security-scan.mjs`.
   - يفشل عند وجود service-role/secret/private key/hard-coded publishable key داخل `src` أو `public`.
   - يفشل عند إنشاء Supabase client ثانٍ خارج `src/lib/supabase.js`.
   - الأمر: `npm run security:scan`.

9. **Git hygiene**
   - إضافة امتدادات مفاتيح وشهادات حساسة إلى `.gitignore`.
   - `.env` يبقى محليًا فقط، و`.env.example` فقط يدخل التسليم.

## فحوصات تمت بعد التعديل

- فحص Syntax لكل ملفات JS/JSX: **191 ملف — 0 أخطاء Syntax**.
- Secret scan: **Pass**.
- JSON validation لـ `vercel.json`: **Pass**.
- لا يوجد `service_role`, `sb_secret_*`, Private Key أو hard-coded Supabase publishable key داخل `src/public`.
- لا يوجد `dangerouslySetInnerHTML` في المشروع.
- نوافذ WhatsApp الخارجية تستخدم `noopener,noreferrer`.
- نوافذ الطباعة التي تستخدم `document.write` تم فحصها: بيانات الإنجاز تستخدم `escapeHtml`، وتقرير المركز ينسخ DOM أنتجه React (React يقوم بescaping للنصوص).

## ما لم يتم تغييره عمدًا

- Supabase / RLS / RPC / Edge Functions: مؤجل للجولة التالية بعد إقفال Frontend.
- `xlsx@0.18.5`: توجد Advisory عالية معروفة في مسارات قراءة ملفات Excel crafted. المشروع الحالي يستخدم المكتبة للتصدير فقط (`write`, `writeFile`) ولا يستخدم `XLSX.read()` لملفات يرفعها المستخدم. لم يتم استبدال المكتبة الآن حتى لا نخاطر بتغيير Excel Export بدون Regression test.
- تحذيرات React hooks / set-state-in-effect لم تُعدّل عشوائيًا لأن بعضها سلوك مقصود وقد يتغير عمل الصفحات عند "تنظيفه" آليًا.

## اختبار مطلوب على جهاز Windows قبل اعتماد النسخة

بعد فك النسخة وإرجاع `.env` المحلي:

```bash
npm ci
npm run security:scan
npm run security:check
npm run audit:prod
```

بعدها اختبار يدوي سريع:

- تسجيل دخول Admin/Supervisor/Teacher/Student.
- فتح `/admin`, `/teacher`, `/student`, `/system-admin`, `/supervisor/setup`, `/student/onboarding` بدور خاطئ ومن دون Session.
- اختبار طباعة تقرير + Excel Export + WhatsApp.
- اختبار أن الوصول السريع يتذكر البريد/الاسم فقط، ولا يدخل بدون كلمة المرور/رقم الطالب.

## المرحلة التالية بعد نجاح الاختبار

Supabase Security Audit شامل: RLS، IDOR/BOLA، EXECUTE grants، SECURITY DEFINER/INVOKER، Storage، Edge Functions، Student Login rate limiting، تعطيل الحسابات، وسياسات كل Role.
