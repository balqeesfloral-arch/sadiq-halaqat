# Frontend Security Hardening v2.1

- ترقية تعريف SheetJS إلى tarball الرسمي `xlsx-0.20.3`.
- حذف `.env` من نسخة المصدر وإضافة `.env.example` آمن.
- منع تتبع `.env` وفحص الأسرار المحلية.
- حذف أرشيفات ZIP القديمة من `src/`.
- حذف النسخة القديمة `MonthlyAchievemen.jsx` والإبقاء على الملف الصحيح فقط.
- نقل ملفات التعليمات من `public/` إلى `docs/legacy-branding/`.
- تقوية `security-scan.mjs` لفحص نظافة المستودع ومنع رجوع SheetJS القديم.
- تفعيل واجهة Passkey وإضافة Owner Vault Foundation بدون فرضها على الإنتاج.

> ملاحظة: لم يتم تعديل قاعدة البيانات أو RLS في هذه النسخة المحلية. جولة Supabase التالية مطلوبة قبل وصف النظام بأنه مغلق أمنيًا.
