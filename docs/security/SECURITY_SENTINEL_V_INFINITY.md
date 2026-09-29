# Sadiq Security Sentinel V∞

هذه النسخة هي مركز الفحص الأمني الآلي لمشروع **الصديق**.

## ماذا يفحص؟

- أسرار ومفاتيح حساسة داخل المستودع.
- أنماط XSS وتنفيذ الكود الديناميكي الخطرة.
- استخدامات Supabase الحساسة داخل الواجهة.
- إعدادات CSP وHSTS وHeaders في Vercel.
- Production source maps والملفات الحساسة المنشورة.
- Service Worker / PWA caching.
- migrations التي تستخدم SECURITY DEFINER أو صلاحيات anon.
- مكتبات npm المعروفة بالثغرات.
- lint + production build + فحص dist.
- الموقع الحي على `https://sadiqh.vercel.app`.
- Semgrep SAST عميق بإصدار مثبت.
- CodeQL لتحليل JavaScript/TypeScript بقواعد `security-extended` و`security-and-quality`.
- Trivy لفحص المكتبات والأسرار وسوء الإعدادات، مع SARIF عند توفر GitHub Code Scanning.
- OWASP ZAP Baseline آمن ومجدول.
- Supabase DB lint بشكل اختياري عند إضافة أسرار GitHub Actions المخصصة.
- بوابة إصدار تمنع Critical من Sentinel، مع إبقاء التحذيرات القابلة للمراجعة كتقارير بدل كسر الإنتاج عشوائيًا.

## التشغيل

### محليًا

```bash
npm run security:sentinel
npm run security:live
npm run security:infinity
```

التقارير تظهر داخل:

```text
security-artifacts/
```

### GitHub Actions

Workflow:

```text
.github/workflows/security-sentinel-v-infinity.yml
```

يعمل تلقائيًا عند:
- Push إلى `main`
- Pull Request إلى `main`
- فحص أسبوعي
- تشغيل يدوي

## درجات الخطورة

- 🔴 Critical: سر مكشوف أو مسار يمكن أن يقود مباشرة لتجاوز أمني كبير.
- 🟠 High: خلل يحتاج أولوية عالية.
- 🟡 Medium: hardening مهم أو سطح هجوم يمكن تقليله.
- 🔵 Low: تحسين دفاعي أو خصوصية.

## Supabase Live Lint

لتمكين الفحص الحي من GitHub بدون وضع أي سر في الكود، أضف هذه القيم إلى GitHub Actions Secrets فقط:

- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_DB_PASSWORD`
- `SUPABASE_PROJECT_REF`

إذا لم تكن موجودة، يتخطى Workflow هذه الخطوة بأمان ولا يفشل.

> لا تضع service-role key أو DB password أو VAPID private key داخل ملفات المشروع.

## فلسفة الإصلاح

Sentinel لا يطبّق تغييرات أمنية حساسة على قاعدة البيانات تلقائيًا.  
أي مشكلة في RLS / RPC / SECURITY DEFINER / Auth يجب:
1. توثيقها.
2. تحديد المستخدم المتأثر والدور.
3. إصلاحها في migration واضحة.
4. اختبار أن الوظيفة المسموحة ما زالت تعمل.
5. اختبار أن المستخدم غير المصرح له يحصل على رفض.

## ملاحظات مهمة

- فحص ZAP المستخدم هنا **Baseline** وغير تدميري.
- لا يوجد ماسح واحد يستطيع إثبات أن النظام خالٍ 100% من الثغرات.
- أمان مشروع الصديق يعتمد على طبقات: الواجهة + Supabase RLS + RPC + Edge Functions + Vercel + إدارة الأسرار.


## حماية سلسلة التوريد والإصدار

- GitHub Actions الأساسية مثبتة على **commit SHA** بدل tags متحركة.
- Supabase CLI في Workflow مثبت على إصدار محدد بدل `latest`.
- Dependabot يستخدم cooldown لتقليل التقاط إصدارات حديثة جدًا قبل أن تأخذ وقتًا كافيًا للمراجعة.
- Android release لا يولد مفتاح توقيع جديدًا؛ البناء يرفض أي keystore لا يطابق بصمة شهادة الصديق المعتمدة.
- ملفات signing key وكلمات المرور **لا تدخل Artifacts**.
- Workflows القديمة والتجريبية حُذفت بعد اعتماد المسارات النهائية لتقليل سطح الصيانة والهجوم.

## التقارير الحية

آخر جولة إنتاج موثقة:
`docs/security/SUPABASE_LIVE_AUDIT_2026-09-29.md`

قائمة ما قبل الإصدار:
`docs/security/RELEASE_SECURITY_CHECKLIST.md`
