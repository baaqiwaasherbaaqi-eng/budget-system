-- ============================================
-- Migration 014a: ساخت جدول base_data
-- ============================================

CREATE TABLE IF NOT EXISTS base_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fiscal_year_id INTEGER,
    section TEXT NOT NULL,
    type TEXT,
    prefix TEXT,
    code TEXT NOT NULL,
    digit_count INTEGER DEFAULT 3,
    level INTEGER DEFAULT 0,
    level_name TEXT,
    title TEXT NOT NULL,
    parent_id INTEGER,
    description TEXT,
    extra_data TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,

    -- تاریخ‌ها
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at_shamsi TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at_shamsi TEXT,

    FOREIGN KEY (fiscal_year_id) REFERENCES fiscal_years(id),
    FOREIGN KEY (parent_id) REFERENCES base_data(id)
);

-- ایندکس‌ها
CREATE INDEX IF NOT EXISTS idx_base_data_section ON base_data(section, type);
CREATE INDEX IF NOT EXISTS idx_base_data_parent ON base_data(parent_id);
CREATE INDEX IF NOT EXISTS idx_base_data_fiscal ON base_data(fiscal_year_id);
CREATE INDEX IF NOT EXISTS idx_base_data_code ON base_data(code);
CREATE INDEX IF NOT EXISTS idx_base_data_created_shamsi ON base_data(created_at_shamsi);
CREATE INDEX IF NOT EXISTS idx_base_data_sort ON base_data(section, sort_order);

-- ایندکس یکتا: کد تکراری در یک بخش و سال مالی نباشه
CREATE UNIQUE INDEX IF NOT EXISTS idx_base_data_unique_code 
ON base_data(section, COALESCE(fiscal_year_id, 0), code);