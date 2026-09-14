# پروژه: سامانه بودجه شهرداری

## تاریخ آخرین آپدیت: [امروز]

## وضعیت: فاز ۱۲ تکمیل شد ✅

## کارهای انجام شده:
- [x] فاز ۰: زیرساخت
- [x] فاز ۱: احراز هویت
- [x] فاز ۲: سال مالی
- [x] فاز ۳: طبقه‌بندی اقتصادی
- [x] فاز ۴: ساختار سازمانی
- [x] فاز ۵: بودجه پیشنهادی
- [x] فاز ۶: هوشمندسازی (کنار گذاشته شد)
- [x] فاز ۷: تایید و تصویب
- [x] فاز ۸: گزارشات پایه
- [x] فاز ۹: تخصیص و تامین اعتبار
- [x] فاز ۱۰: تناظر کدینگ (کنار گذاشته شد)
- [x] فاز ۱۱: مدیریت کاربران
- [x] فاز ۱۲: اصلاح بودجه

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
- /users.html
- /revisions.html

## API های موجود:
(لیست کامل API ها)

## کار بعدی:
- فاز ۱۳: گزارش پیشرفته
- فاز ۱۴: تفریغ بودجه

## مشکلات باقی‌مانده:
- ویرایش/حذف سال مالی

## یادداشت‌ها:
- برای deploy: wrangler deploy
- برای push: git push origin main
- برای migration: wrangler d1 execute budget-db --file=... --remote
- برای حذف دیتا: wrangler d1 execute budget-db --command="DELETE FROM ..." --remote