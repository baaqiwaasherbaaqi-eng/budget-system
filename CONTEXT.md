# پروژه: سامانه بودجه شهرداری

## تاریخ آخرین آپدیت: 1405/07/16

## وضعیت: بخش ۸ (سیستم Permission) — تکمیل شد ✅ + مرحله ۴ (محاسبات حقوق) — تکمیل شد ✅

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
- /payroll-settings.html

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
- /permissions.html
- /audit-log.html

### حقوق و دستمزد
- /employee-profile.html
- /payroll-calculate.html
- /employee-deductions.html
- /attendance.html

## کاربران پیش‌فرض:
- admin / Admin123!

## نقش‌ها:
- admin, manager, expert, viewer, province, ministry

---

## بخش ۷: اشخاص (Persons)

### ساختار کدینگ (۱۰ رقمی):
- **کدینگ:** `[۱ رقم گروه][۳ رقم زیرگروه][۳ رقم دسته][۳ رقم شخص]`
- **سطح ۱:** `X000000000` — گروه اصلی
- **سطح ۲:** `XYYY000000` — زیرگروه
- **سطح ۳:** `XYYYZZZ000` — دسته
- **سطح ۴:** `XYYYZZZWWW` — شخص
- **prefix ها:** 1=کارکنان، 2=شهروندان، 3=اشخاص حقوقی، 4=خارج شهروندان

### مراحل انجام‌شده:
- [x] **مرحله ۱:** Migration 023 — جدول `persons` جدید با کد ملی
- [x] person_type: employee, citizen, foreigner, legal (حذف floating)
- [x] `persons.html` با ۴ تب + فیلدهای سجلی جدید
- [x] `generatePersonCode` با prefix per type
- [x] DatePicker شمسی + indent توی جدول

- [x] **مرحله ۲.۱:** Migration 024 — جدول `employees` + صفحه پایه
- [x] Migration 025 — Seed ۸ نوع حکم
- [x] API: `GET/POST /api/employees/:person_id`
- [x] صفحه `employee-profile.html` با ۱۱ تب
- [x] Breadcrumb در `employee-profile.html`

- [x] **مرحله ۲.۲:** Migration 026 — Seed ۱۷ سازمان نمونه
- [x] dropdown واحد سازمانی در `employee-profile.html`
- [x] DatePicker شمسی (۶ فیلد)

### مراحل بعدی:
- [ ] **مرحله ۲.۳:** تب مدرک تحصیلی + تخصص + تجربه (تکمیل‌تر)
- [ ] **مرحله ۳:** افراد تحت تکفل + استعلام کد ملی (mock)
- [ ] **مرحله ۴:** محاسبات بیمه/مالیات
- [ ] **مرحله ۵:** کسورات (وام‌ها)
- [ ] **مرحله ۶:** حضور و غیاب + محاسبه حقوق
- [ ] **مرحله ۷:** امضای دیجیتال (mock SMS)
- [ ] **مرحله ۸:** auto-generate بودجه
- [ ] **مرحله ۹:** شهروند + خارج شهروند (حساب + گردش حساب)

---

## بخش ۷ (مرحله ۷): احکام کارگزینی — تکمیل شد ✅

- [x] Migration 031 — جدول `decrees` (احکام کارگزینی)
- [x] Migration 032 — جدول `decree_items` + Seed (۸ نوع حکم × آیتم‌ها)
- [x] Migration 033 — جدول `signatures` + `sms_log`
- [x] API: `GET/POST/DELETE /api/employees/:id/decrees`
- [x] API: `GET /api/decree-items?decree_type=...`
- [x] API: `POST /api/signatures/send-otp` (mock SMS)
- [x] API: `POST /api/signatures/verify`
- [x] تب «احکام کارگزینی» توی `employee-profile.html`
- [x] Modal افزودن/ویرایش حکم
- [x] آیتم‌های حقوق داینامیک بر اساس نوع حکم
- [x] Mock SMS + امضای دیجیتال

### اصلاحات:
- [x] تب «اطلاعات پایه» توی پرونده پرسنلی قابل ویرایش شد
- [x] API `PUT /api/persons/:id` آپدیت شد (first_name, last_name, mother_name, birth_place, gender, nationality)

### ۸ نوع حکم:
رسمی، رسمی کارگری، پیمانی، شرکتی، کارمعین، مشاغل کارگری، موقت، تسری

---

## بخش ۷ (مرحله ۴ + ۵ + ۶): محاسبات حقوق، کسورات، حضور و غیاب — تکمیل شد ✅

### مرحله ۴ — محاسبات حقوق:
- [x] Migration 034 — `payroll_items` + `payroll_settings`
- [x] Seed ۳۱ آیتم حقوق + ۱۶ تنظیم
- [x] API: `GET/PUT /api/payroll-settings` + `payroll-items`
- [x] صفحه `payroll-settings.html` با ۶ تب
- [x] نمایش فارسی اعداد (ریال با کاما، درصد، عدد)
- [x] ویرایش مشمولیت‌های آیتم‌های حقوق
- [x] Migration 035 — `payroll_calculations`
- [x] API: `payroll-calculations` (calculate, list, view, delete)
- [x] API: `employees/list` (کارکنان با حکم)
- [x] صفحه `payroll-calculate.html`
- [x] محاسبه خودکار: بیمه (۷٪ کارمند، ۲۳٪ کارفرما) + مالیات
- [x] فیش حقوقی با چاپ + تاریخچه محاسبات
- [x] فونت `Sahel` برای اعداد فارسی

### مرحله ۵ — کسورات:
- [x] Migration 036 — `deduction_types` + `loans` + `loan_payments` + `employee_deductions`
- [x] Seed ۸ نوع کسور
- [x] صفحه `employee-deductions.html`
- [x] مدیریت وام + اقساط + کسورات غیر وام

### مرحله ۶ — حضور و غیاب:
- [x] Migration 037 — جدول `attendance`
- [x] API: `GET/POST/PUT/DELETE /api/attendance`
- [x] API: تأیید مدیر/شهردار
- [x] صفحه `attendance.html` با جستجوی کارمند
- [x] ورود اطلاعات: کارکرد، غیبت، مرخصی، اضافه‌کاری، تعطیل‌کاری، نوبت‌کاری، مأموریت
- [x] اتصال به محاسبه حقوق (اضافه‌کاری، مأموریت، کسور غیبت)
- [x] Migration 038 — `cancelled_at`, `cancelled_by`, `cancelled_reason`
- [x] API `POST /cancel` با بازگشت اقساط وام
- [x] `DELETE` فقط admin + cancelled

### اصلاحات:
- [x] فونت `Sahel` برای اعداد فارسی
- [x] یکدست‌سازی `code` (فارسی)
- [x] حذف محاسبات تستی قدیمی

---

## بخش ۸ (مرحله ۲): نقش‌ها و Permission — تکمیل شد ✅

### ساختار:
- `role_permissions`: (role, permission_key, granted) — پیش‌فرض per role
- `user_permissions`: (user_id, permission_key, granted, granted_by) — override per user

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

### منطق:
1. **admin** همیشه دسترسی داره (بدون چک)
2. **user_permissions** (override) → اگه وجود داشت، اعمال میشه
3. **role_permissions** (پیش‌فرض) → اگه وجود داشت، اعمال میشه
4. **هیچکدام** → دسترسی نمیده

### کارهای انجام‌شده:
- [x] Migration 022 — `role_permissions` + `user_permissions`
- [x] Seed پیش‌فرض برای ۶ نقش (admin, manager, expert, viewer, province, ministry)
- [x] API: `GET /api/permissions/keys` (لیست کلیدها گروه‌بندی‌شده)
- [x] API: `GET/POST /api/users/:id/permissions`
- [x] API: `GET /api/me/permissions` (permission های کاربر فعلی)
- [x] صفحه `permissions.html` (UI پیش‌فرض/اجازه/عدم اجازه)
- [x] اتصال `sidebar.js` به Permission (فیلتر منو)
- [x] اتصال `dashboard.html` به Permission (فیلتر کارت‌ها)
- [x] اتصال `users.html` به Permission

### کارهای باقی‌مانده:
- [ ] چک Permission در بقیه APIها (فقط role چک میشه نه permission)
- [ ] چک Permission در بقیه صفحات

---

## ساختار `base_data`:
- `section`: 'organization', 'economic', 'strategic', 'operational', 'accounting', 'budget_type', 'goods', 'decree_type'
- `type`: انواع مختلف
- `extra_data`: JSON string

### ساختار سازمانی (base_data section='organization'):
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

---

## ساختار `persons`:
- `person_type`: 'employee', 'citizen', 'foreigner', 'legal'
- `code`, `parent_id`, `level`, `level_name`
- اطلاعات هویتی، تماس، استخدامی، بانکی
- `national_id_verified`, `notes`, `extra_data`, `is_active`
- `user_id` (لینک به کاربر، اگه سطح ۴ باشه)

---

## قوانین کدینگ بخش ۷ (اشخاص):
- **کدینگ ۱۰ رقمی:** `[۱ رقم گروه][۳ رقم زیرگروه][۳ رقم دسته][۳ رقم شخص]`
- **سطح ۱:** `X000000000`
- **سطح ۲:** `XYYY000000`
- **سطح ۳:** `XYYYZZZ000`
- **سطح ۴:** `XYYYZZZWWW`

---

## اصلاحات اخیر (1405/07/16):

### رفع باگ `persons.html`:
- [x] اضافه شدن دکمه «📁 مشاهده پرونده» به Context Menu (فقط برای کارکنان سطح ۴)
- [x] رفع باگ ساختار HTML توی modal (دکمه‌های modal بیرون می‌افتادن)
- [x] تبدیل خودکار اعداد فارسی → انگلیسی برای کد ملی، موبایل، کد پستی

### باگ‌های شناسایی‌شده (باید رفع بشن):
- [ ] `/api/reports/*` — از جدول‌های `organizations` و `economic_classifications` استفاده می‌کنه (باید `base_data` باشه)
- [ ] `POST /api/persons` — بلاک کد ناقص توی خط ~370 (`if (!authHeader)`)
- [ ] `/api/organizations` — به جدول ناموجود `organizations` اشاره می‌کنه
- [ ] `JWT_SECRET` توی `wrangler.toml` (باید Secret بشه)
- [ ] امضای توکن با HMAC (به‌جای SHA-256 ساده)
- [ ] `bcryptjs` و `jsonwebtoken` بلااستفاده توی dependencies
- [ ] `schema1.json` و `schema2.json` (مرده)
- [ ] محاسبه مالیات فقط پله اول (باید پله‌ای کامل بشه)
- [ ] `index.js` خیلی بزرگ (~5000 خط)
- [ ] دو بار تعریف `renderBreadcrumb` توی `sidebar.js`
- [ ] فایل‌های `-old.html` (organizations, economic-classifications)
- [ ] تکرار `common.js` و `sidebar.js` توی `municipality-info.html`
- [ ] `deleteCalculation` دو بار توی `payroll-calculate.html`
- [ ] `renderOperationalOptions` بلااستفاده در `employee-profile.html`
- [ ] `getSettingHint` بلااستفاده در `payroll-settings.html`

---

## کارهای بعدی (اولویت‌دار):
- [ ] بخش ۷: استعلام کد ملی (mock)
- [ ] بخش ۷: گزارش‌گیری از اشخاص
- [ ] بخش ۶: فهرست بهای کالا و خدمات
- [ ] بخش ۶: استهلاک دارایی‌های ثابت
- [ ] بخش ۶: احکام حقوقی
- [ ] اتصال کالا/خدمات به `budget-proposals.html`
- [ ] تدوین و تصویب بودجه
- [ ] بخش ۷ (مرحله ۸): auto-generate بودجه
- [ ] بخش ۷ (مرحله ۹): شهروند + خارج شهروند (حساب + گردش حساب)

---

## محیط توسعه:
- **Backend:** Cloudflare Workers
- **Database:** Cloudflare D1
- **Static Assets:** `./public` directory
- **Local Dev:** `wrangler dev`
- **Deploy:** `wrangler deploy`
- **Repo:** https://github.com/baaqiwaasherbaaqi-eng/budget-system

## آدرس‌ها:
- **Production:** https://budget-system.baaqiwaasherbaaqi.workers.dev
- **Local:** http://localhost:8787