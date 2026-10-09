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
- [x] **بخش ۷ (مرحله ۱): بازسازی پایه اشخاص**
- [x] Migration 023: جدول persons جدید با کد ملی
- [x] person_type جدید: employee, citizen, foreigner, legal
- [x] حذف floating
- [x] persons.html با ۴ تب جدید + فیلدهای سجلی جدید
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
- [ ] بخش ۷ (مرحله ۲): اطلاعات استخدامی (جدول employees + فرم کامل)
- [ ] بخش ۷ (مرحله ۳): افراد تحت تکفل
- [ ] بخش ۷ (مرحله ۴): محاسبات بیمه/مالیات
- [ ] بخش ۷ (مرحله ۵): کسورات
- [ ] بخش ۷ (مرحله ۶): حضور و غیاب + محاسبه حقوق
- [ ] بخش ۷ (مرحله ۷): امضای دیجیتال (mock SMS)
- [ ] بخش ۷ (مرحله ۸): auto-generate بودجه
- [ ] بخش ۷ (مرحله ۹): شهروند + خارج شهروند
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


## بخش ۷: اشخاص (Persons) — در حال بازسازی

### مرحله ۱ (انجام شد):
- [x] Migration 023: جدول persons جدید با کد ملی
- [x] person_type: employee, citizen, foreigner, legal
- [x] حذف floating
- [x] persons.html با ۴ تب + فیلدهای سجلی جدید
- [x] generatePersonCode با prefix per type
- [x] DatePicker شمسی
- [x] indent توی جدول
### مرحله ۲ (در حال انجام):
- [x] **مرحله ۲.۱: جدول `employees` + صفحه پایه**
- [x] Migration 024: جدول `employees`
- [x] Migration 025: Seed ۸ نوع حکم
- [x] API: `GET/POST /api/employees/:person_id`
- [x] صفحه `employee-profile.html` با ۱۱ تب
- [x] Breadcrumb در `employee-profile.html`

- [x] **مرحله ۲.۲: تکمیل تب استخدامی + واحد سازمانی**
- [x] Migration 026: Seed ۱۷ سازمان نمونه
- [x] `employee-profile.html` → dropdown واحد سازمانی
- [x] DatePicker شمسی (۶ فیلد)
### مراحل بعدی (بعداً):
- [ ] **مرحله ۲: صفحه `employee-profile.html`** (پرونده پرسنلی)
  - [ ] تب اطلاعات استخدامی (نوع قرارداد، تاریخ استخدام، ۹ نوع حکم)
  - [ ] تب قرارداد + امضای دیجیتال (mock SMS)
  - [ ] تب احکام کارگزینی + سنوات + بیمه
  - [ ] تب افراد تحت تکفل
  - [ ] تب محاسبات بیمه/مالیات
  - [ ] تب کسورات
  - [ ] تب حضور و غیاب
  - [ ] تب واحد سازمانی + روز مناسبتی
  - [ ] تب وظایف (طبقه‌بندی عملیاتی)
  - [ ] تب مدرک تحصیلی + تخصص + تجربه
- [ ] **مرحله ۳: استعلام کد ملی (mock)**
- [ ] **مرحله ۴: auto-generate بودجه**
- [ ] **مرحله ۵: شهروند + خارج شهروند (حساب + گردش حساب)**
### مثال:
- [ ] **مرحله ۲.۲: تکمیل تب واحد سازمانی + مدرک تحصیلی**
- [ ] **مرحله ۲.۳: تب وظایف (طبقه‌بندی عملیاتی)**
- [ ] **مرحله ۳: افراد تحت تکفل**
- [ ] **مرحله ۴: محاسبات بیمه/مالیات**
- [ ] **مرحله ۵: کسورات**
- [ ] **مرحله ۶: حضور و غیاب + محاسبه حقوق**
- [ ] **مرحله ۷: امضای دیجیتال (mock SMS)**
- [ ] **مرحله ۸: auto-generate بودجه**
- [ ] **مرحله ۹: شهروند + خارج شهروند (حساب + گردش حساب)**

### مرحله ۲ (در حال انجام):
- [x] **مرحله ۲.۱: جدول `employees` + صفحه پایه**
- [x] Migration 024: جدول `employees`
- [x] Migration 025: Seed ۸ نوع حکم (`base_data` section=`decree_type`)
- [x] API: `GET/POST /api/employees/:person_id`
- [x] صفحه `employee-profile.html` با ۱۱ تب
- [x] تب اطلاعات پایه (نمایش)
- [x] تب اطلاعات استخدامی (فرم کامل + DatePicker)
- [x] دکمه «پرونده پرسنلی» توی `persons.html`
- [x] Breadcrumb

- [ ] **مرحله ۲.۳: تب وظایف (طبقه‌بندی عملیاتی)**
- [ ] **مرحله ۲.۴: تب مدرک تحصیلی (تکمیل‌تر)**
- [ ] **مرحله ۳: افراد تحت تکفل**
- [ ] **مرحله ۴: محاسبات بیمه/مالیات**
- [ ] **مرحله ۵: کسورات**
- [ ] **مرحله ۶: حضور و غیاب + محاسبه حقوق**
- [ ] **مرحله ۷: امضای دیجیتال (mock SMS)**
- [ ] **مرحله ۸: auto-generate بودجه**
- [ ] **مرحله ۹: شهروند + خارج شهروند**

## ساختار سازمانی (base_data section='organization'):
- `س-001` — حوزه شهردار
- `س-002` — معاونت مالی و اداری
  - `س-002001` — اداره منابع انسانی
  - `س-002002` — اداره مالی
  - `س-002003` — اداره بودجه و برنامه‌ریزی
  - `س-002004` — اداره پشتیبانی
- `س-003` — معاونت فنی و عمرانی
  - `س-003001` — اداره عمران
  - `س-003002` — اداره فنی
  - `س-003003` — اداره نظارت
- `س-004` — معاونت خدمات شهری
  - `س-004001` — اداره خدمات عمومی
  - `س-004002` — اداره فضای سبز
  - `س-004003` — اداره پسماند
- `س-005` — معاونت فرهنگی و اجتماعی
- `س-006` — معاونت برنامه‌ریزی و توسعه