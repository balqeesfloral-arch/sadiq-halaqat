# Security baseline — الصِّديق

هذه الوثيقة تخص طبقة تطبيق React/Vite فقط. صلاحيات البيانات النهائية يجب أن تظل مفروضة من قاعدة البيانات وRLS/RPC في Supabase، وليس من الواجهة وحدها.

## قواعد ثابتة

- لا يُحفظ أي Password أو Student Number المستخدم كبيانات دخول داخل `localStorage` أو `sessionStorage`.
- الواجهة تستخدم عميل Supabase واحد فقط: `src/lib/supabase.js`.
- لا يُسمح مطلقًا بوضع `service_role` أو `sb_secret_*` أو مفاتيح خادم داخل `src` أو `public`.
- `.env` محلي وموجود في `.gitignore`، ولا يدخل ملفات التسليم أو Git.
- ملفات Production source maps معطلة صراحة في `vite.config.js`.
- المسارات الداخلية تتحقق من Session + Role + Active Status قبل عرض البوابة.
- `X-Frame-Options` و`frame-ancestors` يمنعان clickjacking.
- CSP تقيد السكربتات والاتصالات والمصادر إلى ما يحتاجه التطبيق الحالي.

## قبل كل نشر

```bash
npm ci
npm run security:sentinel
npm run security:scan
npm run lint
npm run build
npm run security:csp
npm run security:dist
npm audit --omit=dev
```

لا تستخدم `npm audit fix --force` بدون مراجعة فرق الإصدارات واختبار Regression كامل.

## ملاحظة SheetJS / xlsx

المشروع يستخدم `xlsx` حاليًا للتصدير فقط (`write` / `writeFile`) وليس لقراءة ملفات Excel يرفعها المستخدم. يبقى استبدال الحزمة أو ترقيتها قرار صيانة مستقل حتى لا تتغير وظيفة التصدير بلا اختبار.

## طبقة Supabase

التدقيق الحي مستمر ولا يُعتبر منتهيًا بمجرد نجاح build. آخر snapshot موثق في `docs/security/SUPABASE_LIVE_AUDIT_2026-09-29.md`.

الأولوية الحالية: مراجعة RPC/SECURITY DEFINER حسب الدور، واختبارات IDOR/BOLA، وrate limiting لدخول الطالب والمسارات العامة، مع عدم تغيير الصلاحيات جماعيًا دون Regression tests.
