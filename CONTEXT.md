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
- [x] بخش ۶: کدینگ کالا و خدمات
- [x] **بخش ۷: اشخاص (کارکنان، حقیقی، حقوقی، تفصیلی شناور)**
- [x] جدول `base_data` + API کامل + UI درختی/جدولی
- [x] جدول `persons` + API کامل + UI + فرم هوشمند
- [x] `tree.css` مشترک برای یکدست‌سازی درخت‌ها
- [x] `person_organizations` و `entity_relations` (آماده برای آینده)
- [x] Footer مشترک
- [x] Breadcrumb مشترک
- [x] صفحه `goods.html` با `extra_data`
- [x] صفحه `persons.html` با ۴ تب + DatePicker شمسی
- [x] دسترسی `manager` به «سال مالی» و «لاگ سیستم»
- [x] بهبود ظاهر صفحه لاگین (روشن‌تر + فوتر واضح)

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
- [ ] بخش ۶: فهرست بهای کالا و خدمات
- [ ] بخش ۶: استهلاک دارایی‌های ثابت
- [ ] بخش ۶: احکام حقوقی
- [ ] اتصال کالا/خدمات به `budget-proposals.html`
- [ ] تدوین و تصویب بودجه

## ساختار `base_data`:
- `section`: 'organization', 'economic', 'strategic', 'operational', 'accounting', 'budget_type', 'goods'
- `type`: انواع مختلف
- `extra_data`: JSON string

## قوانین کدینگ بخش ۷ (اشخاص):
- **کدینگ ۱۰ رقمی:** `[۱ رقم گروه][۳ رقم زیرگروه][۳ رقم دسته][۳ رقم شخص]`
- **سطح ۱:** `X000000000`
- **سطح ۲:** `XYYY000000`
- **سطح ۳:** `XYYYZZZ000`
- **سطح ۴:** `XYYYZZZWWW`

### مثال: