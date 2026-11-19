# پروژه: سامانه بودجه شهرداری

## تاریخ آخرین آپدیت: 1405/08/05

## وضعیت: بخش ۷ (اشخاص) ✅ + بخش ۸ (Permission) ✅ + ایمپورت اکسل ✅ + Drag & Drop ✅ + جستجو و فیلتر سطح ✅ + Ctrl+S ✅ + نرخ‌های اقتصادی ✅ + عمر مستقل لاستیک و باتری ✅

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
- [x] **Drag & Drop برای مرتب‌سازی ردیف‌ها (فقط `sort_order`):**
  - [x] `organizations.html`
  - [x] `economic-classifications.html`
  - [x] `operational-classifications.html`
  - [x] `accounting.html`
  - [x] `goods.html`
  - [x] `strategic-plan.html`
- [x] **Loading Overlay برای ایمپورت اکسل (عملیاتی + اقتصادی)**
- [x] **اصلاح ساختار اقتصادی (001 هزینه / 002 تملک سرمایه‌ای / 003 تملک مالی)**
- [x] **حذف Drag & Drop از `persons.html`**
- [x] **کامپوننت مشترک جستجو و فیلتر سطح (`base-data-search.js` + `base-data-search.css`)**
  - [x] `organizations.html` — ۵ سطح (حوزه/معاونت/سازمان/اداره/واحد) ✅
  - [x] `economic-classifications.html` — ۴/۵ سطح بر اساس تب (منابع/مصارف) ✅
  - [x] `operational-classifications.html` — ۶ سطح بر اساس `type` (مأموریت/برنامه/خدمت/طرح/فعالیت/پروژه) ✅
  - [x] `accounting.html` — ۵ سطح (گروه/سرفصل/کل/معین/تفصیلی) ✅
  - [x] `strategic-plan.html` — ۴ سطح (چشم‌انداز/راهبرد/سیاست اجرایی/زیرسیاست) ✅
  - [x] `goods.html` — ۴ سطح (گروه اصلی/گروه فرعی/زیرگروه/کالا-خدمت) ✅
  - [x] `budget-types.html` — فقط سرچ (بدون Pills) ✅
- [x] **کلید میانبر Ctrl+S / Cmd+S + Ctrl+Enter برای ذخیره فرم‌ها** (`common.js`)
  - [x] Chrome / Edge / Yandex — `Ctrl+S`
  - [x] Firefox — `Ctrl+Enter`
  - [x] `event.preventDefault()` برای جلوگیری از Save Page مرورگر
  - [x] پیدا کردن خودکار دکمه ذخیره (مدال / تب فعال / دکمه مرئی)
  - [x] Debounce 800ms برای جلوگیری از کلیک تکراری
- [x] **رفع باگ `sort_order` در `accounting.html` و `operational-classifications.html`**
  - [x] `sortRecursive` با `sort_order` (نه فقط `code`)
  - [x] جابجایی ردیف‌ها الان درست کار می‌کنه
- [x] **رفع باگ `toggleExpand` در `operational-classifications.html`**
  - [x] حفظ فیلتر فعلی بعد از باز/بسته کردن شاخه
- [x] **حذف `localStorage` از `base-data-search.js`**
  - [x] فیلتر/سرچ هر بار صفحه باز می‌شه، ری‌ست می‌شه
  - [x] `currentFilteredData` / `currentIsFiltered` برای حفظ state درون‌session
- [x] **محدودیت دسترسی کاربر عادی (viewer)**
  - [x] `base-info.html` → حذف «مشخصات شهرداری» برای viewer
  - [x] `sidebar.js` → «پرونده من» (به جای «اشخاص») برای viewer
  - [x] `persons.html` → redirect کاربر عادی به `employee-profile.html?my=1`
  - [x] `employee-profile.html` → چک دسترسی (فقط پرونده خودش)
  - [x] اطلاعات پایه → ۵ فیلد readonly (کد ملی، شماره شناسنامه، نام، نام خانوادگی، موبایل)
  - [x] اطلاعات استخدامی → فقط «شرح تجربه» قابل ویرایش
  - [x] افراد تحت تکفل → `approval_status` (pending/approved/rejected) + تایید مدیر
  - [x] احکام کارگزینی → فقط نمایش + چاپ (بدون افزودن/ویرایش/حذف/امضا)
  - [x] واحد سازمانی → فقط نمایش (بدون افزودن/ویرایش/حذف/ساخت کاربر)
- [x] **API جدید `/api/me/person`** (شخص مرتبط با کاربر فعلی)
- [x] **API جدید `PUT /api/dependents/:id/approve`** (تایید/رد توسط مدیر)
- [x] **آپدیت `POST /api/employees/:id/dependents`** (approval_status برای کاربر عادی)
- [x] **رفع باگ `persons.html` روی ریموت** (Migration 048 روی ریموت اجرا شد)
- [x] **Migration 050** — حذف `persons.view` از `viewer`
- [x] **فلوچارت سازمانی (d3-org-chart):**
  - [x] جایگزینی `vis.js` با `d3-org-chart` (کاملاً رایگان و متن‌باز)
  - [x] نمایش پوزیشن‌ها داخل باکس سازمان (با کلیک روی هدر باز/بسته می‌شه)
  - [x] ریشه مجازی (آیکون 🏛️) برای جلوگیری از خطای `multiple roots`
  - [x] فارسی‌سازی اعداد (تعداد زیرمجموعه‌ها + کدها)
  - [x] افزایش فاصله باکس‌ها (عمودی و افقی)
  - [x] پررنگ‌تر کردن خطوط اتصال (`#9ca3af` با ضخامت `2.5`)
  - [x] دکمه‌های زوم و نمایش کامل
  - [x] فایل‌های `d3.min.js`, `d3-org-chart@3.js`, `d3-flextree.js` در `public/`
- [x] **Migration 051** — اصلاح `level` در goods بر اساس طول code
- [x] **Migration 052** — واحدهای اندازه‌گیری (`section='goods_unit'`)
- [x] **Migration 053** — Seed واحدهای اندازه‌گیری (`section='unit'`) — ⚠️ نیاز به یکدست‌سازی با 052
- [x] **Migration 054 — نرخ‌های کلان اقتصادی** ✅
  - [x] جدول `economic_rates` (۶ نرخ)
  - [x] نرخ تورم
  - [x] قیمت بنزین + درصد رشد سالانه
  - [x] قیمت گازوئیل + درصد رشد سالانه
  - [x] درصد رشد حقوق
  - [x] `fiscal_year_id` اختیاری (NULL = نرخ جاری)
  - [x] API: `GET /api/economic-rates` + `POST /api/economic-rates` (bulk)
  - [x] صفحه `economic-rates.html` با ۶ کارت + انتخاب سال مالی
  - [x] کارت جدید در `base-info.html`
  - [x] آیتم منو در `sidebar.js` + breadcrumb + top-bar title
  - [x] دسترسی `admin`, `manager` (مشاهده + ویرایش)
  - [x] آماده برای اتصال به محاسبات بودجه (فاز بعد)
- [x] **Migration 057 — ارتباط طبقه‌بندی اقتصادی (`economic_links`)** ✅
  - [x] جدول `economic_links` (economic_id, link_type, target_id)
  - [x] `link_type`: goods / organization / decree_type
  - [x] API: `GET/POST/DELETE /api/economic-links` + `GET /api/economic-links/summary`
  - [x] Denormalized: `target_code`, `target_title`
- [x] **Migration 055 — جزئیات کالا (`goods_details`)** ✅
  - [x] جدول `goods_details` (asset_number, purchase_date, storage, price, is_vehicle, service standards, fuel standard, custom_fields, ...)
  - [x] جدول `goods_persons` (اشخاص مربوط به کالا)
- [x] **Migration 058 — عمر مستقل لاستیک‌ها و باتری‌ها** ✅ (جدید)
  - [x] جدول `goods_tires` (عمر مستقل هر لاستیک)
  - [x] جدول `goods_batteries` (عمر مستقل هر باتری)
  - [x] `ALTER TABLE goods_details` → افزودن `current_km` + `current_km_updated_at_shamsi`
  - [x] محاسبه وضعیت سایش بر اساس کیلومتر و تاریخ
  - [x] هشدار 🟢 سالم / 🟡 نزدیک تعویض / 🔴 نیاز به تعویض
  - [x] دکمه «🔁 تعویض شد» → انتقال به تاریخچه (`is_active=0`)
  - [x] حفظ تاریخچه تعویض‌شده‌ها (برای حسابرسی و ردیابی هزینه)
  - [x] API: `GET/POST /api/goods/:id/tires`
  - [x] API: `GET/POST /api/goods/:id/batteries`
  - [x] `GET /api/goods/:id/details` حالا `tires` و `batteries` را هم برمی‌گرداند
  - [x] UI: تب «مشخصات خودرو» → بخش لاستیک‌ها + باتری‌ها + کیلومتر فعلی
  - [x] `goods-details.js` → توابع کامل رندر/ویرایش/ذخیره لاستیک و باتری

## 🔥 بخش جدید: نرخ‌های اقتصادی (economic_rates)

### جدول: `economic_rates`
| ستون | توضیح |
|---|---|
| `fiscal_year_id` | اختیاری — NULL = نرخ جاری |
| `rate_key` | inflation, gasoline_price, gasoline_growth, diesel_price, diesel_growth, salary_growth |
| `rate_value` | مقدار (عدد) |
| `rate_type` | percent / amount |
| `unit` | ٪ / ریال/لیتر |
| `title`, `description` | عنوان و توضیح نمایشی |
| `sort_order`, `is_active` | ترتیب و وضعیت |

**کلید یکتا:** `(fiscal_year_id, rate_key)`

### ۶ نرخ تعریف‌شده:
1. `inflation` — نرخ تورم سالانه (٪)
2. `gasoline_price` — قیمت بنزین (ریال/لیتر)
3. `gasoline_growth` — درصد رشد سالانه بنزین (٪)
4. `diesel_price` — قیمت گازوئیل (ریال/لیتر)
5. `diesel_growth` — درصد رشد سالانه گازوئیل (٪)
6. `salary_growth` — درصد رشد حقوق (٪)

### APIها:
- `GET /api/economic-rates?fiscal_year_id=X` — لیست نرخ‌ها (اگه `fiscal_year_id` داده نشه، نرخ جاری برمی‌گرده)
- `POST /api/economic-rates` — ذخیره bulk (جایگزینی کامل برای سال انتخاب‌شده)
  - Body: `{ fiscal_year_id, rates: [...] }`
  - دسترسی: `admin`, `manager`

### فایل‌ها:
- `migrations/054_economic_rates.sql`
- `public/economic-rates.html`
- `public/base-info.html` (کارت جدید)
- `public/sidebar.js` (منو + breadcrumb + top-bar)

### اتصال به محاسبات (فاز بعد):
این نرخ‌ها بعداً در محاسبات بودجه استفاده می‌شن:
- **تورم** → پیش‌بینی افزایش قیمت کالا/خدمات در بودجه سنوات بعد
- **قیمت سوخت** → محاسبه هزینه سوخت وسایل نقلیه
- **رشد حقوق** → پیش‌بینی هزینه حقوق و دستمزد

---

## 🔥 بخش جدید: ارتباط طبقه‌بندی اقتصادی (economic_links)

### جدول: `economic_links`
| ستون | توضیح |
|---|---|
| `economic_id` | ردیف اقتصادی (مرکز) — FK به `base_data` |
| `link_type` | goods / organization / decree_type |
| `target_id` | شناسه مقصد در `base_data` |
| `target_code`, `target_title` | denormalized برای نمایش سریع |
| `sort_order`, `is_active` | ترتیب و وضعیت |

**کلید یکتا:** `(economic_id, link_type, target_id)`

### منطق:
- هر ردیف اقتصادی می‌تونه به **کالا/خدمات**، **سازمان**، و **نوع حکم** وصل بشه
- همه اجباری نیستن — ممکنه ردیف اقتصادی به هیچی وصل نباشه

### APIها:
- `GET /api/economic-links?economic_id=X&link_type=Y` — لیست ارتباطات
- `POST /api/economic-links` — افزودن bulk (`{ economic_id, link_type, target_ids: [...] }`)
- `DELETE /api/economic-links/:id` — حذف یک ارتباط
- `GET /api/economic-links/summary` — خلاصه تعداد ارتباطات هر ردیف اقتصادی (برای نمایش در جدول)

### فایل‌ها:
- `migrations/057_economic_links.sql`
- `index.js` (APIها)

---

## 🔥 بخش جدید: جزئیات کالا (goods_details) + اشخاص مربوط (goods_persons)

### جدول: `goods_details`
| ستون | توضیح |
|---|---|
| `base_data_id` | FK به `base_data` (سطح ۴ کالا) |
| `asset_number` | شماره اموال |
| `purchase_date_shamsi`, `operation_date_shamsi` | تاریخ خرید / بهره‌برداری |
| `storage_location` | محل نگهداری |
| `purchase_price` | قیمت خرید (ریال) |
| `is_vehicle` | خودرو است؟ (نمایش تب مشخصات خودرو) |
| `tire_count`, `tire_basis` | (قدیمی — جایگزین شد با `goods_tires`) |
| `battery_count`, `battery_last_replace_shamsi` | (قدیمی — جایگزین شد با `goods_batteries`) |
| `current_km`, `current_km_updated_at_shamsi` | کیلومتر فعلی خودرو (برای محاسبه عمر لاستیک/باتری) |
| `service_vehicle_standard` | استاندارد سرویس خودرو (JSON: basis, km_value, ...) |
| `service_oil_filter_standard` | استاندارد سرویس فیلتر روغن |
| `service_air_filter_standard` | استاندارد سرویس فیلتر هوا |
| `service_ac_filter_standard` | استاندارد سرویس فیلتر کولر |
| `service_antifreeze_standard` | استاندارد سرویس ضدیخ |
| `service_timing_belt_standard` | استاندارد سرویس تسمه تایم |
| `fuel_standard` | استاندارد سوخت‌گیری (JSON) |
| `custom_fields` | فیلدهای سفارشی (JSON array) |
| `vehicle_custom_fields` | فیلدهای سفارشی خودرو (JSON array) |
| `notes` | یادداشت |

### جدول: `goods_persons`
| ستون | توضیح |
|---|---|
| `base_data_id` | FK به `base_data` (کالا) |
| `person_id` | FK به `persons` |
| `task_id` | FK اختیاری به `employee_tasks` (وظیفه مرتبط) |
| `relation_type` | owner / user / responsible / custodian / other |
| `notes` | یادداشت |

### APIها:
- `GET /api/goods/:id/details` — جزئیات + اشخاص + لاستیک‌ها + باتری‌ها
- `POST /api/goods/:id/details` — ذخیره جزئیات (upsert)
- `POST /api/goods/:id/persons` — افزودن شخص
- `DELETE /api/goods/persons/:id` — حذف شخص

### فایل‌ها:
- `migrations/055_goods_details.sql`
- `index.js` (APIها)
- `public/goods.html` (تب‌های مودال: اطلاعات پایه / جزئیات / مشخصات خودرو / اشخاص مربوط)
- `public/goods-details.js` (منطق)
- `public/goods-details.css` (استایل)

---

## 🔥 بخش جدید: عمر مستقل لاستیک‌ها و باتری‌ها (goods_tires + goods_batteries)

### منطق:
- هر لاستیک و هر باتری **ردیف عمر مستقل** دارد
- هر ردیف می‌تونه بر اساس **کیلومتر** یا **تاریخ** (یا هر دو) عمر مفید داشته باشه
- هر کدوم زودتر به آستانه برسه، هشدار می‌ده
- لاستیک/باتری تعویض‌شده از لیست فعال حذف نمی‌شه، بلکه به **تاریخچه** می‌ره (`is_active=0`)
- تاریخچه برای **حسابرسی و ردیابی هزینه** حفظ می‌شه

### جدول: `goods_tires`
| ستون | توضیح |
|---|---|
| `base_data_id` | FK به `base_data` (کالا) |
| `tire_number` | شماره لاستیک (۱، ۲، ۳...) |
| `position` | front_left / front_right / rear_left / rear_right / spare |
| `brand`, `size` | برند و سایز |
| `install_date_shamsi`, `install_km` | تاریخ و کیلومتر نصب |
| `expected_life_km`, `expected_life_months` | عمر مفید (کیلومتر / ماه) |
| `tolerance_km`, `tolerance_months` | تلرانس |
| `removed_date_shamsi`, `removed_km`, `removal_reason` | اطلاعات تعویض |
| `is_active` | 1 = در حال استفاده، 0 = تعویض شده |
| `notes`, `sort_order` | یادداشت و ترتیب |

### جدول: `goods_batteries`
مشابه `goods_tires` با فیلدهای اضافی:
- `brand`, `model`, `capacity_amp` (آمپر)
- `warranty_until_shamsi` (پایان گارانتی)

### محاسبه وضعیت سایش (مشترک):
```javascript
calcWearStatus(item, currentKm):
  - چک کیلومتر: used = currentKm - install_km
  - چک تاریخ: used = monthsSince(install_date_shamsi)
  - اگر هر کدام >= limit + tolerance → 🔴 نیاز به تعویض
  - اگر هر کدام >= limit - tolerance → 🟡 نزدیک تعویض
  - در غیر این صورت → 🟢 سالم