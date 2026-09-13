
پروژه: سامانه بودجه شهرداری
تاریخ آخرین آپدیت: [امروز]
وضعیت: فاز ۰ تا ۵ تکمیل شد ✅
کارهای انجام شده:
☑ فاز ۰: راه‌اندازی زیرساخت
☑ فاز ۱: احراز هویت
☑ فاز ۲: سال مالی
☑ فاز ۳: طبقه‌بندی اقتصادی
☑ فاز ۴: ساختار سازمانی
☑ فاز ۵: بودجه پیشنهادی
API های موجود:
POST /api/login

GET /api/hello

GET /api/test-db

GET/POST /api/fiscal-years

PUT /api/fiscal-years/activate

DELETE /api/fiscal-years/:year

GET/POST/DELETE /api/economic-classifications

GET/POST/DELETE /api/organizations

GET/POST/DELETE /api/budget-proposals

ساختار پروژه:
budget-system/
├── src/
│ ├── index.js
│ └── auth.js
├── public/
│ ├── login.html
│ ├── dashboard.html
│ ├── fiscal-years.html
│ ├── economic-classifications.html
│ ├── organizations.html
│ └── budget-proposals.html
├── migrations/
│ ├── 001_users.sql
│ ├── 002_admin.sql
│ ├── 003_fiscal_years.sql
│ ├── 004_economic_classifications.sql
│ ├── 005_organizations.sql
│ └── 006_budget_proposals.sql
├── CONTEXT.md
├── wrangler.toml
└── package.json

کاربر پیش‌فرض:
username: admin

password: Admin123!

آدرس سایت:
https://budget-system.baaqiwaasherbaaqi.workers.dev

کار بعدی:
فاز ۶: فرآیند تایید و تصویب بودجه

گردش کار تایید

تغییر وضعیت بودجه (draft → submitted → approved/rejected)

ثبت مصوبه شورا

مشکلات و نکات:
ویرایش سال مالی کار نمیکنه (موقتاً حذف شد)

حذف سال مالی کار نمیکنه (موقتاً حذف شد)

توکن JWT ۲۴ ساعته هست

برای push از Token جدید GitHub استفاده کن

jsonwebtoken با Cloudflare سازگار نبود، از Web Crypto API استفاده کردیم

تصمیمات مهم:
هوشمندسازی رو در فاز آخر کار میکنیم

فعلاً بدون طبقه‌بندی عملیاتی و راهبردی

سطوح دسترسی استانی/وزارتی در فاز آخر

دستورات مهم:
wrangler dev = تست لوکال

wrangler deploy = استقرار

wrangler d1 execute budget-db --file=./migrations/xxx.sql --remote = اجرای migration

git add . && git commit -m "..." && git push origin main = ذخیره در GitHub