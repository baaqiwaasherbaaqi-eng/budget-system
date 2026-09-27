# پروژه: سامانه بودجه شهرداری

## تاریخ آخرین آپدیت: 1405/06/31

## وضعیت: طبقه‌بندی عملیاتی (بخش ۴ بودجه) تکمیل شد ✅

## کارهای انجام شده:
- [x] فاز ۰ تا ۱۷ (کامل)
- [x] فاز ۱۸: مستندسازی (در حال انجام)
- [x] بازطراحی بخش ۲ (طبقه‌بندی سازمانی) با درخت
- [x] بازطراحی بخش ۴ (طبقه‌بندی اقتصادی) با درخت + تب
- [x] جدول `base_data` + API کامل + UI درختی/جدولی
- [x] آپدیت `budget_proposals` با FK به `base_data`
- [x] آپدیت `budget-proposals.html`
- [x] حذف سازمانی و اقتصادی از منوی اصلی
- [x] Footer مشترک (لوگو + حق نشر «داده کاوان هوشمند»)
- [x] بخش ۳: برنامه راهبردی
- [x] باگ‌فیکس: `currentParentId`
- [x] **بخش ۴ (ادامه): طبقه‌بندی عملیاتی**
- [x] **کدینگ اختصاصی عملیاتی: خدمت از `00001`، طرح از `50000`**

## صفحات موجود:
- /login.html
- /dashboard.html
- /fiscal-years.html
- /economic-classifications.html (درختی + تب)
- /organizations.html (درختی)
- /strategic-plan.html (درختی)
- /operational-classifications.html (درختی)
- /budget-proposals.html
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
- [ ] بخش ۴ (ادامه): تعریف نوع اعتبار (هزینه‌ای، سرمایه‌ای، مالی)
- [ ] بخش ۴ (ادامه): تعریف نوع مصرف (عمومی، اختصاصی)
- [ ] بخش ۵: حسابداری (دارایی‌ها، بدهی‌ها، سرمایه، عملکرد)
- [ ] بخش ۶: کالا و خدمات (کدینگ کالا، فهرست بها، استهلاک، احکام حقوقی)
- [ ] بخش ۷: اشخاص (کارکنان، حقیقی، حقوقی، تفصیلی شناور)

## ساختار `base_data`:
- `section`: 'organization', 'economic', 'strategic', 'operational', 'accounting', 'goods', 'persons'
- `type`: 'resource', 'expense', 'strategic', 'mission', 'program', 'service', 'plan', 'activity', 'project', 'general', ...
- `prefix`: 'س' سازمانی، 'ر' راهبردی، NULL برای اقتصادی و عملیاتی
- `code`: کد کامل
- `digit_count`: 2 تا 20 (پیش‌فرض 3)
- `level`, `level_name`, `parent_id`
- `extra_data`: متن (اختیاری)
- `created_at_shamsi` / `updated_at_shamsi`: خودکار

## قوانین کدینگ:
- هر بخش یک سرکد دارد؛ زیرکدها به کد مادر اضافه می‌شن
- حرف پیشوند برای همه بخش‌ها (به‌جز بخش ۴) — `س` سازمانی، `ر` راهبردی
- **بخش ۴ (بودجه):**
  - **اقتصادی:** منابع از `1`، مصارف از `2`
  - **عملیاتی:**
    - مأموریت (سطح ۰): `001`, `002`, ...
    - برنامه (سطح ۱): `001001`, `001002`, ...
    - خدمت (سطح ۲ زیر برنامه): والد + `00001`, `00002`, ... (تا `49999`)
    - طرح (سطح ۲ زیر برنامه): والد + `50000`, `50001`, ... (تا `99999`)
    - فعالیت (سطح ۳ زیر خدمت): والد + `001`, `002`, ...
    - پروژه (سطح ۳ زیر طرح): والد + `001`, `002`, ...
    - **سلسله‌مراتب:** مأموریت ← برنامه ← (خدمت / طرح) ← (فعالیت / پروژه)
    - **محدودیت:** فعالیت فقط زیر خدمت، پروژه فقط زیر طرح

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
- ✅ کدینگ اختصاصی عملیاتی (خدمت/طرح)

## یادداشت‌ها:
- Deploy: `wrangler deploy`
- Push: `git push origin main`
- Migration remote: `wrangler d1 execute budget-db --file=... --remote`
- Migration local: بدون `--remote`
- Tail: `wrangler tail`
- جداول قدیمی با `_old` suffix
- `toShamsi()` در `src/date.js`
- `generateNextCode()` + `generateOperationalCode()` در `src/base-data.js`
- Footer: `public/footer.js` + `public/Logo.png`
- Breadcrumb: `pathMap` در `sidebar.js` — برای هر صفحه جدید اضافه کن
- Context menu در `operational-classifications.html` داینامیکه (بر اساس `type` والد)