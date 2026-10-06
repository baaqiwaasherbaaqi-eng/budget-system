-- ============================================
-- Migration 021: Seed گروه‌های اصلی اشخاص
-- ============================================

-- پاک‌سازی
DELETE FROM persons;

-- ============================================
-- سطح ۱: گروه‌های اصلی (کد ۱۰ رقمی)
-- ============================================

-- ۱. کارکنان
INSERT INTO persons (person_type, code, level, level_name, full_name, is_active)
VALUES ('employee', '1000000000', 1, 'گروه اصلی', 'کارکنان', 1);

-- ۲. اشخاص حقیقی
INSERT INTO persons (person_type, code, level, level_name, full_name, is_active)
VALUES ('natural', '2000000000', 1, 'گروه اصلی', 'اشخاص حقیقی', 1);

-- ۳. اشخاص حقوقی
INSERT INTO persons (person_type, code, level, level_name, full_name, is_active)
VALUES ('legal', '3000000000', 1, 'گروه اصلی', 'اشخاص حقوقی', 1);

-- ۴. تفصیلی شناور
INSERT INTO persons (person_type, code, level, level_name, full_name, is_active)
VALUES ('floating', '4000000000', 1, 'گروه اصلی', 'تفصیلی شناور', 1);

-- ============================================
-- سطح ۲: زیرگروه‌های کارکنان
-- ============================================

INSERT INTO persons (person_type, code, parent_id, level, level_name, full_name, is_active)
VALUES 
  ('employee', '1001000000', (SELECT id FROM persons WHERE code='1000000000'), 2, 'گروه فرعی', 'رسمی', 1),
  ('employee', '1002000000', (SELECT id FROM persons WHERE code='1000000000'), 2, 'گروه فرعی', 'پیمانی', 1),
  ('employee', '1003000000', (SELECT id FROM persons WHERE code='1000000000'), 2, 'گروه فرعی', 'قراردادی', 1),
  ('employee', '1004000000', (SELECT id FROM persons WHERE code='1000000000'), 2, 'گروه فرعی', 'روزمزد', 1),
  ('employee', '1005000000', (SELECT id FROM persons WHERE code='1000000000'), 2, 'گروه فرعی', 'سایر', 1);

-- ============================================
-- سطح ۲: زیرگروه‌های اشخاص حقیقی
-- ============================================

INSERT INTO persons (person_type, code, parent_id, level, level_name, full_name, is_active)
VALUES 
  ('natural', '2001000000', (SELECT id FROM persons WHERE code='2000000000'), 2, 'گروه فرعی', 'پیمانکاران', 1),
  ('natural', '2002000000', (SELECT id FROM persons WHERE code='2000000000'), 2, 'گروه فرعی', 'مشاوران', 1),
  ('natural', '2003000000', (SELECT id FROM persons WHERE code='2000000000'), 2, 'گروه فرعی', 'فروشندگان', 1),
  ('natural', '2004000000', (SELECT id FROM persons WHERE code='2000000000'), 2, 'گروه فرعی', 'سایر', 1);

-- ============================================
-- سطح ۲: زیرگروه‌های اشخاص حقوقی
-- ============================================

INSERT INTO persons (person_type, code, parent_id, level, level_name, full_name, is_active)
VALUES 
  ('legal', '3001000000', (SELECT id FROM persons WHERE code='3000000000'), 2, 'گروه فرعی', 'شرکت‌های خصوصی', 1),
  ('legal', '3002000000', (SELECT id FROM persons WHERE code='3000000000'), 2, 'گروه فرعی', 'سازمان‌های دولتی', 1),
  ('legal', '3003000000', (SELECT id FROM persons WHERE code='3000000000'), 2, 'گروه فرعی', 'شهرداری‌ها', 1),
  ('legal', '3004000000', (SELECT id FROM persons WHERE code='3000000000'), 2, 'گروه فرعی', 'سایر', 1);

-- ============================================
-- سطح ۲: زیرگروه‌های تفصیلی شناور
-- ============================================

INSERT INTO persons (person_type, code, parent_id, level, level_name, full_name, is_active)
VALUES 
  ('floating', '4001000000', (SELECT id FROM persons WHERE code='4000000000'), 2, 'گروه فرعی', 'درآمدها', 1),
  ('floating', '4002000000', (SELECT id FROM persons WHERE code='4000000000'), 2, 'گروه فرعی', 'هزینه‌ها', 1),
  ('floating', '4003000000', (SELECT id FROM persons WHERE code='4000000000'), 2, 'گروه فرعی', 'سایر', 1);