# پروژه: سامانه بودجه شهرداری

## تاریخ آخرین آپدیت: 1405/08/02

## وضعیت: بخش ۷ (اشخاص) — تکمیل شد ✅ + بخش ۸ (Permission) — تکمیل شد ✅ + ایمپورت اکسل عملیاتی — تکمیل شد ✅ + Drag & Drop — تکمیل شد ✅ + جستجو و فیلتر سطح — تکمیل شد ✅ + کلید میانبر Ctrl+S — تکمیل شد ✅

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

## 🔥 بخش جدید: کامپوننت جستجو و فیلتر سطح

### فایل‌ها:
- `public/base-data-search.js` — منطق کامپوننت (مشترک بین همه صفحات)
- `public/base-data-search.css` — استایل کامپوننت

### قابلیت‌ها:
1. **جستجوی real-time** (debounce 250ms)
   - جستجو بر اساس **کد** یا **عنوان**
   - تشخیص خودکار عدد/متن (اگه عدد بود → فقط کد، اگه متن بود → کد + عنوان)
   - دکمه «✕» برای پاک کردن
2. **فیلتر سطح (Pills)**
   - «همه» + سطح‌های مربوط به هر صفحه
   - وقتی یه سطح فیلتر میشه، والدها هم نمایش داده میشن (ساختار درخت حفظ میشه)
   - آیکون مخصوص برای هر سطح
3. **جستجو + فیلتر با هم**
4. **نمایش breadcrumb code** (مسیر کامل) زیر عنوان در نمای جدولی (وقتی فیلتر فعاله)
5. **نمایش تعداد نتایج** (مثلاً «۲۳ از ۴۵ ردیف»)
6. **`useType: true`** — برای صفحاتی مثل `operational` که `type` معناداره (نه `level`)
7. **`hidePills: true`** — برای صفحاتی مثل `budget-types` که سطح‌بندی ندارن
8. **باز کردن خودکار همه نودها** وقتی فیلتر/سرچ فعاله (تا نتایج دیده بشن)
9. **`localStorage` غیرفعال** — هر بار صفحه لود میشه، فیلتر/سرچ ری‌ست میشه
10. **`currentFilteredData` / `currentIsFiltered`** — برای حفظ state درون‌session (مثلاً موقع باز/بسته کردن شاخه)

### نحوه استفاده در هر صفحه:
```javascript
// ۱. در <head>
<link rel="stylesheet" href="/base-data-search.css">

// ۲. بعد از common.js
<script src="/base-data-search.js"></script>

// ۳. بعد از رندر اولیه در loadData
if (!window._bdsInitialized) {
    window._bdsInitialized = true;
    startSearchComponent();
} else if (typeof window.refreshBds === 'function') {
    window.refreshBds();
}

// ۴. تعریف startSearchComponent
function startSearchComponent() {
    initBaseDataSearch(
        {
            section: 'organization',
            levelNames: ['حوزه', 'معاونت', 'سازمان', 'اداره', 'واحد'],
            levelIcons: ['🏛️', '⭐', '🏢', '📁', '👥'],
        },
        {
            getFlatData: () => flatData,
            onUpdate: ({ filteredData, isFiltered }) => {
                currentFilteredData = isFiltered ? filteredData : null;
                currentIsFiltered = isFiltered;
                renderTree(filteredData, isFiltered);
                renderTable(filteredData, isFiltered);
            },
        }
    );
}