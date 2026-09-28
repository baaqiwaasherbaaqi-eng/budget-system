# پروژه: سامانه بودجه شهرداری

## تاریخ آخرین آپدیت: 1405/06/31

## وضعیت: بخش ۴ (نوع اعتبار و مصرف) تکمیل شد ✅

## کارهای انجام شده:
- [x] فاز ۰ تا ۱۷
- [x] فاز ۱۸: مستندسازی (در حال انجام)
- [x] بازطراحی بخش ۲ (طبقه‌بندی سازمانی)
- [x] بازطراحی بخش ۴ (طبقه‌بندی اقتصادی)
- [x] بخش ۳: برنامه راهبردی
- [x] بخش ۴: طبقه‌بندی عملیاتی
- [x] بخش ۴: نوع اعتبار + نوع مصرف (صفحه `budget-types.html`)
- [x] بخش ۵: حسابداری
- [x] جدول `base_data` + API کامل + UI درختی/جدولی
- [x] آپدیت `budget_proposals` با FK به `base_data`
- [x] Footer مشترک
- [x] باگ‌فیکس `currentParentId`
- [x] **اصلاح ایندکس یکتا برای احتساب `type` (migration 018)**

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
- [ ] بخش ۶: کالا و خدمات (کدینگ کالا، فهرست بها، استهلاک، احکام حقوقی)
- [ ] بخش ۷: اشخاص (کارکنان، حقیقی، حقوقی، تفصیلی شناور)
- [ ] اتصال نوع اعتبار و نوع مصرف به `budget-proposals.html`
- [ ] تدوین و تصویب بودجه
- [ ] تدوین و تصویب اصلاح/متمم بودجه
- [ ] تدوین و تصویب تفریغ بودجه

## ساختار `base_data`:
- `section`: 'organization', 'economic', 'strategic', 'operational', 'accounting', 'budget_type', 'goods', 'persons'
- `type`: 'resource', 'expense', 'strategic', 'mission', 'program', 'service', 'plan', 'activity', 'project', 'asset', 'liability', 'equity', 'performance', 'warehouse', 'accounting', 'credit', 'usage', 'general', ...
- `prefix`: 'س' سازمانی، 'ر' راهبردی، 'ح' حسابداری، NULL برای اقتصادی، عملیاتی، بودجه‌ای
- `code`: کد کامل
- `digit_count`: 2 تا 20 (پیش‌فرض 3)
- `level`, `level_name`, `parent_id`
- `extra_data`: متن (اختیاری)
- `created_at_shamsi` / `updated_at_shamsi`: خودکار

## قوانین کدینگ:
- هر بخش یک سرکد دارد؛ زیرکدها به کد مادر اضافه می‌شن
- حرف پیشوند برای همه بخش‌ها (به‌جز بخش ۴):
  - `س` سازمانی، `ر` راهبردی، `ح` حسابداری
- **بخش ۴ (بودجه):**
  - **اقتصادی:** منابع از `1`، مصارف از `2`
  - **عملیاتی:**
    - مأموریت: `001` → برنامه: `001001` → خدمت: `00100100001` (تا `49999`) یا طرح: `00100150000` (تا `99999`) → فعالیت/پروژه: والد + `001`
    - محدودیت: فعالیت فقط زیر خدمت، پروژه فقط زیر طرح
  - **نوع اعتبار:** `credit` → `001`, `002`, `003`
  - **نوع مصرف:** `usage` → `001`, `002`
  - **نکته:** چون هر دو `credit` و `usage` از `001` شروع می‌شن، ایندکس یکتا `type` رو هم حساب می‌کنه

## ایندکس یکتا:
```sql
CREATE UNIQUE INDEX idx_base_data_unique_code 
ON base_data(section, COALESCE(fiscal_year_id, 0), COALESCE(type, ''), code);