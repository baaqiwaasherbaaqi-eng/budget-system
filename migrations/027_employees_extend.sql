-- ============================================
-- Migration 027: افزودن فیلدهای جدید به employees
-- ============================================

-- SQLite از ALTER TABLE ADD COLUMN پشتیبانی می‌کنه
ALTER TABLE employees ADD COLUMN unit_start_shamsi TEXT;
ALTER TABLE employees ADD COLUMN personnel_code TEXT;