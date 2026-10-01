# پروژه: سامانه بودجه شهرداری

## تاریخ آخرین آپدیت: 1405/07/XX

## وضعیت: بخش ۷ (اشخاص) — تکمیل شد ✅

## کارهای انجام شده:
- [x] فاز ۰ تا ۱۸
- [x] بازطراحی بخش ۲ (طبقه‌بندی سازمانی)
- [x] بازطراحی بخش ۴ (طبقه‌بندی اقتصادی)
- [x] بخش ۳: برنامه راهبردی
- [x] بخش ۴: طبقه‌بندی عملیاتی
- [x] بخش ۴: نوع اعتبار + نوع مصرف
- [x] بخش ۵: حسابداری
- [x] بخش ۶: کدینگ کالا و خدمات (درختی چندسطحی + واحد + مشخصات فنی)
- [x] **بخش ۷: اشخاص (کارکنان، حقیقی، حقوقی، تفصیلی شناور)**
- [x] جدول `base_data` + API کامل + UI درختی/جدولی
- [x] جدول `persons` + API کامل + UI درختی/جدولی + فرم هوشمند
- [x] **`tree.css` مشترک برای یکدست‌سازی ظاهر درخت‌ها**
- [x] **`person_organizations` و `entity_relations` (آماده برای استفاده در آینده)**
- [x] Footer مشترک
- [x] Breadcrumb مشترک
- [x] صفحه `goods.html` با پشتیبانی از `extra_data` (JSON)
- [x] صفحه `persons.html` با ۴ تب + فرم شرطی + DatePicker شمسی

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
- **/persons.html** ← جدید

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
- /audit-log.html

## کاربران پیش‌فرض:
- admin / Admin123!

## نقش‌ها:
- admin, manager, expert, viewer, province, ministry

## کارهای بعدی:
- [ ] بخش ۷: اتصال اشخاص به سازمان (`person_organizations`)
- [ ] بخش ۷: اتصال اشخاص به بودجه پیشنهادی
- [ ] بخش ۷: استعلام کد ملی
- [ ] بخش ۷: گزارش‌گیری از اشخاص
- [ ] بخش ۶: فهرست بهای کالا و خدمات (قیمت‌گذاری سالانه)
- [ ] بخش ۶: استهلاک دارایی‌های ثابت
- [ ] بخش ۶: احکام حقوقی
- [ ] اتصال کالا/خدمات به `budget-proposals.html`
- [ ] تدوین و تصویب بودجه

## ساختار `base_data`:
- `section`: 'organization', 'economic', 'strategic', 'operational', 'accounting', 'budget_type', 'goods'
- `type`: 'resource', 'expense', 'strategic', 'mission', 'program', 'service', 'plan', 'activity', 'project', 'asset', 'liability', 'equity', 'performance', 'warehouse', 'accounting', 'credit', 'usage', 'goods', 'general', ...
- `extra_data`: JSON string (unit, unit_custom, specs, notes)

## قوانین کدینگ بخش ۷ (اشخاص):
- **کدینگ ۱۰ رقمی:** `[۱ رقم گروه][۳ رقم زیرگروه][۳ رقم دسته][۳ رقم شخص]`
- **سطح ۱** (گروه اصلی): `X000000000` (X = ۱ تا ۹)
- **سطح ۲** (گروه فرعی): `XYYY000000`
- **سطح ۳** (دسته): `XYYYZZZ000`
- **سطح ۴** (شخص): `XYYYZZZWWW`

### مثال: