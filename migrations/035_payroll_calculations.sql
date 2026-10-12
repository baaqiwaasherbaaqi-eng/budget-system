-- ============================================
-- Migration 035: جدول محاسبات حقوق
-- ============================================

CREATE TABLE IF NOT EXISTS payroll_calculations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_person_id INTEGER NOT NULL,
    fiscal_year_id INTEGER,
    
    -- دوره
    period_year INTEGER NOT NULL,        -- سال شمسی
    period_month INTEGER NOT NULL,       -- ماه شمسی (۱-۱۲)
    period_start_shamsi TEXT,
    period_end_shamsi TEXT,
    
    -- مرجع حکم
    decree_id INTEGER,
    
    -- آیتم‌های حقوق (JSON)
    items TEXT,                          -- [{code, title, amount, is_insurance, is_tax}, ...]
    
    -- جمع‌ها
    total_gross DECIMAL(15,2) DEFAULT 0,         -- جمع کل حقوق و مزایا
    total_insurance_subject DECIMAL(15,2) DEFAULT 0,  -- جمع مشمول بیمه
    total_tax_subject DECIMAL(15,2) DEFAULT 0,        -- جمع مشمول مالیات
    
    -- کسورات
    insurance_employee DECIMAL(15,2) DEFAULT 0,  -- بیمه سهم کارمند
    insurance_employer DECIMAL(15,2) DEFAULT 0,  -- بیمه سهم کارفرما
    tax_amount DECIMAL(15,2) DEFAULT 0,          -- مالیات
    other_deductions DECIMAL(15,2) DEFAULT 0,    -- سایر کسورات
    total_deductions DECIMAL(15,2) DEFAULT 0,    -- جمع کسورات
    
    -- خالص
    net_pay DECIMAL(15,2) DEFAULT 0,             -- خالص پرداختی
    
    -- تنظیمات اعمال شده (snapshot)
    settings_snapshot TEXT,              -- JSON: نرخ‌ها و ضرایب در زمان محاسبه
    
    -- وضعیت
    status TEXT DEFAULT 'draft',         -- draft, calculated, approved, paid, cancelled
    calculated_by INTEGER,
    calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    calculated_at_shamsi TEXT,
    
    approved_by INTEGER,
    approved_at DATETIME,
    
    paid_at DATETIME,
    payment_reference TEXT,
    
    -- عمومی
    notes TEXT,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at_shamsi TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at_shamsi TEXT,
    
    FOREIGN KEY (employee_person_id) REFERENCES persons(id) ON DELETE CASCADE,
    FOREIGN KEY (decree_id) REFERENCES decrees(id),
    FOREIGN KEY (fiscal_year_id) REFERENCES fiscal_years(id)
);

CREATE INDEX IF NOT EXISTS idx_payroll_calc_employee ON payroll_calculations(employee_person_id);
CREATE INDEX IF NOT EXISTS idx_payroll_calc_period ON payroll_calculations(period_year, period_month);
CREATE INDEX IF NOT EXISTS idx_payroll_calc_status ON payroll_calculations(status);
CREATE INDEX IF NOT EXISTS idx_payroll_calc_decree ON payroll_calculations(decree_id);