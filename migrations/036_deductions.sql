-- ============================================
-- Migration 036: جداول کسورات (وام‌ها + سایر)
-- ============================================

-- ============================================
-- جدول ۱: انواع کسورات
-- ============================================
CREATE TABLE IF NOT EXISTS deduction_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    category TEXT,                       -- loan, insurance, tax, other
    is_recurring BOOLEAN DEFAULT 0,
    default_amount DECIMAL(15,2) DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_deduction_types_code ON deduction_types(code);
CREATE INDEX IF NOT EXISTS idx_deduction_types_category ON deduction_types(category);

-- ============================================
-- جدول ۲: وام‌های کارکنان
-- ============================================
CREATE TABLE IF NOT EXISTS loans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_person_id INTEGER NOT NULL,
    
    -- اطلاعات وام
    loan_type TEXT,                      -- bank, fund, emergency, ...
    lender_name TEXT,
    loan_number TEXT,
    
    -- مبالغ
    total_amount DECIMAL(15,2) NOT NULL,
    paid_amount DECIMAL(15,2) DEFAULT 0,
    remaining_amount DECIMAL(15,2),
    
    -- اقساط
    installments_count INTEGER NOT NULL,
    installment_amount DECIMAL(15,2),
    paid_installments INTEGER DEFAULT 0,
    
    -- تاریخ‌ها
    start_date_shamsi TEXT,
    end_date_shamsi TEXT,
    first_installment_shamsi TEXT,
    
    -- وضعیت
    status TEXT DEFAULT 'active',        -- active, completed, cancelled
    is_active BOOLEAN DEFAULT 1,
    
    notes TEXT,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at_shamsi TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at_shamsi TEXT,
    
    FOREIGN KEY (employee_person_id) REFERENCES persons(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_loans_employee ON loans(employee_person_id);
CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status);

-- ============================================
-- جدول ۳: پرداخت اقساط وام
-- ============================================
CREATE TABLE IF NOT EXISTS loan_payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    loan_id INTEGER NOT NULL,
    employee_person_id INTEGER NOT NULL,
    
    -- قسط
    installment_number INTEGER NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    
    -- دوره
    period_year INTEGER,
    period_month INTEGER,
    payment_date_shamsi TEXT,
    
    -- ارتباط با محاسبه حقوق
    payroll_calculation_id INTEGER,
    
    -- وضعیت
    status TEXT DEFAULT 'pending',        -- pending, paid, cancelled
    
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at_shamsi TEXT,
    
    FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE CASCADE,
    FOREIGN KEY (employee_person_id) REFERENCES persons(id) ON DELETE CASCADE,
    FOREIGN KEY (payroll_calculation_id) REFERENCES payroll_calculations(id)
);

CREATE INDEX IF NOT EXISTS idx_loan_payments_loan ON loan_payments(loan_id);
CREATE INDEX IF NOT EXISTS idx_loan_payments_employee ON loan_payments(employee_person_id);
CREATE INDEX IF NOT EXISTS idx_loan_payments_period ON loan_payments(period_year, period_month);

-- ============================================
-- جدول ۴: کسورات هر کارمند (غیر وام)
-- ============================================
CREATE TABLE IF NOT EXISTS employee_deductions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_person_id INTEGER NOT NULL,
    deduction_type_id INTEGER,
    
    -- اطلاعات
    title TEXT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    
    -- دوره
    start_date_shamsi TEXT,
    end_date_shamsi TEXT,
    remaining_count INTEGER,
    
    -- وضعیت
    status TEXT DEFAULT 'active',
    is_active BOOLEAN DEFAULT 1,
    
    notes TEXT,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at_shamsi TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at_shamsi TEXT,
    
    FOREIGN KEY (employee_person_id) REFERENCES persons(id) ON DELETE CASCADE,
    FOREIGN KEY (deduction_type_id) REFERENCES deduction_types(id)
);

CREATE INDEX IF NOT EXISTS idx_emp_ded_employee ON employee_deductions(employee_person_id);
CREATE INDEX IF NOT EXISTS idx_emp_ded_status ON employee_deductions(status);

-- ============================================
-- Seed: انواع کسورات
-- ============================================
DELETE FROM deduction_types;

INSERT INTO deduction_types (code, title, category, is_recurring, sort_order) VALUES
  ('LOAN_BANK', 'وام بانکی', 'loan', 1, 1),
  ('LOAN_FUND', 'وام صندوق', 'loan', 1, 2),
  ('LOAN_EMERGENCY', 'وام اضطراری', 'loan', 1, 3),
  ('INSURANCE', 'بیمه سهم کارمند', 'insurance', 1, 4),
  ('TAX', 'مالیات حقوق', 'tax', 1, 5),
  ('ABSENCE', 'کسر غیبت', 'other', 0, 6),
  ('PENALTY', 'جریمه', 'other', 0, 7),
  ('OTHER', 'سایر کسورات', 'other', 0, 99);