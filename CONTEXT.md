# پروژه: سامانه بودجه شهرداری

## تاریخ آخرین آپدیت: 1405/06/31

## وضعیت: بخش ۵ (حسابداری) تکمیل شد ✅

## کارهای انجام شده:
- [x] فاز ۰ تا ۱۷
- [x] فاز ۱۸: مستندسازی (در حال انجام)
- [x] بازطراحی بخش ۲ (طبقه‌بندی سازمانی)
- [x] بازطراحی بخش ۴ (طبقه‌بندی اقتصادی)
- [x] بخش ۳: برنامه راهبردی
- [x] بخش ۴: طبقه‌بندی عملیاتی (مأموریت → برنامه → خدمت/طرح → فعالیت/پروژه)
- [x] **بخش ۵: حسابداری (دارایی‌ها، بدهی‌ها، سرمایه، عملکرد، انبارداری)**
- [x] جدول `base_data` + API کامل + UI درختی/جدولی
- [x] آپدیت `budget_proposals` با FK به `base_data`
- [x] Footer مشترک
- [x] باگ‌فیکس `currentParentId`

## صفحات موجود:
- /login.html
- /dashboard.html
- /fiscal-years.html
- /economic-classifications.html (درختی + تب)
- /organizations.html (درختی)
- /strategic-plan.html (درختی)
- /operational-classifications.html (درختی)
- /accounting.html (درختی)
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

## کارهای بعدی:
- [ ] بخش ۴ (ادامه): تعریف نوع اعتبار
- [ ] بخش ۴ (ادامه): تعریف نوع مصرف
- [ ] بخش ۶: کالا و خدمات
- [ ] بخش ۷: اشخاص

## ساختار `base_data`:
- `section`: 'organization', 'economic', 'strategic', 'operational', 'accounting', 'goods', 'persons'
- `type`: 'resource', 'expense', 'strategic', 'mission', 'program', 'service', 'plan', 'activity', 'project', 'asset', 'liability', 'equity', 'performance', 'warehouse', 'accounting', 'general', ...
- `prefix`: 'س' سازمانی، 'ر' راهبردی، 'ح' حسابداری، NULL برای اقتصادی و عملیاتی
- `code`: کد کامل
- `digit_count`: 2 تا 20 (پیش‌فرض 3)
- `level`, `level_name`, `parent_id`
- `extra_data`: متن (اختیاری)
- `created_at_shamsi` / `updated_at_shamsi`: خودکار

## قوانین کدینگ:
- هر بخش یک سرکد دارد؛ زیرکدها به کد مادر اضافه می‌شن
- حرف پیشوند برای همه بخش‌ها (به‌جز بخش ۴):
  - `س` سازمانی
  - `ر` راهبردی
  - `ح` حسابداری
- **بخش ۴ (بودجه):**
  - **اقتصادی:** منابع از `1`، مصارف از `2`
  - **عملیاتی:**
    - مأموریت: `001`
    - برنامه: `001001`
    - خدمت: والد + `00001` (تا `49999`)
    - طرح: والد + `50000` (تا `99999`)
    - فعالیت: والد + `001`
    - پروژه: والد + `001`
    - **سلسله‌مراتب:** مأموریت ← برنامه ← (خدمت/طرح) ← (فعالیت/پروژه)
    - **محدودیت:** فعالیت فقط زیر خدمت، پروژه فقط زیر طرح
- **حسابداری:** `ح-001`, `ح-001001`, `ح-001001001`, ...
  - سطوح: `گروه`, `سرفصل`, `کل`, `معین`, `تفصیلی`

## مشکلات حل شده:
- ✅ ویرایش سال مالی
- ✅ حذف/غیرفعال کاربر
- ✅ فونت و اعداد نمودارها
- ✅ اعداد فارسی در URL
- ✅ ریدایرکت بعد از لاگین
- ✅ باگ پیشوند تکراری در `generateNextCode`
- ✅ اتصال `budget_proposals` به `base_data`
- ✅ Footer مشترک
- ✅ `currentParentId`
- ✅ کدینگ اختصاصی عملیاتی

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
- Breadcrumb: `pathMap` در `sidebar.js`
- Context menu در `operational-classifications.html` داینامیکه
- **Migrations مهم:**
  - `014a_create_base_data.sql` (ساخت جدول)
  - `014b_seed_base_data.sql` (seed اقتصادی)
  - `014c_seed_organization.sql` (seed سازمانی)
  - `015_budget_refactor.sql` (budget tables refactor)
  - `015b_related_tables.sql` (budget_approval_logs + council_resolutions)
  - `016_accounting_seed.sql` (seed حسابداری)