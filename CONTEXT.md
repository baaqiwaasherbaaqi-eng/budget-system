# پروژه: سامانه بودجه شهرداری

## تاریخ آخرین آپدیت: 1405/07/29

## وضعیت: بخش ۷ (اشخاص) — تکمیل شد ✅ + بخش ۸ (Permission) — تکمیل شد ✅ + ایمپورت اکسل عملیاتی — تکمیل شد ✅

## کارهای انجام شده:
- [x] فاز ۰ تا ۱۸
- [x] بازطراحی بخش ۲ (طبقه‌بندی سازمانی)
- [x] بازطراحی بخش ۴ (طبقه‌بندی اقتصادی)
- [x] بخش ۳: برنامه راهبردی
- [x] بخش ۴: طبقه‌بندی عملیاتی
- [x] بخش ۴: نوع اعتبار + نوع مصرف
- [x] بخش ۵: حسابداری
- [x] بخش ۶: کدینگ کالا و خدمات
- [x] بخش ۷: اشخاص (کارکنان، حقیقی، حقوقی، تفصیلی شناور)
- [x] بخش ۸: سیستم Permission سفارشی
- [x] جدول `base_data` + API کامل + UI درختی/جدولی
- [x] جدول `persons` + API کامل + UI + فرم هوشمند
- [x] جدول `role_permissions` و `user_permissions` (Migration 022)
- [x] APIهای Permission
- [x] صفحه `permissions.html` با UI پیشرفته
- [x] اتصال `sidebar.js` به Permission
- [x] اتصال `dashboard.html` به Permission
- [x] اتصال `users.html` به Permission
- [x] Top Bar مشترک
- [x] Dark Mode مشترک (`dark.css`)
- [x] یکدست‌سازی عرض صفحات (`max-width: 1400px`)
- [x] `tree.css` مشترک
- [x] `table.css` مشترک
- [x] `person_organizations` و `entity_relations` (آماده برای آینده)
- [x] Footer مشترک
- [x] Breadcrumb مشترک
- [x] صفحه `goods.html` با `extra_data`
- [x] صفحه `persons.html` با ۴ تب + DatePicker شمسی
- [x] دسترسی `manager` به «سال مالی» و «لاگ سیستم»
- [x] بهبود ظاهر صفحه لاگین
- [x] حذف `status` از کارت‌های `base-info.html`
- [x] تمیزکاری CSSهای تکراری
- [x] دکمه بازگشت در top-bar
- [x] **ایمپورت اکسل عملیاتی (۳ شیت) — Migration 043**
- [x] **ایمپورت اکسل فعالیت‌ها (زیر خدمت‌ها)**
- [x] **رفع باگ `Too many API requests` با `DB.batch()`**
- [x] **رفع تداخل کد طرح/خدمت با کلید `type:code`**
- [x] **رفع باگ context menu (بیرون زدن از پایین صفحه)**
- [x] **افزودن `level_name` dropdown به `organizations.html` (معاونت/سازمان)**

---

## 🔥 بخش جدید: ایمپورت اکسل عملیاتی

### ۳ شیت اصلی:
1. **«عملیاتی (تملک سرمایه ای)»** → مأموریت + برنامه + طرح + پروژه سرمایه‌ای
2. **«عملیاتی (تملک مالی)»** → مأموریت + برنامه + طرح + پروژه مالی
3. **«عملیاتی (خدمت)»** → مأموریت + برنامه + خدمت + فعالیت

### فایل نمونه:
- `import-template-All-NA.xlsx` — همه اطلاعات پایه (عملیاتی + اقتصادی)
- `import-template-A.xlsx` — فقط فعالیت‌ها (زیر خدمت‌ها)

### Endpointها:
- `POST /api/base-data/import-operational-excel` — ۳ شیت عملیاتی
- `POST /api/base-data/import-activities-excel` — فقط فعالیت‌ها

### کلید اصلی:
- `insertedNodes` با کلید `type:code` (مثلاً `plan:10101` و `service:10101` جدا)
- `DB.batch()` هر ۵۰ statement
- `getNextCode` در حافظه (نه کوئری تکراری)
- `json_extract(extra_data, '$.original_excel_code')` برای پیدا کردن والد

---

## 📁 صفحات موجود:
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

---

## کاربران پیش‌فرض:
- admin / Admin123!

## نقش‌ها:
- admin, manager, expert, viewer, province, ministry

---

## بخش ۷: اشخاص (Persons)

### ساختار کدینگ (۱۰ رقمی):
- `[۱ رقم گروه][۳ رقم زیرگروه][۳ رقم دسته][۳ رقم شخص]`
- **prefix ها:** 1=کارکنان، 2=شهروندان، 3=اشخاص حقوقی، 4=خارج شهروندان
- **person_type:** employee, citizen, foreigner, legal

### مراحل انجام‌شده:
- [x] Migration 023 — `persons` جدید با کد ملی
- [x] Migration 024 — `employees`
- [x] Migration 025 — Seed ۸ نوع حکم
- [x] Migration 026 — Seed ۱۷ سازمان نمونه
- [x] Migration 027 — `unit_start_shamsi`, `personnel_code`
- [x] Migration 028 — `employee_tasks`
- [x] Migration 029 — طبقه‌بندی عملیاتی
- [x] Migration 030 — `dependents`
- [x] Migration 031 — `decrees`
- [x] Migration 032 — `decree_items` (Seed آیتم‌های ۸ نوع حکم)
- [x] Migration 033 — `signatures` + `sms_log`
- [x] Migration 034 — `payroll_items` + `payroll_settings`
- [x] Migration 035 — `payroll_calculations`
- [x] Migration 036 — `deduction_types` + `loans` + `loan_payments` + `employee_deductions`
- [x] Migration 037 — `attendance`
- [x] Migration 038 — `cancelled_at`, `cancelled_by`, `cancelled_reason`
- [x] Migration 039 — `council_members`
- [x] Migration 040 — `user_id` + `user_creation_log`
- [x] Migration 041 — `login_otp` + `mobile` در `users`
- [x] Migration 042 — `org_positions` + `position_id` در `person_organizations`

### مراحل باقی‌مانده:
- [ ] استعلام کد ملی (mock)
- [ ] گزارش‌گیری از اشخاص
- [ ] افراد تحت تکفل (تکمیل‌تر)
- [ ] محاسبه بیمه/مالیات (پله‌ای کامل)
- [ ] امضای دیجیتال (mock SMS) — تکمیل‌تر
- [ ] auto-generate بودجه
- [ ] شهروند + خارج شهروند (حساب + گردش حساب)

---

## بخش ۸: Permission

### کلیدها:
- `base_info.view`, `base_info.edit`
- `persons.view`, `persons.add`, `persons.edit`, `persons.delete`
- `budget.view`, `budget.add`, `budget.submit`, `budget.approve_manager`, `budget.approve_finance`, `budget.approve_final`
- `allocations.view`, `allocations.add`
- `executions.view`, `executions.add`
- `reports.view`, `reports.export`, `reports.advanced`, `reports.tafriq`
- `users.view`, `users.add`, `users.edit`, `users.delete`, `users.permissions`
- `fiscal_years.view`, `fiscal_years.manage`
- `audit_log.view`
- `municipality_info.view`, `municipality_info.edit`

### منطق:
1. **admin** همیشه دسترسی داره
2. **user_permissions** (override) → اگه وجود داشت
3. **role_permissions** (پیش‌فرض)
4. **هیچکدام** → دسترسی نمیده

---

## 🐛 باگ‌های شناسایی‌شده (باید رفع بشن):

- [ ] `/api/reports/*` — از `organizations` و `economic_classifications` استفاده می‌کنه (باید `base_data` باشه)
- [ ] `POST /api/persons` — بلاک کد ناقص توی خط ~370 (`if (!authHeader)`)
- [ ] `/api/organizations` — به جدول ناموجود `organizations` اشاره می‌کنه
- [ ] `JWT_SECRET` توی `wrangler.toml` (باید Secret بشه)
- [ ] امضای توکن با HMAC (به‌جای SHA-256 ساده)
- [ ] `bcryptjs` و `jsonwebtoken` بلااستفاده توی dependencies
- [ ] `schema1.json` و `schema2.json` (مرده)
- [ ] محاسبه مالیات فقط پله اول (باید پله‌ای کامل بشه)
- [ ] `index.js` خیلی بزرگ (~۵۰۰۰ خط)
- [ ] دو بار تعریف `renderBreadcrumb` توی `sidebar.js` (نسخه اول حذف بشه)
- [ ] فایل‌های `-old.html` (organizations, economic-classifications)
- [ ] تکرار `common.js` و `sidebar.js` توی `municipality-info.html`
- [ ] `deleteCalculation` دو بار توی `payroll-calculate.html`
- [ ] `renderOperationalOptions` بلااستفاده در `employee-profile.html`
- [ ] `getSettingHint` بلااستفاده در `payroll-settings.html`
- [ ] `submitImportData` سه بار توی `economic-classifications.html`
- [ ] `normalizeNumber` بلااستفاده در `economic-classifications.html`
- [ ] `setInterval(applyToAll, 1000)` توی `sidebar.js` (سنگین)
- [ ] `loadUserPermissions` بدون cache invalidation
- [ ] `login.html` — چک `OTP_ONLY` توی `loginWithPassword`
- [ ] `base-info.html` — `common.js`/`sidebar.js` تکراری
- [ ] `dashboard.html` — `common.js`/`sidebar.js` تکراری
- [ ] `allocations.html` — `item.name` → `item.title`
- [ ] `reports.html` — `try/catch`
- [ ] `advanced-reports.html` — `event` global
- [ ] `organizations.html` — `renderTable` از `item.level_name` استفاده می‌کنه (OK)
- [ ] `organizations.html` — `getLevelName` fallback فقط ۴ عضو (OK)
- [ ] Migration 043 — رفع `CHECK` روی `budget_proposals.status` (اضافه کردن `manager_approved`, `finance_approved`)
- [ ] Migration 044 — تغییر `decree_type` از عدد به رشته (`official`, `official_worker`, ...)
- [ ] Migration 045 — `project` → `project_capital`/`project_financial` توی `base_data`
- [ ] Migration 046 — `UNIQUE` + `is_primary DEFAULT 0` برای `org_positions`
- [ ] Migration 047 — UPSERT برای `attendance`

---

## کارهای بعدی (اولویت‌دار):
- [ ] Level Pills برای `organizations.html` (به‌جای `<select>`)
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
- **Domain:** https://budget-system.dadehpajohan.ir

---

## ساختار `base_data`:
- `section`: 'organization', 'economic', 'strategic', 'operational', 'accounting', 'budget_type', 'goods', 'decree_type'
- `type`: انواع مختلف
- `extra_data`: JSON string (شامل `original_excel_code` برای ردیف‌های ایمپورت‌شده)

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

**توجه:** `level_name` ممکنه «معاونت»، «سازمان»، «اداره»، «واحد» باشه (کاربر انتخاب می‌کنه).

---

## ساختار `persons`:
- `person_type`: 'employee', 'citizen', 'foreigner', 'legal'
- `code`, `parent_id`, `level`, `level_name`
- اطلاعات هویتی، تماس، استخدامی، بانکی
- `national_id_verified`, `notes`, `extra_data`, `is_active`
- `user_id` (لینک به کاربر)

---

## قوانین کدینگ بخش ۷ (اشخاص):
- **کدینگ ۱۰ رقمی:** `[۱ رقم گروه][۳ رقم زیرگروه][۳ رقم دسته][۳ رقم شخص]`
- **سطح ۱:** `X000000000`
- **سطح ۲:** `XYYY000000`
- **سطح ۳:** `XYYYZZZ000`
- **سطح ۴:** `XYYYZZZWWW`

---

## قوانین کدینگ عملیاتی:
- **مأموریت (سطح ۰):** `001`, `002`, ... (۳ رقم)
- **برنامه (سطح ۱):** والد + `001` (۳ رقم) → `001001`
- **خدمت (سطح ۲):** والد + `00001` (۵ رقم) → `00100100001`
- **طرح (سطح ۲):** والد + `50000` (۵ رقم) → `00100150000`
- **فعالیت (سطح ۳):** والد + `001` (۳ رقم) → `00100100001001`
- **پروژه سرمایه‌ای (سطح ۳):** والد + `001` (۳ رقم) → `00100150000001`
- **پروژه مالی (سطح ۳):** والد + `001` (۳ رقم) → `00100150000001` (زیر طرح)

---

## Migration های اجراشده روی ریموت:
- 001 تا 042 (همه اجرا شدن)
- **042 روی ریموت اجرا شد (با `--remote`)**

---

## نکات مهم برای توسعه:
1. **`insertedNodes`** با کلید `type:code` (مثلاً `plan:10101` و `service:10101` جدا)
2. **`DB.batch()`** برای INSERTهای زیاد (هر ۵۰ statement)
3. **`getNextCode`** در حافظه (نه کوئری تکراری)
4. **`json_extract`** یا `LIKE` برای پیدا کردن والد از `extra_data`
5. **`fillLevelNames`** برای پر کردن dropdown نوع سازمان
6. **`level_name`** از dropdown (نه `getLevelName`)
7. **`level`** از `parent.level + 1` (نه از `level_name`)
8. **`import-template-All-NA.xlsx`** برای همه اطلاعات پایه
9. **`import-template-A.xlsx`** فقط برای فعالیت‌ها
10. **`--remote`** برای اجرای migration روی ریموت

---

## آمار فعلی (ریموت):
- **mission:** 6
- **program:** 32
- **plan:** 138
- **service:** 133
- **project_capital:** 348
- **project_financial:** 98
- **جمع کل:** 755