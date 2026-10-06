-- ============================================
-- Migration 016: Seed سرفصل‌های حسابداری
-- ============================================

-- ============================================
-- سطح ۰: گروه‌های اصلی
-- ============================================

INSERT INTO base_data (section, type, prefix, code, digit_count, level, level_name, title, parent_id, sort_order, created_at_shamsi)
VALUES ('accounting', 'asset', 'ح', 'ح-001', 3, 0, 'گروه', 'دارایی‌ها', NULL, 1, '1405/06/31');

INSERT INTO base_data (section, type, prefix, code, digit_count, level, level_name, title, parent_id, sort_order, created_at_shamsi)
VALUES ('accounting', 'liability', 'ح', 'ح-002', 3, 0, 'گروه', 'بدهی‌ها', NULL, 2, '1405/06/31');

INSERT INTO base_data (section, type, prefix, code, digit_count, level, level_name, title, parent_id, sort_order, created_at_shamsi)
VALUES ('accounting', 'equity', 'ح', 'ح-003', 3, 0, 'گروه', 'سرمایه', NULL, 3, '1405/06/31');

INSERT INTO base_data (section, type, prefix, code, digit_count, level, level_name, title, parent_id, sort_order, created_at_shamsi)
VALUES ('accounting', 'performance', 'ح', 'ح-004', 3, 0, 'گروه', 'عملکرد (مازاد/کسری) درآمد بر هزینه', NULL, 4, '1405/06/31');

INSERT INTO base_data (section, type, prefix, code, digit_count, level, level_name, title, parent_id, sort_order, created_at_shamsi)
VALUES ('accounting', 'warehouse', 'ح', 'ح-005', 3, 0, 'گروه', 'انبارداری', NULL, 5, '1405/06/31');

-- ============================================
-- سطح ۱: زیرگروه‌های دارایی‌ها (parent = ح-001)
-- ============================================

INSERT INTO base_data (section, type, prefix, code, digit_count, level, level_name, title, parent_id, sort_order, created_at_shamsi)
SELECT 'accounting', 'asset', 'ح', 'ح-001001', 3, 1, 'سرفصل', 'موجودی نقد و بانک‌ها (نقل از خزانه‌داری)', id, 1, '1405/06/31'
FROM base_data WHERE section='accounting' AND code='ح-001';

INSERT INTO base_data (section, type, prefix, code, digit_count, level, level_name, title, parent_id, sort_order, created_at_shamsi)
SELECT 'accounting', 'asset', 'ح', 'ح-001002', 3, 1, 'سرفصل', 'بدهکاران', id, 2, '1405/06/31'
FROM base_data WHERE section='accounting' AND code='ح-001';

INSERT INTO base_data (section, type, prefix, code, digit_count, level, level_name, title, parent_id, sort_order, created_at_shamsi)
SELECT 'accounting', 'asset', 'ح', 'ح-001003', 3, 1, 'سرفصل', 'اموال', id, 3, '1405/06/31'
FROM base_data WHERE section='accounting' AND code='ح-001';

-- ============================================
-- سطح ۲: زیرگروه‌های بدهکاران (parent = ح-001002)
-- ============================================

INSERT INTO base_data (section, type, prefix, code, digit_count, level, level_name, title, parent_id, sort_order, created_at_shamsi)
SELECT 'accounting', 'asset', 'ح', 'ح-001002001', 3, 2, 'کل', 'بدهکاران حقیقی (نقل از اشخاص)', id, 1, '1405/06/31'
FROM base_data WHERE section='accounting' AND code='ح-001002';

INSERT INTO base_data (section, type, prefix, code, digit_count, level, level_name, title, parent_id, sort_order, created_at_shamsi)
SELECT 'accounting', 'asset', 'ح', 'ح-001002002', 3, 2, 'کل', 'بدهکاران حقوقی (نقل از اشخاص)', id, 2, '1405/06/31'
FROM base_data WHERE section='accounting' AND code='ح-001002';

-- ============================================
-- سطح ۲: زیرگروه‌های اموال (parent = ح-001003)
-- ============================================

INSERT INTO base_data (section, type, prefix, code, digit_count, level, level_name, title, parent_id, sort_order, created_at_shamsi)
SELECT 'accounting', 'asset', 'ح', 'ح-001003001', 3, 2, 'کل', 'اموال منقول (تقسیم‌بندی بر اساس جدول ۱۵۱ قانون مالیات‌های مستقیم)', id, 1, '1405/06/31'
FROM base_data WHERE section='accounting' AND code='ح-001003';

INSERT INTO base_data (section, type, prefix, code, digit_count, level, level_name, title, parent_id, sort_order, created_at_shamsi)
SELECT 'accounting', 'asset', 'ح', 'ح-001003002', 3, 2, 'کل', 'اموال غیر منقول', id, 2, '1405/06/31'
FROM base_data WHERE section='accounting' AND code='ح-001003';

-- ============================================
-- سطح ۱: زیرگروه‌های بدهی‌ها (parent = ح-002)
-- ============================================

INSERT INTO base_data (section, type, prefix, code, digit_count, level, level_name, title, parent_id, sort_order, created_at_shamsi)
SELECT 'accounting', 'liability', 'ح', 'ح-002001', 3, 1, 'سرفصل', 'بستانکاران', id, 1, '1405/06/31'
FROM base_data WHERE section='accounting' AND code='ح-002';

-- ============================================
-- سطح ۲: زیرگروه‌های بستانکاران (parent = ح-002001)
-- ============================================

INSERT INTO base_data (section, type, prefix, code, digit_count, level, level_name, title, parent_id, sort_order, created_at_shamsi)
SELECT 'accounting', 'liability', 'ح', 'ح-002001001', 3, 2, 'کل', 'بستانکاران حقیقی (نقل از اشخاص)', id, 1, '1405/06/31'
FROM base_data WHERE section='accounting' AND code='ح-002001';

INSERT INTO base_data (section, type, prefix, code, digit_count, level, level_name, title, parent_id, sort_order, created_at_shamsi)
SELECT 'accounting', 'liability', 'ح', 'ح-002001002', 3, 2, 'کل', 'بستانکاران حقوقی (نقل از اشخاص)', id, 2, '1405/06/31'
FROM base_data WHERE section='accounting' AND code='ح-002001';

-- ============================================
-- سطح ۱: زیرگروه‌های انبارداری (parent = ح-005)
-- ============================================

INSERT INTO base_data (section, type, prefix, code, digit_count, level, level_name, title, parent_id, sort_order, created_at_shamsi)
SELECT 'accounting', 'warehouse', 'ح', 'ح-005001', 3, 1, 'سرفصل', 'کدینگ کالاهای انبار بر اساس استاندارد انبارداری', id, 1, '1405/06/31'
FROM base_data WHERE section='accounting' AND code='ح-005';

INSERT INTO base_data (section, type, prefix, code, digit_count, level, level_name, title, parent_id, sort_order, created_at_shamsi)
SELECT 'accounting', 'warehouse', 'ح', 'ح-005002', 3, 1, 'سرفصل', 'تعریف کد اموال', id, 2, '1405/06/31'
FROM base_data WHERE section='accounting' AND code='ح-005';

INSERT INTO base_data (section, type, prefix, code, digit_count, level, level_name, title, parent_id, sort_order, created_at_shamsi)
SELECT 'accounting', 'warehouse', 'ح', 'ح-005003', 3, 1, 'سرفصل', 'تعریف استهلاکات اموال بر اساس ق.م.م', id, 3, '1405/06/31'
FROM base_data WHERE section='accounting' AND code='ح-005';

INSERT INTO base_data (section, type, prefix, code, digit_count, level, level_name, title, parent_id, sort_order, created_at_shamsi)
SELECT 'accounting', 'warehouse', 'ح', 'ح-005004', 3, 1, 'سرفصل', 'جعداری اموال', id, 4, '1405/06/31'
FROM base_data WHERE section='accounting' AND code='ح-005';

-- ============================================
-- سطح ۲: زیرگروه‌های تعریف کد اموال (parent = ح-005002)
-- ============================================

INSERT INTO base_data (section, type, prefix, code, digit_count, level, level_name, title, parent_id, sort_order, created_at_shamsi)
SELECT 'accounting', 'warehouse', 'ح', 'ح-005002001', 3, 2, 'کل', 'اموال سرمایه‌ای', id, 1, '1405/06/31'
FROM base_data WHERE section='accounting' AND code='ح-005002';

INSERT INTO base_data (section, type, prefix, code, digit_count, level, level_name, title, parent_id, sort_order, created_at_shamsi)
SELECT 'accounting', 'warehouse', 'ح', 'ح-005002002', 3, 2, 'کل', 'اموال اداری', id, 2, '1405/06/31'
FROM base_data WHERE section='accounting' AND code='ح-005002';

INSERT INTO base_data (section, type, prefix, code, digit_count, level, level_name, title, parent_id, sort_order, created_at_shamsi)
SELECT 'accounting', 'warehouse', 'ح', 'ح-005002003', 3, 2, 'کل', 'اموال در حکم مصرفی', id, 3, '1405/06/31'
FROM base_data WHERE section='accounting' AND code='ح-005002';

INSERT INTO base_data (section, type, prefix, code, digit_count, level, level_name, title, parent_id, sort_order, created_at_shamsi)
SELECT 'accounting', 'warehouse', 'ح', 'ح-005002004', 3, 2, 'کل', 'اموال مصرفی', id, 4, '1405/06/31'
FROM base_data WHERE section='accounting' AND code='ح-005002';

-- ============================================
-- سطح ۲: زیرگروه‌های جعداری اموال (parent = ح-005004)
-- ============================================

INSERT INTO base_data (section, type, prefix, code, digit_count, level, level_name, title, parent_id, sort_order, created_at_shamsi)
SELECT 'accounting', 'warehouse', 'ح', 'ح-005004001', 3, 2, 'کل', 'ثبت اموال تحویلی اداری', id, 1, '1405/06/31'
FROM base_data WHERE section='accounting' AND code='ح-005004';

INSERT INTO base_data (section, type, prefix, code, digit_count, level, level_name, title, parent_id, sort_order, created_at_shamsi)
SELECT 'accounting', 'warehouse', 'ح', 'ح-005004002', 3, 2, 'کل', 'ثبت اموال منقول تحویلی', id, 2, '1405/06/31'
FROM base_data WHERE section='accounting' AND code='ح-005004';

INSERT INTO base_data (section, type, prefix, code, digit_count, level, level_name, title, parent_id, sort_order, created_at_shamsi)
SELECT 'accounting', 'warehouse', 'ح', 'ح-005004003', 3, 2, 'کل', 'ثبت اموال غیرمنقول تحویلی', id, 3, '1405/06/31'
FROM base_data WHERE section='accounting' AND code='ح-005004';

INSERT INTO base_data (section, type, prefix, code, digit_count, level, level_name, title, parent_id, sort_order, created_at_shamsi)
SELECT 'accounting', 'warehouse', 'ح', 'ح-005004004', 3, 2, 'کل', 'ثبت گردش اموال بین کارکنان', id, 4, '1405/06/31'
FROM base_data WHERE section='accounting' AND code='ح-005004';