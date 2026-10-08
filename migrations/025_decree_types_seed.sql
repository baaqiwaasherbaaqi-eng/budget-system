-- ============================================
-- Migration 025: Seed ۹ نوع حکم
-- ============================================

-- حذف ایندکس یکتا (موقت)
DROP INDEX IF EXISTS idx_base_data_unique_code;

-- پاک‌سازی
DELETE FROM base_data WHERE section = 'decree_type';

-- درج ۹ نوع حکم
INSERT INTO base_data (section, type, code, digit_count, level, level_name, title, parent_id, sort_order, created_at_shamsi)
VALUES 
  ('decree_type', 'decree', '001', 3, 0, 'نوع حکم', 'کارگر رسمی', NULL, 1, '1405/07/08'),
  ('decree_type', 'decree', '002', 3, 0, 'نوع حکم', 'کارگر قراردادی', NULL, 2, '1405/07/08'),
  ('decree_type', 'decree', '003', 3, 0, 'نوع حکم', 'کارمند رسمی (تامین اجتماعی و خدمات درمانی)', NULL, 3, '1405/07/08'),
  ('decree_type', 'decree', '004', 3, 0, 'نوع حکم', 'کارمند پیمانی (تامین اجتماعی و خدمات درمانی)', NULL, 4, '1405/07/08'),
  ('decree_type', 'decree', '005', 3, 0, 'نوع حکم', 'کارمند تصری پیمانی', NULL, 5, '1405/07/08'),
  ('decree_type', 'decree', '006', 3, 0, 'نوع حکم', 'کارمند قرارداد موقت', NULL, 6, '1405/07/08'),
  ('decree_type', 'decree', '007', 3, 0, 'نوع حکم', 'کارمند انجام کار معین', NULL, 7, '1405/07/08'),
  ('decree_type', 'decree', '008', 3, 0, 'نوع حکم', 'کارگر شرکتی', NULL, 8, '1405/07/08');

-- بازسازی ایندکس یکتا
CREATE UNIQUE INDEX IF NOT EXISTS idx_base_data_unique_code 
ON base_data(section, COALESCE(fiscal_year_id, 0), COALESCE(type, ''), code);