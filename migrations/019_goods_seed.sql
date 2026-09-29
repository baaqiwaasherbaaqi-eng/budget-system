-- ============================================
-- Migration 019: Seed گروه‌های اصلی کالا و خدمات
-- ============================================

-- پاک‌سازی
DELETE FROM base_data WHERE section = 'goods';

-- ============================================
-- سطح ۱: گروه‌های اصلی
-- ============================================

INSERT INTO base_data (section, type, prefix, code, title, digit_count, level, level_name, parent_id, extra_data)
VALUES 
  ('goods', 'goods', NULL, '1', 'کالاها', 3, 1, 'گروه اصلی', NULL, NULL),
  ('goods', 'goods', NULL, '2', 'خدمات', 3, 1, 'گروه اصلی', NULL, NULL),
  ('goods', 'goods', NULL, '3', 'دارایی‌های ثابت', 3, 1, 'گروه اصلی', NULL, NULL);

-- ============================================
-- سطح ۲: گروه‌های فرعی - زیر «کالاها» (code='1')
-- ============================================

INSERT INTO base_data (section, type, prefix, code, title, digit_count, level, level_name, parent_id, extra_data)
VALUES
  ('goods', 'goods', NULL, '101', 'مواد مصرفی', 3, 2, 'گروه فرعی', (SELECT id FROM base_data WHERE section='goods' AND code='1'), NULL),
  ('goods', 'goods', NULL, '102', 'قطعات یدکی', 3, 2, 'گروه فرعی', (SELECT id FROM base_data WHERE section='goods' AND code='1'), NULL),
  ('goods', 'goods', NULL, '103', 'لوازم اداری', 3, 2, 'گروه فرعی', (SELECT id FROM base_data WHERE section='goods' AND code='1'), NULL),
  ('goods', 'goods', NULL, '104', 'تجهیزات فنی', 3, 2, 'گروه فرعی', (SELECT id FROM base_data WHERE section='goods' AND code='1'), NULL),
  ('goods', 'goods', NULL, '105', 'ابزارآلات', 3, 2, 'گروه فرعی', (SELECT id FROM base_data WHERE section='goods' AND code='1'), NULL);

-- ============================================
-- سطح ۲: گروه‌های فرعی - زیر «خدمات» (code='2')
-- ============================================

INSERT INTO base_data (section, type, prefix, code, title, digit_count, level, level_name, parent_id, extra_data)
VALUES
  ('goods', 'goods', NULL, '201', 'خدمات فنی و مهندسی', 3, 2, 'گروه فرعی', (SELECT id FROM base_data WHERE section='goods' AND code='2'), NULL),
  ('goods', 'goods', NULL, '202', 'خدمات عمومی', 3, 2, 'گروه فرعی', (SELECT id FROM base_data WHERE section='goods' AND code='2'), NULL),
  ('goods', 'goods', NULL, '203', 'خدمات آموزشی', 3, 2, 'گروه فرعی', (SELECT id FROM base_data WHERE section='goods' AND code='2'), NULL),
  ('goods', 'goods', NULL, '204', 'خدمات بهداشتی و درمانی', 3, 2, 'گروه فرعی', (SELECT id FROM base_data WHERE section='goods' AND code='2'), NULL),
  ('goods', 'goods', NULL, '205', 'خدمات فرهنگی و هنری', 3, 2, 'گروه فرعی', (SELECT id FROM base_data WHERE section='goods' AND code='2'), NULL),
  ('goods', 'goods', NULL, '206', 'خدمات رایانه‌ای و نرم‌افزاری', 3, 2, 'گروه فرعی', (SELECT id FROM base_data WHERE section='goods' AND code='2'), NULL),
  ('goods', 'goods', NULL, '207', 'خدمات حمل و نقل', 3, 2, 'گروه فرعی', (SELECT id FROM base_data WHERE section='goods' AND code='2'), NULL);

-- ============================================
-- سطح ۲: گروه‌های فرعی - زیر «دارایی‌های ثابت» (code='3')
-- ============================================

INSERT INTO base_data (section, type, prefix, code, title, digit_count, level, level_name, parent_id, extra_data)
VALUES
  ('goods', 'goods', NULL, '301', 'ساختمان‌ها', 3, 2, 'گروه فرعی', (SELECT id FROM base_data WHERE section='goods' AND code='3'), NULL),
  ('goods', 'goods', NULL, '302', 'ماشین‌آلات و تجهیزات', 3, 2, 'گروه فرعی', (SELECT id FROM base_data WHERE section='goods' AND code='3'), NULL),
  ('goods', 'goods', NULL, '303', 'وسایل نقلیه', 3, 2, 'گروه فرعی', (SELECT id FROM base_data WHERE section='goods' AND code='3'), NULL),
  ('goods', 'goods', NULL, '304', 'اثاثیه و منصوبات', 3, 2, 'گروه فرعی', (SELECT id FROM base_data WHERE section='goods' AND code='3'), NULL),
  ('goods', 'goods', NULL, '305', 'زمین', 3, 2, 'گروه فرعی', (SELECT id FROM base_data WHERE section='goods' AND code='3'), NULL),
  ('goods', 'goods', NULL, '306', 'دارایی‌های نامشهود', 3, 2, 'گروه فرعی', (SELECT id FROM base_data WHERE section='goods' AND code='3'), NULL);