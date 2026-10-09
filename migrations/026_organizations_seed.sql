-- ============================================
-- Migration 026: Seed سازمان‌های نمونه
-- ============================================

-- حذف ایندکس یکتا (موقت)
DROP INDEX IF EXISTS idx_base_data_unique_code;

-- پاک‌سازی سازمان‌های قدیمی با فرمت اشتباه
DELETE FROM base_data WHERE section='organization' AND code LIKE '%-%-%';

-- معاونت‌ها (سطح ۰)
INSERT OR IGNORE INTO base_data (section, type, prefix, code, digit_count, level, level_name, title, parent_id, sort_order, created_at_shamsi)
VALUES 
  ('organization', 'general', 'س', 'س-003', 3, 0, 'معاونت', 'معاونت فنی و عمرانی', NULL, 3, '1405/07/08'),
  ('organization', 'general', 'س', 'س-004', 3, 0, 'معاونت', 'معاونت خدمات شهری', NULL, 4, '1405/07/08'),
  ('organization', 'general', 'س', 'س-005', 3, 0, 'معاونت', 'معاونت فرهنگی و اجتماعی', NULL, 5, '1405/07/08'),
  ('organization', 'general', 'س', 'س-006', 3, 0, 'معاونت', 'معاونت برنامه‌ریزی و توسعه', NULL, 6, '1405/07/08');

-- ادارات زیر معاونت مالی و اداری (س-002)
INSERT OR IGNORE INTO base_data (section, type, prefix, code, digit_count, level, level_name, title, parent_id, sort_order, created_at_shamsi)
VALUES 
  ('organization', 'general', 'س', 'س-002001', 3, 1, 'اداره', 'اداره منابع انسانی', (SELECT id FROM base_data WHERE code='س-002' AND section='organization'), 1, '1405/07/08'),
  ('organization', 'general', 'س', 'س-002002', 3, 1, 'اداره', 'اداره مالی', (SELECT id FROM base_data WHERE code='س-002' AND section='organization'), 2, '1405/07/08'),
  ('organization', 'general', 'س', 'س-002003', 3, 1, 'اداره', 'اداره بودجه و برنامه‌ریزی', (SELECT id FROM base_data WHERE code='س-002' AND section='organization'), 3, '1405/07/08'),
  ('organization', 'general', 'س', 'س-002004', 3, 1, 'اداره', 'اداره پشتیبانی', (SELECT id FROM base_data WHERE code='س-002' AND section='organization'), 4, '1405/07/08');

-- ادارات زیر معاونت فنی و عمرانی (س-003)
INSERT OR IGNORE INTO base_data (section, type, prefix, code, digit_count, level, level_name, title, parent_id, sort_order, created_at_shamsi)
VALUES 
  ('organization', 'general', 'س', 'س-003001', 3, 1, 'اداره', 'اداره عمران', (SELECT id FROM base_data WHERE code='س-003' AND section='organization'), 1, '1405/07/08'),
  ('organization', 'general', 'س', 'س-003002', 3, 1, 'اداره', 'اداره فنی', (SELECT id FROM base_data WHERE code='س-003' AND section='organization'), 2, '1405/07/08'),
  ('organization', 'general', 'س', 'س-003003', 3, 1, 'اداره', 'اداره نظارت', (SELECT id FROM base_data WHERE code='س-003' AND section='organization'), 3, '1405/07/08');

-- ادارات زیر معاونت خدمات شهری (س-004)
INSERT OR IGNORE INTO base_data (section, type, prefix, code, digit_count, level, level_name, title, parent_id, sort_order, created_at_shamsi)
VALUES 
  ('organization', 'general', 'س', 'س-004001', 3, 1, 'اداره', 'اداره خدمات عمومی', (SELECT id FROM base_data WHERE code='س-004' AND section='organization'), 1, '1405/07/08'),
  ('organization', 'general', 'س', 'س-004002', 3, 1, 'اداره', 'اداره فضای سبز', (SELECT id FROM base_data WHERE code='س-004' AND section='organization'), 2, '1405/07/08'),
  ('organization', 'general', 'س', 'س-004003', 3, 1, 'اداره', 'اداره پسماند', (SELECT id FROM base_data WHERE code='س-004' AND section='organization'), 3, '1405/07/08');

-- بازسازی ایندکس یکتا
CREATE UNIQUE INDEX IF NOT EXISTS idx_base_data_unique_code 
ON base_data(section, COALESCE(fiscal_year_id, 0), COALESCE(type, ''), code);