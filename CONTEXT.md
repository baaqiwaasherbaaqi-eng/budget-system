# پروژه: سامانه بودجه شهرداری

## تاریخ آخرین آپدیت: امروز

## وضعیت: فاز ۱ تکمیل شد ✅

## کارهای انجام شده:
- [x] فاز ۰: راه‌اندازی زیرساخت
  - GitHub Repository
  - Wrangler نصب شد
  - D1 Database ساخته شد
  - اولین Worker ساخته شد
  
- [x] فاز ۱: احراز هویت
  - جدول users ساخته شد
  - سیستم login با JWT
  - صفحه login.html
  - صفحه dashboard.html
  - کاربر admin ساخته شد
  - فونت Vazirmatn اضافه شد

## API های موجود:
- POST /api/login - ورود با username و password
- GET /api/hello - تست سرور
- GET /api/test-db - تست دیتابیس

## کاربر پیش‌فرض:
- username: admin
- password: Admin123!

## کار بعدی:
- فاز ۲: مدیریت سال مالی
- ساخت جدول fiscal_years
- API برای CRUD سال مالی
- صفحه مدیریت سال مالی

## مشکلات:
- حل شد: مشکل فونت فارسی
- حل شد: مشکل jsonwebtoken در Cloudflare Workers
- حل شد: مشکل serve فایل‌های استاتیک

## یادداشت‌ها:
- این فایل حافظه پروژه ماست
- برای push از Token جدید استفاده کن
- برای deploy: wrangler deploy
- برای push: git push origin main