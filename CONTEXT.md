# پروژه: سامانه بودجه شهرداری

## تاریخ آخرین آپدیت: [امروز]

## وضعیت: فاز ۱۷ تکمیل شد ✅

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
- [x] فاز ۱۳: گزارش پیشرفته
- [x] فاز ۱۴: تفریغ بودجه
- [x] فاز ۱۵: امنیت (Audit Log + Rate Limiting)
- [x] فاز ۱۶: UI/UX (داشبورد + نمودار + Dark mode)
- [x] فاز ۱۷: تست کامل

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
- /advanced-reports.html
- /tafriq.html
- /audit-log.html

## کاربران پیش‌فرض:
- admin / Admin123! (مدیر سیستم)
- (بقیه کاربران رو خودت ساختی)

## نقش‌ها:
- admin: دسترسی کامل
- manager: تایید بودجه
- expert: ثبت بودجه
- viewer: فقط مشاهده
- province: فقط گزارشات
- ministry: فقط گزارشات

## کار بعدی:
- فاز ۱۸: مستندسازی

## مشکلات حل شده:
- ✅ ویرایش سال مالی
- ✅ حذف/غیرفعال کاربر (Foreign Key)
- ✅ فونت و اعداد نمودارها
- ✅ اعداد فارسی در URL
- ✅ ریدایرکت بعد از لاگین

## یادداشت‌ها:
- برای deploy: wrangler deploy
- برای push: git push origin main
- برای migration remote: wrangler d1 execute budget-db --file=... --remote
- برای migration local: بدون --remote
- برای tail: wrangler tail
- برای حذف دیتا: wrangler d1 execute budget-db --command="DELETE FROM ..." --remote