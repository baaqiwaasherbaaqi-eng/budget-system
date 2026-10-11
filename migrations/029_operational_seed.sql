-- ============================================
-- Migration 029: Seed طبقه‌بندی عملیاتی نمونه
-- ============================================

DROP INDEX IF EXISTS idx_base_data_unique_code;
DELETE FROM base_data WHERE section = 'operational';

-- سطح ۰: مأموریت‌ها
INSERT INTO base_data (section, type, code, digit_count, level, level_name, title, parent_id, sort_order, created_at_shamsi)
VALUES 
  ('operational', 'mission', '001', 3, 0, 'مأموریت', 'ارتقای کیفیت زندگی شهروندان', NULL, 1, '1405/07/16'),
  ('operational', 'mission', '002', 3, 0, 'مأموریت', 'توسعه پایدار شهری', NULL, 2, '1405/07/16'),
  ('operational', 'mission', '003', 3, 0, 'مأموریت', 'ارتقای سلامت اداری و شفافیت', NULL, 3, '1405/07/16');

-- سطح ۱: برنامه‌ها (زیر مأموریت ۱)
INSERT INTO base_data (section, type, code, digit_count, level, level_name, title, parent_id, sort_order, created_at_shamsi)
VALUES 
  ('operational', 'program', '001001', 3, 1, 'برنامه', 'بهبود خدمات شهری', (SELECT id FROM base_data WHERE code='001' AND section='operational'), 1, '1405/07/16'),
  ('operational', 'program', '001002', 3, 1, 'برنامه', 'توسعه فضای سبز', (SELECT id FROM base_data WHERE code='001' AND section='operational'), 2, '1405/07/16');

-- سطح ۱: برنامه‌ها (زیر مأموریت ۲)
INSERT INTO base_data (section, type, code, digit_count, level, level_name, title, parent_id, sort_order, created_at_shamsi)
VALUES 
  ('operational', 'program', '002001', 3, 1, 'برنامه', 'توسعه زیرساخت‌های شهری', (SELECT id FROM base_data WHERE code='002' AND section='operational'), 1, '1405/07/16'),
  ('operational', 'program', '002002', 3, 1, 'برنامه', 'توسعه حمل و نقل عمومی', (SELECT id FROM base_data WHERE code='002' AND section='operational'), 2, '1405/07/16');

-- سطح ۱: برنامه‌ها (زیر مأموریت ۳)
INSERT INTO base_data (section, type, code, digit_count, level, level_name, title, parent_id, sort_order, created_at_shamsi)
VALUES 
  ('operational', 'program', '003001', 3, 1, 'برنامه', 'استقرار سیستم‌های اداری', (SELECT id FROM base_data WHERE code='003' AND section='operational'), 1, '1405/07/16');

-- سطح ۲: خدمت و طرح (زیر برنامه 001001)
INSERT INTO base_data (section, type, code, digit_count, level, level_name, title, parent_id, sort_order, created_at_shamsi)
VALUES 
  ('operational', 'service', '00100100001', 5, 2, 'خدمت', 'جمع‌آوری پسماند', (SELECT id FROM base_data WHERE code='001001' AND section='operational'), 1, '1405/07/16'),
  ('operational', 'service', '00100100002', 5, 2, 'خدمت', 'نظافت معابر', (SELECT id FROM base_data WHERE code='001001' AND section='operational'), 2, '1405/07/16'),
  ('operational', 'plan', '00100150000', 5, 2, 'طرح', 'احداث پارک محله‌ای', (SELECT id FROM base_data WHERE code='001001' AND section='operational'), 3, '1405/07/16');

-- سطح ۳: فعالیت‌ها (زیر خدمت 00100100001)
INSERT INTO base_data (section, type, code, digit_count, level, level_name, title, parent_id, sort_order, created_at_shamsi)
VALUES 
  ('operational', 'activity', '00100100001001', 3, 3, 'فعالیت', 'خرید ماشین‌آلات پسماند', (SELECT id FROM base_data WHERE code='00100100001' AND section='operational'), 1, '1405/07/16'),
  ('operational', 'activity', '00100100001002', 3, 3, 'فعالیت', 'آموزش شهروندان', (SELECT id FROM base_data WHERE code='00100100001' AND section='operational'), 2, '1405/07/16');

-- سطح ۳: پروژه‌ها (زیر طرح 00100150000)
INSERT INTO base_data (section, type, code, digit_count, level, level_name, title, parent_id, sort_order, created_at_shamsi)
VALUES 
  ('operational', 'project', '00100150000001', 3, 3, 'پروژه', 'پروژه پارک محله ۱', (SELECT id FROM base_data WHERE code='00100150000' AND section='operational'), 1, '1405/07/16');

-- بازسازی ایندکس
CREATE UNIQUE INDEX IF NOT EXISTS idx_base_data_unique_code 
ON base_data(section, COALESCE(fiscal_year_id, 0), COALESCE(type, ''), code);