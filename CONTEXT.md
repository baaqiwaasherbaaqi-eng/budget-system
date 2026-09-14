# پروژه: سامانه بودجه شهرداری

## تاریخ آخرین آپدیت: [امروز]

## وضعیت: فاز ۸ تکمیل شد ✅

## کارهای انجام شده:
- [x] فاز ۰: زیرساخت (GitHub, Wrangler, D1, Workers)
- [x] فاز ۱: احراز هویت (login, JWT, نقش‌ها)
- [x] فاز ۲: سال مالی (افزودن، فعال‌سازی)
- [x] فاز ۳: طبقه‌بندی اقتصادی (منابع/مصارف، سرفصل/فصل/زیرفصل)
- [x] فاز ۴: ساختار سازمانی (سازمان‌ها، مراکز هزینه)
- [x] فاز ۵: بودجه پیشنهادی (ثبت، لیست، حذف)
- [x] فاز ۶: هوشمندسازی (فعلاً کنار گذاشته شد)
- [x] فاز ۷: تایید و تصویب (۵ مرحله‌ای: draft → submitted → manager_approved → finance_approved → approved/rejected)
- [x] فاز ۸: گزارشات پایه (خلاصه، بر اساس وضعیت، سازمان، نوع)

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

## صفحات موجود:
- /login.html
- /dashboard.html
- /fiscal-years.html
- /economic-classifications.html
- /organizations.html
- /budget-proposals.html
- /reports.html

## کاربر پیش‌فرض:
- username: admin
- password: Admin123!

## کار بعدی:
- فاز ۹: اجرای بودجه (تخصیص اعتبار و تامین اعتبار)
  - جدول budget_allocations
  - جدول budget_executions
  - کد فنی ۹ رقمی
  - زنجیره تایید تامین اعتبار
  - کنترل سقف اعتبار

## مشکلات باقی‌مانده:
- ویرایش سال مالی کار نمیکنه (موقتاً حذف شد)
- حذف سال مالی کار نمیکنه (موقتاً حذف شد)

## یادداشت‌ها:
- برای deploy: wrangler deploy
- برای push: git push origin main
- برای migration: wrangler d1 execute budget-db --file=... --remote
- برای migration لوکال: بدون --remote