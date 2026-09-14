# پروژه: سامانه بودجه شهرداری

## تاریخ آخرین آپدیت: [امروز]

## وضعیت: فاز ۹ تکمیل شد ✅

## کارهای انجام شده:
- [x] فاز ۰: زیرساخت
- [x] فاز ۱: احراز هویت
- [x] فاز ۲: سال مالی
- [x] فاز ۳: طبقه‌بندی اقتصادی
- [x] فاز ۴: ساختار سازمانی
- [x] فاز ۵: بودجه پیشنهادی
- [x] فاز ۶: هوشمندسازی (کنار گذاشته شد)
- [x] فاز ۷: تایید و تصویب (۵ مرحله‌ای)
- [x] فاز ۸: گزارشات پایه
- [x] فاز ۹: تخصیص و تامین اعتبار

## API های موجود:
- POST /api/login
- GET /api/hello
- GET /api/test-db
- GET/POST /api/fiscal-years
- PUT /api/fiscal-years/activate
- GET/POST/DELETE /api/economic-classifications
- GET/POST/DELETE /api/organizations
- GET/POST/DELETE /api/budget-proposals
- PUT /api/budget-proposals/change-status
- GET /api/approval-history/:id
- GET /api/reports/summary
- GET /api/reports/detailed
- GET/POST/DELETE /api/allocations
- GET /api/allocations/balance/:id
- GET/POST/DELETE /api/executions

## صفحات موجود:
- /login.html
- /dashboard.html
- /fiscal-years.html
- /economic-classifications.html
- /organizations.html
- /budget-proposals.html
- /reports.html
- /allocations.html
- /executions.html

## کاربر پیش‌فرض:
- username: admin
- password: Admin123!

## کار بعدی:
- فاز ۱۰: تناظر کدینگ و بودجه سنواتی
  - جدول legacy_budget_mappings
  - ورود بودجه سنواتی
  - الگوریتم تناظر کدینگ
  - گزارش‌های مقایسه‌ای

## مشکلات باقی‌مانده:
- ویرایش سال مالی کار نمیکنه (موقتاً حذف شد)
- حذف سال مالی کار نمیکنه (موقتاً حذف شد)

## یادداشت‌ها:
- برای deploy: wrangler deploy
- برای push: git push origin main
- برای migration remote: wrangler d1 execute budget-db --file=... --remote
- برای migration local: بدون --remote
- تاریخ شمسی با persian-datepicker
- اعداد فارسی با توابع toPersianNumbers/toEnglishNumbers