-- ============================================
-- Migration 031: جدول احکام کارگزینی
-- ============================================

CREATE TABLE IF NOT EXISTS decrees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_person_id INTEGER NOT NULL,
    
    -- نوع حکم
    decree_type TEXT NOT NULL,  -- official, official_worker, contractual, corporate, specific_task, worker_jobs, temporary, tasri
    
    -- اطلاعات حکم
    decree_number TEXT,
    decree_date_shamsi TEXT,
    execution_date_shamsi TEXT,
    contract_start_shamsi TEXT,
    contract_end_shamsi TEXT,
    
    -- شرح حکم
    description TEXT,
    
    -- اطلاعات شغلی
    organization_unit TEXT,
    service_location TEXT,
    position_title TEXT,
    job_group TEXT,
    job_rank TEXT,
    job_class TEXT,
    employment_type TEXT,
    employment_duration TEXT,
    
    -- اطلاعات شخص (کپی از شخص برای چاپ سریع)
    person_first_name TEXT,
    person_last_name TEXT,
    person_father_name TEXT,
    person_national_id TEXT,
    person_id_number TEXT,
    person_birth_date_shamsi TEXT,
    person_birth_place TEXT,
    person_education_level TEXT,
    person_education_field TEXT,
    person_marital_status TEXT,
    person_children_count INTEGER DEFAULT 0,
    person_military_status TEXT,
    person_employment_date_shamsi TEXT,
    
    -- سوابق
    service_history_years INTEGER DEFAULT 0,
    service_history_months INTEGER DEFAULT 0,
    service_history_days INTEGER DEFAULT 0,
    experience_years INTEGER DEFAULT 0,
    experience_months INTEGER DEFAULT 0,
    experience_days INTEGER DEFAULT 0,
    
    -- اطلاعات مالی
    items TEXT,                 -- JSON: [{code: 'الف', title: 'حقوق مبنا', amount: 0}, ...]
    total_amount DECIMAL(15,2) DEFAULT 0,
    total_in_words TEXT,
    currency TEXT DEFAULT 'ریال',
    
    -- اطلاعات اضافی (برای انواع خاص)
    extra_data TEXT,            -- JSON
    
    -- وضعیت
    status TEXT DEFAULT 'draft',  -- draft, issued, signed, active, expired, cancelled
    issued_by TEXT,               -- نام صادرکننده
    signed_at DATETIME,
    signed_by_employee BOOLEAN DEFAULT 0,
    signed_by_manager BOOLEAN DEFAULT 0,
    
    -- فایل‌ها
    pdf_file TEXT,
    signed_pdf_file TEXT,
    
    -- عمومی
    notes TEXT,
    is_active BOOLEAN DEFAULT 1,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at_shamsi TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at_shamsi TEXT,
    
    FOREIGN KEY (employee_person_id) REFERENCES persons(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_decrees_employee ON decrees(employee_person_id);
CREATE INDEX IF NOT EXISTS idx_decrees_type ON decrees(decree_type);
CREATE INDEX IF NOT EXISTS idx_decrees_status ON decrees(status);
CREATE INDEX IF NOT EXISTS idx_decrees_number ON decrees(decree_number);