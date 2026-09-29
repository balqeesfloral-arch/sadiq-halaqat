# Sadiq V∞ — Release Security Checklist

هذه القائمة قصيرة عمدًا. الهدف أن كل إصدار يمر عبر بوابات آلية واضحة بدل الاعتماد على التذكر اليدوي.

## قبل الدمج أو النشر

- [ ] `npm ci` من lockfile.
- [ ] `npm run security:sentinel` بدون Critical.
- [ ] `npm run security:scan` ناجح.
- [ ] `npm run lint` ناجح.
- [ ] `npm run build` ناجح.
- [ ] `npm run security:csp` ناجح.
- [ ] `npm run security:dist` ناجح.
- [ ] `npm audit --omit=dev` تمت مراجعته.
- [ ] CodeQL / Semgrep / Trivy لا تحتوي نتيجة Critical غير مفهومة.

## قاعدة البيانات

- [ ] أي migration صلاحيات تمت مراجعتها حسب الدور.
- [ ] RLS/Policy تسمح للحالة المطلوبة وترفض مستخدمًا خارج النطاق.
- [ ] SECURITY DEFINER يملك `search_path` مثبتًا وتحقّق Authorization داخليًا.
- [ ] لا يوجد `service_role` أو DB password في المتصفح أو Git.
- [ ] تشغيل Supabase Security Advisor بعد DDL حساس.

## الإنتاج

- [ ] Vercel deploy = Success.
- [ ] Security headers موجودة على الاستجابة الحية.
- [ ] لا source maps أو `.env` أو ملفات مصدر حساسة مكشوفة.
- [ ] صفحات الدخول والبوابات الخاصة `no-store` و`noindex`.
- [ ] فحص OWASP ZAP Baseline المجدول/اليدوي قبل إصدار كبير.

## Android

- [ ] لا يتم إنشاء signing key جديد.
- [ ] الشهادة تطابق البصمة المعتمدة قبل البناء.
- [ ] keystore وكلمات المرور موجودة فقط في GitHub Secrets / النسخة الاحتياطية الآمنة.
- [ ] Artifact الإصدار لا يحتوي keystore أو كلمات مرور.
