-- ============================================
-- Migration 014b: Seed داده‌های اولیه base_data
-- ============================================
-- روش: به‌جای parent_id دستی، از SELECT بر اساس code استفاده می‌کنیم
-- اینطوری اگه ترتیب INSERT عوض بشه، مشکلی پیش نمیاد
-- ============================================

-- ============================================
-- ۱. طبقه‌بندی اقتصادی - منابع (Resource)
-- ============================================

-- سطح 0: گروه اصلی منابع
INSERT INTO base_data (section, type, code, digit_count, level, level_name, title, parent_id, sort_order, created_at_shamsi)
VALUES ('economic', 'resource', '001', 3, 0, 'گروه', 'منابع (درآمدها)', NULL, 1, '1405/06/31');

-- سطح 1: سرفصل‌های منابع
INSERT INTO base_data (section, type, code, digit_count, level, level_name, title, parent_id, sort_order, created_at_shamsi)
SELECT 'economic', 'resource', '001001', 3, 1, 'سرفصل', 'درآمدهای ناشی از عوارض عمومی (مستمر)', id, 1, '1405/06/31'
FROM base_data WHERE section='economic' AND type='resource' AND code='001';

INSERT INTO base_data (section, type, code, digit_count, level, level_name, title, parent_id, sort_order, created_at_shamsi)
SELECT 'economic', 'resource', '001002', 3, 1, 'سرفصل', 'درآمدهای ناشی از عوارض اختصاصی', id, 2, '1405/06/31'
FROM base_data WHERE section='economic' AND type='resource' AND code='001';

INSERT INTO base_data (section, type, code, digit_count, level, level_name, title, parent_id, sort_order, created_at_shamsi)
SELECT 'economic', 'resource', '001003', 3, 1, 'سرفصل', 'بهای خدمات و درآمدهای مؤسسات انتفاعی شهرداری', id, 3, '1405/06/31'
FROM base_data WHERE section='economic' AND type='resource' AND code='001';

INSERT INTO base_data (section, type, code, digit_count, level, level_name, title, parent_id, sort_order, created_at_shamsi)
SELECT 'economic', 'resource', '001004', 3, 1, 'سرفصل', 'درآمدهای حاصل از وجوه و اموال شهرداری', id, 4, '1405/06/31'
FROM base_data WHERE section='economic' AND type='resource' AND code='001';

INSERT INTO base_data (section, type, code, digit_count, level, level_name, title, parent_id, sort_order, created_at_shamsi)
SELECT 'economic', 'resource', '001005', 3, 1, 'سرفصل', 'کمک‌های اعطائی دولت و سازمان‌های دولتی', id, 5, '1405/06/31'
FROM base_data WHERE section='economic' AND type='resource' AND code='001';

INSERT INTO base_data (section, type, code, digit_count, level, level_name, title, parent_id, sort_order, created_at_shamsi)
SELECT 'economic', 'resource', '001006', 3, 1, 'سرفصل', 'اعانات و کمک‌های اهدائی اشخاص و سازمان‌های خصوصی', id, 6, '1405/06/31'
FROM base_data WHERE section='economic' AND type='resource' AND code='001';

INSERT INTO base_data (section, type, code, digit_count, level, level_name, title, parent_id, sort_order, created_at_shamsi)
SELECT 'economic', 'resource', '001007', 3, 1, 'سرفصل', 'واگذاری دارائی‌های سرمایه‌ای', id, 7, '1405/06/31'
FROM base_data WHERE section='economic' AND type='resource' AND code='001';

INSERT INTO base_data (section, type, code, digit_count, level, level_name, title, parent_id, sort_order, created_at_shamsi)
SELECT 'economic', 'resource', '001008', 3, 1, 'سرفصل', 'واگذاری دارائی‌های مالی', id, 8, '1405/06/31'
FROM base_data WHERE section='economic' AND type='resource' AND code='001';

-- سطح 2: زیرشاخه‌های واگذاری دارائی‌های سرمایه‌ای (001007)
INSERT INTO base_data (section, type, code, digit_count, level, level_name, title, parent_id, sort_order, created_at_shamsi)
SELECT 'economic', 'resource', '001007001', 3, 2, 'بند', 'درآمدهای نقدی و غیرنقدی ناشی از اجرای تبصره ۴ ماده ۱۰۱', id, 1, '1405/06/31'
FROM base_data WHERE section='economic' AND type='resource' AND code='001007';

INSERT INTO base_data (section, type, code, digit_count, level, level_name, title, parent_id, sort_order, created_at_shamsi)
SELECT 'economic', 'resource', '001007002', 3, 2, 'بند', 'فروش اموال غیر منقول', id, 2, '1405/06/31'
FROM base_data WHERE section='economic' AND type='resource' AND code='001007';

INSERT INTO base_data (section, type, code, digit_count, level, level_name, title, parent_id, sort_order, created_at_shamsi)
SELECT 'economic', 'resource', '001007003', 3, 2, 'بند', 'فروش اموال منقول و اسقاطی', id, 3, '1405/06/31'
FROM base_data WHERE section='economic' AND type='resource' AND code='001007';

INSERT INTO base_data (section, type, code, digit_count, level, level_name, title, parent_id, sort_order, created_at_shamsi)
SELECT 'economic', 'resource', '001007004', 3, 2, 'بند', 'فروش سرقفلی', id, 4, '1405/06/31'
FROM base_data WHERE section='economic' AND type='resource' AND code='001007';

INSERT INTO base_data (section, type, code, digit_count, level, level_name, title, parent_id, sort_order, created_at_shamsi)
SELECT 'economic', 'resource', '001007005', 3, 2, 'بند', 'فروش حقوق انتفاعی', id, 5, '1405/06/31'
FROM base_data WHERE section='economic' AND type='resource' AND code='001007';

INSERT INTO base_data (section, type, code, digit_count, level, level_name, title, parent_id, sort_order, created_at_shamsi)
SELECT 'economic', 'resource', '001007006', 3, 2, 'بند', 'سایر', id, 6, '1405/06/31'
FROM base_data WHERE section='economic' AND type='resource' AND code='001007';

-- سطح 2: زیرشاخه‌های واگذاری دارائی‌های مالی (001008)
INSERT INTO base_data (section, type, code, digit_count, level, level_name, title, parent_id, sort_order, created_at_shamsi)
SELECT 'economic', 'resource', '001008001', 3, 2, 'بند', 'وام‌های دریافتی', id, 1, '1405/06/31'
FROM base_data WHERE section='economic' AND type='resource' AND code='001008';

INSERT INTO base_data (section, type, code, digit_count, level, level_name, title, parent_id, sort_order, created_at_shamsi)
SELECT 'economic', 'resource', '001008002', 3, 2, 'بند', 'اوراق مشارکت', id, 2, '1405/06/31'
FROM base_data WHERE section='economic' AND type='resource' AND code='001008';

INSERT INTO base_data (section, type, code, digit_count, level, level_name, title, parent_id, sort_order, created_at_shamsi)
SELECT 'economic', 'resource', '001008003', 3, 2, 'بند', 'سایر منابع', id, 3, '1405/06/31'
FROM base_data WHERE section='economic' AND type='resource' AND code='001008';

-- ============================================
-- ۲. طبقه‌بندی اقتصادی - مصارف (Expense)
-- ============================================

-- سطح 0: گروه اصلی مصارف
INSERT INTO base_data (section, type, code, digit_count, level, level_name, title, parent_id, sort_order, created_at_shamsi)
VALUES ('economic', 'expense', '002', 3, 0, 'گروه', 'مصارف (هزینه‌ها)', NULL, 2, '1405/06/31');

-- سطح 1: سرفصل‌های مصارف
INSERT INTO base_data (section, type, code, digit_count, level, level_name, title, parent_id, sort_order, created_at_shamsi)
SELECT 'economic', 'expense', '002001', 3, 1, 'سرفصل', 'هزینه‌ها (جاری)', id, 1, '1405/06/31'
FROM base_data WHERE section='economic' AND type='expense' AND code='002';

INSERT INTO base_data (section, type, code, digit_count, level, level_name, title, parent_id, sort_order, created_at_shamsi)
SELECT 'economic', 'expense', '002002', 3, 1, 'سرفصل', 'تملک دارائی‌های سرمایه‌ای', id, 2, '1405/06/31'
FROM base_data WHERE section='economic' AND type='expense' AND code='002';

INSERT INTO base_data (section, type, code, digit_count, level, level_name, title, parent_id, sort_order, created_at_shamsi)
SELECT 'economic', 'expense', '002003', 3, 1, 'سرفصل', 'تملک دارائی‌های مالی', id, 3, '1405/06/31'
FROM base_data WHERE section='economic' AND type='expense' AND code='002';

-- سطح 2: فصل‌های هزینه‌های جاری (002001)
INSERT INTO base_data (section, type, code, digit_count, level, level_name, title, parent_id, sort_order, created_at_shamsi)
SELECT 'economic', 'expense', '002001001', 3, 2, 'فصل', 'فصل اول - جبران خدمات کارکنان', id, 1, '1405/06/31'
FROM base_data WHERE section='economic' AND type='expense' AND code='002001';

INSERT INTO base_data (section, type, code, digit_count, level, level_name, title, parent_id, sort_order, created_at_shamsi)
SELECT 'economic', 'expense', '002001002', 3, 2, 'فصل', 'فصل دوم', id, 2, '1405/06/31'
FROM base_data WHERE section='economic' AND type='expense' AND code='002001';

INSERT INTO base_data (section, type, code, digit_count, level, level_name, title, parent_id, sort_order, created_at_shamsi)
SELECT 'economic', 'expense', '002001003', 3, 2, 'فصل', 'فصل سوم', id, 3, '1405/06/31'
FROM base_data WHERE section='economic' AND type='expense' AND code='002001';

INSERT INTO base_data (section, type, code, digit_count, level, level_name, title, parent_id, sort_order, created_at_shamsi)
SELECT 'economic', 'expense', '002001004', 3, 2, 'فصل', 'فصل چهارم', id, 4, '1405/06/31'
FROM base_data WHERE section='economic' AND type='expense' AND code='002001';

INSERT INTO base_data (section, type, code, digit_count, level, level_name, title, parent_id, sort_order, created_at_shamsi)
SELECT 'economic', 'expense', '002001005', 3, 2, 'فصل', 'فصل پنجم', id, 5, '1405/06/31'
FROM base_data WHERE section='economic' AND type='expense' AND code='002001';

INSERT INTO base_data (section, type, code, digit_count, level, level_name, title, parent_id, sort_order, created_at_shamsi)
SELECT 'economic', 'expense', '002001006', 3, 2, 'فصل', 'فصل ششم', id, 6, '1405/06/31'
FROM base_data WHERE section='economic' AND type='expense' AND code='002001';

INSERT INTO base_data (section, type, code, digit_count, level, level_name, title, parent_id, sort_order, created_at_shamsi)
SELECT 'economic', 'expense', '002001007', 3, 2, 'فصل', 'فصل هفتم', id, 7, '1405/06/31'
FROM base_data WHERE section='economic' AND type='expense' AND code='002001';

INSERT INTO base_data (section, type, code, digit_count, level, level_name, title, parent_id, sort_order, created_at_shamsi)
SELECT 'economic', 'expense', '002001008', 3, 2, 'فصل', 'فصل هشتم', id, 8, '1405/06/31'
FROM base_data WHERE section='economic' AND type='expense' AND code='002001';

-- سطح 3: بندهای فصل اول (002001001)
INSERT INTO base_data (section, type, code, digit_count, level, level_name, title, parent_id, sort_order, created_at_shamsi)
SELECT 'economic', 'expense', '002001001001', 3, 3, 'بند', 'حقوق و دستمزد', id, 1, '1405/06/31'
FROM base_data WHERE section='economic' AND type='expense' AND code='002001001';

-- سطح 4: جزءهای حقوق و دستمزد (002001001001)
INSERT INTO base_data (section, type, code, digit_count, level, level_name, title, parent_id, sort_order, created_at_shamsi)
SELECT 'economic', 'expense', '002001001001001', 3, 4, 'جزء', 'حقوق شهردار', id, 1, '1405/06/31'
FROM base_data WHERE section='economic' AND type='expense' AND code='002001001001';

INSERT INTO base_data (section, type, code, digit_count, level, level_name, title, parent_id, sort_order, created_at_shamsi)
SELECT 'economic', 'expense', '002001001001002', 3, 4, 'جزء', 'حقوق کارمندان رسمی و پیمانی (تأمین اجتماعی)', id, 2, '1405/06/31'
FROM base_data WHERE section='economic' AND type='expense' AND code='002001001001';

-- سطح 2: زیرشاخه‌های تملک دارائی‌های سرمایه‌ای (002002)
INSERT INTO base_data (section, type, code, digit_count, level, level_name, title, parent_id, sort_order, created_at_shamsi)
SELECT 'economic', 'expense', '002002001', 3, 2, 'بند', 'ساختمان و سایر مستحدثات', id, 1, '1405/06/31'
FROM base_data WHERE section='economic' AND type='expense' AND code='002002';

INSERT INTO base_data (section, type, code, digit_count, level, level_name, title, parent_id, sort_order, created_at_shamsi)
SELECT 'economic', 'expense', '002002002', 3, 2, 'بند', 'ماشین‌آلات و تجهیزات', id, 2, '1405/06/31'
FROM base_data WHERE section='economic' AND type='expense' AND code='002002';

INSERT INTO base_data (section, type, code, digit_count, level, level_name, title, parent_id, sort_order, created_at_shamsi)
SELECT 'economic', 'expense', '002002003', 3, 2, 'بند', 'سایر دارائی‌های ثابت', id, 3, '1405/06/31'
FROM base_data WHERE section='economic' AND type='expense' AND code='002002';

INSERT INTO base_data (section, type, code, digit_count, level, level_name, title, parent_id, sort_order, created_at_shamsi)
SELECT 'economic', 'expense', '002002004', 3, 2, 'بند', 'موجودی انبار', id, 4, '1405/06/31'
FROM base_data WHERE section='economic' AND type='expense' AND code='002002';

INSERT INTO base_data (section, type, code, digit_count, level, level_name, title, parent_id, sort_order, created_at_shamsi)
SELECT 'economic', 'expense', '002002005', 3, 2, 'بند', 'اقلام گرانبها', id, 5, '1405/06/31'
FROM base_data WHERE section='economic' AND type='expense' AND code='002002';

INSERT INTO base_data (section, type, code, digit_count, level, level_name, title, parent_id, sort_order, created_at_shamsi)
SELECT 'economic', 'expense', '002002006', 3, 2, 'بند', 'زمین', id, 6, '1405/06/31'
FROM base_data WHERE section='economic' AND type='expense' AND code='002002';

INSERT INTO base_data (section, type, code, digit_count, level, level_name, title, parent_id, sort_order, created_at_shamsi)
SELECT 'economic', 'expense', '002002007', 3, 2, 'بند', 'سایر دارائی‌های تولید نشده', id, 7, '1405/06/31'
FROM base_data WHERE section='economic' AND type='expense' AND code='002002';

-- سطح 2: زیرشاخه‌های تملک دارائی‌های مالی (002003)
INSERT INTO base_data (section, type, code, digit_count, level, level_name, title, parent_id, sort_order, created_at_shamsi)
SELECT 'economic', 'expense', '002003001', 3, 2, 'بند', 'تعهدات قطعی نشده انتقالی سنواتی', id, 1, '1405/06/31'
FROM base_data WHERE section='economic' AND type='expense' AND code='002003';

INSERT INTO base_data (section, type, code, digit_count, level, level_name, title, parent_id, sort_order, created_at_shamsi)
SELECT 'economic', 'expense', '002003002', 3, 2, 'بند', 'بازپرداخت اصل و سود تسهیلات داخلی', id, 2, '1405/06/31'
FROM base_data WHERE section='economic' AND type='expense' AND code='002003';

INSERT INTO base_data (section, type, code, digit_count, level, level_name, title, parent_id, sort_order, created_at_shamsi)
SELECT 'economic', 'expense', '002003003', 3, 2, 'بند', 'بازپرداخت اصل و سود تسهیلات خارجی', id, 3, '1405/06/31'
FROM base_data WHERE section='economic' AND type='expense' AND code='002003';

INSERT INTO base_data (section, type, code, digit_count, level, level_name, title, parent_id, sort_order, created_at_shamsi)
SELECT 'economic', 'expense', '002003004', 3, 2, 'بند', 'بازپرداخت اصل و سود اوراق مشارکت، صکوک و سایر', id, 4, '1405/06/31'
FROM base_data WHERE section='economic' AND type='expense' AND code='002003';

-- ============================================
-- ۳. ساختار سازمانی
-- ============================================

-- سطح 0: حوزه شهردار (با حرف پیشوند 'س')
INSERT INTO base_data (section, type, prefix, code, digit_count, level, level_name, title, parent_id, sort_order, created_at_shamsi)
VALUES ('organization', 'general', 'س', 'س-001', 3, 0, 'حوزه', 'حوزه شهردار', NULL, 1, '1405/06/31');