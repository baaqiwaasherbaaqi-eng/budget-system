# پروژه: سامانه بودجه شهرداری

## تاریخ آخرین آپدیت: 1405/07/08

## وضعیت: بخش ۸ (سیستم Permission) — تکمیل شد ✅

## کارهای انجام شده:
- [x] فاز ۰ تا ۱۸
- [x] بازطراحی بخش ۲ (طبقه‌بندی سازمانی)
- [x] بازطراحی بخش ۴ (طبقه‌بندی اقتصادی)
- [x] بخش ۳: برنامه راهبردی
- [x] بخش ۴: طبقه‌بندی عملیاتی
- [x] بخش ۴: نوع اعتبار + نوع مصرف
- [x] بخش ۵: حسابداری
- [x] بخش ۶: کدینگ کالا و خدمات
- [x] **بخش ۷: اشخاص (کارکنان، حقیقی، حقوقی، تفصیلی شناور)**
- [x] **بخش ۸: سیستم Permission سفارشی**
- [x] جدول `base_data` + API کامل + UI درختی/جدولی
- [x] جدول `persons` + API کامل + UI + فرم هوشمند
- [x] جدول `role_permissions` و `user_permissions` (Migration 022)
- [x] APIهای Permission (`/api/permissions/keys`, `/api/users/:id/permissions`, `/api/me/permissions`)
- [x] صفحه `permissions.html` با UI پیشرفته (پیش‌فرض/اجازه/عدم اجازه)
- [x] اتصال `sidebar.js` به Permission (فیلتر منو)
- [x] اتصال `dashboard.html` به Permission (فیلتر کارت‌ها)
- [x] اتصال `users.html` به Permission
- [x] **Top Bar مشترک** (کاربر + عنوان صفحه + بازگشت + تم + خروج)
- [x] **Dark Mode مشترک** (`dark.css`)
- [x] **یکدست‌سازی عرض صفحات** (`max-width: 1400px`)
- [x] `tree.css` مشترک برای یکدست‌سازی درخت‌ها
- [x] `table.css` مشترک برای یکدست‌سازی جدول‌ها
- [x] `person_organizations` و `entity_relations` (آماده برای آینده)
- [x] Footer مشترک
- [x] Breadcrumb مشترک
- [x] صفحه `goods.html` با `extra_data`
- [x] صفحه `persons.html` با ۴ تب + DatePicker شمسی
- [x] دسترسی `manager` به «سال مالی» و «لاگ سیستم» (کامل: صفحه + API)
- [x] بهبود ظاهر صفحه لاگین (روشن‌تر + فوتر واضح)
- [x] حذف `status` از کارت‌های `base-info.html` (هاید شده)
- [x] تمیزکاری CSSهای تکراری از صفحات
- [x] دکمه بازگشت در top-bar

## صفحات موجود:
### احراز هویت
- /login.html

### داشبورد
- /dashboard.html

### اطلاعات پایه
- /base-info.html
- /municipality-info.html
- /fiscal-years.html
- /organizations.html
- /economic-classifications.html
- /strategic-plan.html
- /operational-classifications.html
- /accounting.html
- /budget-types.html
- /goods.html
- /persons.html

### بودجه
- /budget-proposals.html
- /allocations.html
- /executions.html
- /revisions.html

### گزارشات
- /reports.html
- /advanced-reports.html
- /tafriq.html

### مدیریت
- /users.html
- /permissions.html  ← جدید
- /audit-log.html

## کاربران پیش‌فرض:
- admin / Admin123!

## نقش‌ها:
- admin, manager, expert, viewer, province, ministry

## کارهای بعدی:
- [ ] بخش ۸: تکمیل Permission در بقیه APIها (`users` POST/PUT/DELETE)
- [ ] بخش ۸: چک دسترسی در بقیه صفحات
- [ ] بخش ۷: اتصال اشخاص به سازمان (`person_organizations`)
- [ ] بخش ۷: اتصال اشخاص به بودجه پیشنهادی
- [ ] بخش ۷: استعلام کد ملی
- [ ] بخش ۷: گزارش‌گیری از اشخاص
- [ ] بخش ۶: فهرست بهای کالا و خدمات
- [ ] بخش ۶: استهلاک دارایی‌های ثابت
- [ ] بخش ۶: احکام حقوقی
- [ ] اتصال کالا/خدمات به `budget-proposals.html`
- [ ] تدوین و تصویب بودجه

## ساختار `base_data`:
- `section`: 'organization', 'economic', 'strategic', 'operational', 'accounting', 'budget_type', 'goods'
- `type`: انواع مختلف
- `extra_data`: JSON string

## ساختار `persons`:
- `person_type`: 'employee', 'natural', 'legal', 'floating'
- `code`, `parent_id`, `level`, `level_name`
- اطلاعات هویتی، تماس، استخدامی، بانکی
- `national_id_verified`, `notes`, `extra_data`, `is_active`

## ساختار `permissions`:
- `role_permissions`: (role, permission_key, granted)
- `user_permissions`: (user_id, permission_key, granted, granted_by)

### کلیدهای Permission:
- `base_info.view`, `base_info.edit`
- `persons.view`, `persons.add`, `persons.edit`, `persons.delete`
- `budget.view`, `budget.add`, `budget.submit`, `budget.approve_manager`, `budget.approve_finance`, `budget.approve_final`
- `allocations.view`, `allocations.add`
- `executions.view`, `executions.add`
- `reports.view`, `reports.export`
- `users.view`, `users.add`, `users.edit`, `users.delete`, `users.permissions`
- `fiscal_years.view`, `fiscal_years.manage`
- `audit_log.view`
- `municipality_info.view`, `municipality_info.edit`

## قوانین کدینگ بخش ۷ (اشخاص):
- **کدینگ ۱۰ رقمی:** `[۱ رقم گروه][۳ رقم زیرگروه][۳ رقم دسته][۳ رقم شخص]`
- **سطح ۱:** `X000000000`
- **سطح ۲:** `XYYY000000`
- **سطح ۳:** `XYYYZZZ000`
- **سطح ۴:** `XYYYZZZWWW`

### مثال: