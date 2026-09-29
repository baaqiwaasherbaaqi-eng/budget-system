# پروژه: سامانه بودجه شهرداری

## تاریخ آخرین آپدیت: 1405/07/08

## وضعیت: بخش ۶ (کالا و خدمات) — کدینگ تکمیل شد ✅

## کارهای انجام شده:
- [x] فاز ۰ تا ۱۸
- [x] بازطراحی بخش ۲ (طبقه‌بندی سازمانی)
- [x] بازطراحی بخش ۴ (طبقه‌بندی اقتصادی)
- [x] بخش ۳: برنامه راهبردی
- [x] بخش ۴: طبقه‌بندی عملیاتی
- [x] بخش ۴: نوع اعتبار + نوع مصرف
- [x] بخش ۵: حسابداری
- [x] **بخش ۶: کدینگ کالا و خدمات** (درختی چندسطحی + واحد + مشخصات فنی)
- [x] جدول `base_data` + API کامل + UI درختی/جدولی
- [x] Footer مشترک
- [x] breadcrumb مشترک
- [x] صفحه `goods.html` با پشتیبانی از `extra_data` (JSON)

## صفحات موجود:
- /login.html
- /dashboard.html
- /fiscal-years.html
- /economic-classifications.html
- /organizations.html
- /strategic-plan.html
- /operational-classifications.html
- /accounting.html
- /budget-types.html
- /goods.html
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
- [ ] بخش ۶: فهرست بهای کالا و خدمات (قیمت‌گذاری سالانه)
- [ ] بخش ۶: استهلاک دارایی‌های ثابت
- [ ] بخش ۶: احکام حقوقی
- [ ] بخش ۷: اشخاص (کارکنان، حقیقی، حقوقی، تفصیلی شناور)
- [ ] اتصال کالا/خدمات به `budget-proposals.html`
- [ ] تدوین و تصویب بودجه

## ساختار `base_data`:
- `section`: 'organization', 'economic', 'strategic', 'operational', 'accounting', 'budget_type', 'goods', 'persons'
- `type`: 'resource', 'expense', 'strategic', 'mission', 'program', 'service', 'plan', 'activity', 'project', 'asset', 'liability', 'equity', 'performance', 'warehouse', 'accounting', 'credit', 'usage', 'goods', 'general', ...
- `extra_data`: JSON string (unit, unit_custom, specs, notes)

## قوانین کدینگ بخش ۶ (کالا و خدمات):
- بدون پیشوند
- سطح ۱ (گروه اصلی): `1`, `2`, `3` (کالا، خدمات، دارایی ثابت)
- سطح ۲ (گروه فرعی): `101`, `102`, ... (`1` + `01`)
- سطح ۳ (زیرگروه): `101001`, ... (`101` + `001`)
- سطح ۴ (کالا/خدمت): `101001001`, ...
- تعداد رقم هر سطح = `level + 1`

## ایندکس یکتا:
```sql
CREATE UNIQUE INDEX idx_base_data_unique_code 
ON base_data(section, COALESCE(fiscal_year_id, 0), COALESCE(type, ''), code);