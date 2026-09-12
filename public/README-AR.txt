ملفات هوية موقع الصديق

1) انسخ هذه الملفات إلى:
   C:\Users\PC\sadiq-web\public\

   favicon.ico
   favicon-16x16.png
   favicon-32x32.png
   favicon-48x48.png
   apple-touch-icon.png
   icon-192.png
   icon-512.png
   icon-maskable-512.png
   site.webmanifest

2) افتح:
   C:\Users\PC\sadiq-web\index.html

3) احذف favicon الخاص بـ Vite إن وجد، مثل:
   <link rel="icon" type="image/svg+xml" href="/vite.svg" />

4) أضف محتوى index-head-snippet.html داخل <head>.

5) تأكد أن العنوان:
   <title>الصديق</title>

6) شغّل:
   npm run build

7) ثم:
   git add .
   git commit -m "Add Sadiq favicon and app icons"
   git push origin main

ملاحظة:
- favicon.ico / PNG للمتصفح.
- apple-touch-icon.png لآيفون وآيباد عند الإضافة للشاشة الرئيسية.
- site.webmanifest + icon-192/icon-512 لأندرويد ومتصفحات PWA.
- icon-maskable-512.png يحافظ على الشعار داخل المنطقة الآمنة للأيقونات الدائرية أو المقصوصة.
