-- ============================================
-- Migration 037: جدول حضور و غیاب
-- ============================================

CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_person_id INTEGER NOT NULL,
    
    -- دوره
    period_year INTEGER NOT NULL,
    period_month INTEGER NOT NULL,
    
    -- حضور و غیاب
    working_days INTEGER DEFAULT 0,          -- روزهای کارکرد
    absence_days INTEGER DEFAULT 0,          -- روزهای غیبت
    leave_days INTEGER DEFAULT 0,            -- روزهای مرخصی
    sick_leave_days INTEGER DEFAULT 0,       -- مرخصی استعلاجی
    
    -- اضافه‌کاری
    overtime_hours DECIMAL(10,2) DEFAULT 0,  -- ساعت اضافه‌کاری
    holiday_hours DECIMAL(10,2) DEFAULT 0,   -- ساعت تعطیل‌کاری
    nightshift_hours DECIMAL(10,2) DEFAULT 0, -- ساعت نوبت‌کاری
    
    -- مأموریت
    mission_days_with_stay DECIMAL(10,2) DEFAULT 0,      -- مأموریت با بیتوته
    mission_days_without_stay DECIMAL(10,2) DEFAULT 0,   -- مأموریت بدون بیتوته
    
    -- تأییدها
    manager_approved BOOLEAN DEFAULT 0,      -- تأیید مدیر واحد
    manager_approved_by INTEGER,
    manager_approved_at DATETIME,
    
    mayor_approved BOOLEAN DEFAULT 0,        -- تأیید شهردار
    mayor_approved_by INTEGER,
    mayor_approved_at DATETIME,
    
    -- وضعیت
    status TEXT DEFAULT 'draft',             -- draft, submitted, manager_approved, mayor_approved, rejected
    
    -- عمومی
    notes TEXT,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at_shamsi TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at_shamsi TEXT,
    
    FOREIGN KEY (employee_person_id) REFERENCES persons(id) ON DELETE CASCADE,
    UNIQUE(employee_person_id, period_year, period_month)
);

CREATE INDEX IF NOT EXISTS idx_attendance_employee ON attendance(employee_person_id);
CREATE INDEX IF NOT EXISTS idx_attendance_period ON attendance(period_year, period_month);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance(status);