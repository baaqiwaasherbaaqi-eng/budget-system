-- ============================================
-- Migration 039: اعضای شورای شهر
-- ============================================

-- جدول جدید برای اعضای شورا
CREATE TABLE IF NOT EXISTS council_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    municipality_info_id INTEGER,
    
    -- اطلاعات شخص
    full_name TEXT NOT NULL,
    national_id TEXT,
    mobile TEXT,
    phone TEXT,
    
    -- سمت در شورا
    position TEXT,  -- 'رئیس', 'نایب‌رئیس', 'منشی', 'عضو'
    position_order INTEGER DEFAULT 0,  -- ترتیب
    
    -- دوره عضویت
    start_date_shamsi TEXT,
    end_date_shamsi TEXT,
    
    -- اطلاعات اضافی
    address TEXT,
    email TEXT,
    notes TEXT,
    
    -- وضعیت
    is_active BOOLEAN DEFAULT 1,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at_shamsi TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at_shamsi TEXT,
    
    FOREIGN KEY (municipality_info_id) REFERENCES municipality_info(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_council_members_municipality ON council_members(municipality_info_id);
CREATE INDEX IF NOT EXISTS idx_council_members_active ON council_members(is_active);