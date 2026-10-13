-- ============================================
-- Migration 038: افزودن فیلدهای لغو به payroll_calculations
-- ============================================

ALTER TABLE payroll_calculations ADD COLUMN cancelled_at DATETIME;
ALTER TABLE payroll_calculations ADD COLUMN cancelled_by INTEGER;
ALTER TABLE payroll_calculations ADD COLUMN cancelled_reason TEXT;