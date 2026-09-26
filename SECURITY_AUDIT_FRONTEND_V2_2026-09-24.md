# الصِّدّيق — Frontend Security Hardening v2

التاريخ: 2026-09-24

## قاعدة التنفيذ

هذه الجولة Frontend فقط. لم يتم تعديل Supabase أو RLS أو SQL أو Edge Functions أو بيانات الإنتاج.
تمت المحافظة على منطق الحضور والتسميع والخطط والإنجاز والاختبارات والنقاط والتقارير.

## نتيجة الفحص التي شغّلها المستخدم قبل v2

- `npm ci`: نجح.
- `npm run security:scan`: نجح.
- `npm run security:check`: وصل إلى lint/build بنجاح.
- Oxlint: 1270 تحذير و0 أخطاء.
- Vite production build: نجح، 3095 modules transformed، built in 6.17s.
- `npm audit --omit=dev`: High واحدة مرتبطة بالحزمة `xlsx@0.18.5`.

## تعديلات v2 الآمنة

### 1. تشديد تسجيل الدخول

في `src/pages/Login.jsx`:

- أصبح `loadProfile` يجلب `is_active` أيضًا.
- الحساب لا يكمل تسجيل الدخول إذا كان `status !== active` أو `is_active === false`.
- الموظف لا يكمل إذا كان دوره خارج القائمة الصريحة: `admin / supervisor / teacher`.
- لم تتغير طريقة التحقق من كلمة المرور أو دخول الطالب.
- لا يتم حفظ كلمة المرور أو رقم الطالب في `localStorage`.

### 2. عزل نوافذ الطباعة

تم فصل `window.opener` في نوافذ الطباعة دون تغيير HTML أو التصميم أو البيانات في:

- `src/pages/MonthlyAchievement.jsx`
- `src/pages/teacher/MonthlyAchievement.jsx`
- `src/pages/reports/ReportsCenter.jsx`

### 3. فحص أمني قبل البناء

تم تقوية `scripts/security-scan.mjs` ليمنع مستقبلاً:

- `dangerouslySetInnerHTML`
- direct `innerHTML =`
- `eval()`
- `new Function()`
- مفاتيح وأسرار معروفة
- Supabase client إضافي خارج العميل المركزي
- ملفات تطوير/نسخ احتياطية حساسة داخل `public/` مثل `.env`, `.sql`, `.map`, `.pem`, `.key`, `.zip` وغيرها.

الفحص بعد التعديل: PASS.

### 4. فحص أمني بعد Production Build

تمت إضافة:

`npm run security:dist`

والآن:

`npm run security:check`

ينفذ بالترتيب:

1. source security scan
2. lint
3. production build
4. dist security scan

فحص `dist` يمنع نشر source maps أو ملفات حساسة أو أسرار خادم مع ملفات الإنتاج.

### 5. منع فهرسة وتخزين البوابات الخاصة

تمت إضافة رؤوس `X-Robots-Tag: noindex, nofollow, noarchive` و`Cache-Control: no-store` لمسارات:

- `/admin`
- `/teacher`
- `/student`
- `/system-admin`
- `/supervisor`
- `/login`
- `/register`

الصفحة العامة `/` لم تتغير وتبقى قابلة للفهرسة والانتشار.

## ما تمت مراجعته ولم نغيره عمدًا

- تحذيرات React Hooks و`set-state-in-effect`: لم يتم تعديلها آليًا لأنها قد تغير توقيت تحميل البيانات أو تسبب إعادة طلبات/loops.
- أخطاء console: لم يتم حذفها جماعيًا لأن ذلك قد يخفي أخطاء تشغيل مهمة أثناء مرحلة الاختبار؛ لا توجد أسرار مثبتة داخلها حسب الفحص الحالي.
- CSP بقي متوافقًا مع JSON-LD والطباعة الحالية ولم يتم تشديده بطريقة قد تكسر التقارير.
- `localStorage` الآخر المستخدم في المشروع مخصص لتفضيلات الواجهة، آخر حلقة، التبويب، وحالة القائمة؛ لم نجد فيه كلمة مرور أو رقم طالب محفوظًا بواسطة كود v2.

## الاعتماد المتبقي قبل إغلاق Frontend أمنيًا

### xlsx@0.18.5 — HIGH

`npm audit` يعرض:

- Prototype Pollution
- ReDoS

المشروع الحالي يستخدم `xlsx` للتصدير/الكتابة فقط في ثلاث مناطق، ولا توجد قراءة ملف Excel مرفوع في كود المصدر الذي تمت مراجعته. مع ذلك، سنزيل التحذير قبل اعتماد النسخة النهائية العامة.

الخطوة التالية المقترحة، في نسخة منفصلة وبعد نجاح v2:

- ترقية SheetJS إلى 0.20.3 من المصدر الرسمي الخاص بالمشروع، مع اختبار Excel في الصفحات الثلاث؛ أو
- استبداله بمكتبة أخرى إذا ظهرت مشكلة توافق.

لن يتم تطبيق تغيير الحزمة عشوائيًا أو باستخدام `npm audit fix --force`.

## أوامر التحقق من v2

```bash
npm ci
npm run security:scan
npm run security:check
npm run audit:prod
```

## حالة Supabase

لم يتم الدخول في جولة Supabase في هذه النسخة.
