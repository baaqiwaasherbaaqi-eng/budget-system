# پروژه: سامانه بودجه شهرداری

## تاریخ آخرین آپدیت: 1405/06/31

## وضعیت: بخش ۳ اطلاعات پایه (برنامه راهبردی) تکمیل شد ✅

## کارهای انجام شده:
- [x] فاز ۰ تا ۱۷ (کامل)
- [x] فاز ۱۸: مستندسازی (در حال انجام)
- [x] بازطراحی بخش ۲ (طبقه‌بندی سازمانی) با درخت
- [x] بازطراحی بخش ۴ (طبقه‌بندی اقتصادی) با درخت + تب منابع/مصارف
- [x] جدول `base_data` + API کامل + UI درختی/جدولی
- [x] آپدیت `budget_proposals` با FK به `base_data`
- [x] آپدیت `budget-proposals.html` برای استفاده از `base_data`
- [x] حذف سازمانی و اقتصادی از منوی اصلی (فقط در اطلاعات پایه)
- [x] **افزودن Footer مشترک به همه صفحات (لوگو + حق نشر «داده کاوان هوشمند»)**
- [x] **بخش ۳: برنامه راهبردی (چشم‌انداز → راهبرد → سیاست اجرایی)**
- [x] **باگ‌فیکس: `currentParentId` — دکمه «افزودن ریشه» دیگه به `selectedNode` نگاه نمی‌کنه**

## صفحات موجود:
- /login.html
- /dashboard.html
- /fiscal-years.html
- /economic-classifications.html (بازطراحی — درختی + تب)
- /organizations.html (بازطراحی — درختی)
- /strategic-plan.html (جدید — درختی)
- /budget-proposals.html (آپدیت شده)
- /reports.html
- /allocations.html
- /executions.html
- /users.html
- /revisions.html
- /advanced-reports.html
- /tafriq.html
- /audit-log.html
- /municipality-info.html
- /base-info.html

## کاربران پیش‌فرض:
- admin / Admin123!

## نقش‌ها:
- admin, manager, expert, viewer, province, ministry

## کارهای بعدی (طبق سند اطلاعات پایه):
- [ ] بخش ۴ (ادامه): طبقه‌بندی عملیاتی (مأموریت، برنامه، خدمت، فعالیت، طرح، پروژه)
- [ ] بخش ۴ (ادامه): تعریف نوع اعتبار (هزینه‌ای، سرمایه‌ای، مالی)
- [ ] بخش ۴ (ادامه): تعریف نوع مصرف (عمومی، اختصاصی)
- [ ] بخش ۵: حسابداری (دارایی‌ها، بدهی‌ها، سرمایه، عملکرد)
- [ ] بخش ۶: کالا و خدمات (کدینگ کالا، فهرست بها، استهلاک، احکام حقوقی)
- [ ] بخش ۷: اشخاص (کارکنان، حقیقی، حقوقی، تفصیلی شناور)

## ساختار `base_data`:
- `section`: 'organization', 'economic', 'operational', 'strategic', 'accounting', 'goods', 'persons'
- `type`: 'resource', 'expense', 'mission', 'program', 'strategic', 'general', ...
- `prefix`: 'س' برای سازمانی، 'ر' برای راهبردی، NULL برای اقتصادی
- `code`: کد کامل
- `digit_count`: 2 تا 20 (پیش‌فرض 3)
- `level`, `level_name`, `parent_id`
- `extra_data`: متن (اختیاری)
- `created_at_shamsi` / `updated_at_shamsi`: خودکار

## قوانین کدینگ:
- هر بخش یک سرکد دارد؛ زیرکدها به کد مادر اضافه می‌شن
- حرف پیشوند برای همه بخش‌ها (به‌جز بخش ۴) — `س` سازمانی، `ر` راهبردی
- بخش ۴ (بودجه):
  - اقتصادی: منابع از `1`، مصارف از `2`
  - عملیاتی: مأموریت از `1`، برنامه زیرکد `1`، خدمت `00001`-`49000`، فعالیت زیرکد `1`، طرح `49000`-`99999`، پروژه زیرکد `1`
- تعداد ارقام: 2 تا 20 (پیش‌فرض 3)
- **گروه‌های اصلی اقتصادی (منابع/مصارف) ثابت هستند و کاربر نمی‌تونه گروه جدید بسازه**

## مشکلات حل شده:
- ✅ ویرایش سال مالی
- ✅ حذف/غیرفعال کاربر
- ✅ فونت و اعداد نمودارها
- ✅ اعداد فارسی در URL
- ✅ ریدایرکت بعد از لاگین
- ✅ باگ پیشوند تکراری در `generateNextCode`
- ✅ اتصال `budget_proposals` به `base_data`
- ✅ Footer مشترک بدون بهم ریختن layout
- ✅ `currentParentId` — جدا کردن والد modal از `selectedNode`

## یادداشت‌ها:
- Deploy: `wrangler deploy`
- Push: `git push origin main`
- Migration remote: `wrangler d1 execute budget-db --file=... --remote`
- Migration local: بدون `--remote`
- Tail: `wrangler tail`
- جداول قدیمی با `_old` suffix (بکاپ)
- `toShamsi()` در `src/date.js`
- `generateNextCode()`, `buildTree()`, `logBaseDataAction()` در `src/base-data.js`
- Footer: `public/footer.js` + `public/Logo.png`، توی `sidebar.js` لود می‌شه (و `login.html` مستقیم)
- Breadcrumb: `pathMap` در `sidebar.js` — برای هر صفحه جدید، اضافه کن