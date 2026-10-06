-- ============================================
-- Migration 018: اصلاح ایندکس یکتا برای احتساب type
-- ============================================

-- حذف ایندکس قدیمی
DROP INDEX IF EXISTS idx_base_data_unique_code;

-- ایندکس جدید با type
CREATE UNIQUE INDEX idx_base_data_unique_code 
ON base_data(section, COALESCE(fiscal_year_id, 0), COALESCE(type, ''), code);