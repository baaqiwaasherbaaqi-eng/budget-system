-- ============================================
-- Migration 024: جدول employees
-- ============================================

CREATE TABLE IF NOT EXISTS employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    person_id INTEGER NOT NULL UNIQUE,
    
    -- نوع قرارداد
    contract_type TEXT CHECK(contract_type IN ('worker', 'employee')),  -- کارگر / کارمند
    contract_start_shamsi TEXT,       -- تاریخ شروع قرارداد
    contract_end_shamsi TEXT,         -- تاریخ پایان قرارداد
    hire_date_shamsi TEXT,            -- تاریخ استخدام
    
    -- نوع حکم (۹ نوع)
    decree_type TEXT,                 -- از base_data (section='decree_type')
    
    -- نوع استخدام
    employment_type TEXT,             -- رسمی، پیمانی، قراردادی، ...
    
    -- اطلاعات استخدامی
    position TEXT,                    -- سمت
    department TEXT,                  -- واحد سازمانی
    
    -- سابقه
    years_of_service INTEGER DEFAULT 0,       -- سابقه سنوات
    insurance_history_months INTEGER DEFAULT 0, -- سابقه بیمه (ماه)
    insurance_number TEXT,            -- شماره بیمه
    
    -- مدرک تحصیلی
    education_level TEXT,             -- دیپلم، کاردانی، کارشناسی، ...
    education_field TEXT,             -- رشته تحصیلی
    education_university TEXT,        -- دانشگاه
    education_year_shamsi TEXT,       -- سال فارغ‌التحصیلی
    
    -- تخصص و تجربه
    specialties TEXT,                 -- JSON: تخصص‌ها
    experience_years INTEGER DEFAULT 0,
    experience_description TEXT,
    
    -- روز مناسبتی
    birthday_shamsi TEXT,             -- تاریخ تولد (برای تقدیر)
    other_occasion_shamsi TEXT,       -- سایر مناسبت‌ها
    other_occasion_title TEXT,        -- عنوان مناسبت
    
    -- وضعیت
    is_active BOOLEAN DEFAULT 1,
    notes TEXT,
    extra_data TEXT,
    
    -- تاریخ‌ها
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at_shamsi TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at_shamsi TEXT,
    
    FOREIGN KEY (person_id) REFERENCES persons(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_employees_person ON employees(person_id);
CREATE INDEX IF NOT EXISTS idx_employees_contract ON employees(contract_type);
CREATE INDEX IF NOT EXISTS idx_employees_active ON employees(is_active);