-- ============================================
-- Migration 034: جداول محاسبات حقوق
-- ============================================

-- ============================================
-- جدول ۱: آیتم‌های حقوق پایه
-- ============================================
CREATE TABLE IF NOT EXISTS payroll_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    category TEXT,                       -- salary, allowance, benefit, deduction, ...
    
    -- نوع محاسبه
    calc_type TEXT DEFAULT 'fixed',     -- fixed, percentage, formula
    default_formula TEXT,
    
    -- مشمولیت‌ها
    is_insurance_subject BOOLEAN DEFAULT 1,
    is_tax_subject BOOLEAN DEFAULT 1,
    is_overtime_subject BOOLEAN DEFAULT 0,
    is_holiday_subject BOOLEAN DEFAULT 0,
    is_nightshift_subject BOOLEAN DEFAULT 0,
    is_mission_subject BOOLEAN DEFAULT 0,
    is_family_allowance_subject BOOLEAN DEFAULT 0,
    is_child_allowance_subject BOOLEAN DEFAULT 0,
    
    -- وضعیت
    is_active BOOLEAN DEFAULT 1,
    sort_order INTEGER DEFAULT 0,
    
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payroll_items_code ON payroll_items(code);
CREATE INDEX IF NOT EXISTS idx_payroll_items_category ON payroll_items(category);
CREATE INDEX IF NOT EXISTS idx_payroll_items_active ON payroll_items(is_active);

-- ============================================
-- جدول ۲: تنظیمات محاسبات (بر اساس سال مالی)
-- ============================================
CREATE TABLE IF NOT EXISTS payroll_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fiscal_year_id INTEGER,
    setting_key TEXT NOT NULL,
    setting_value TEXT,
    setting_type TEXT DEFAULT 'number',  -- number, percent, formula, text
    description TEXT,
    category TEXT,                       -- insurance, tax, overtime, allowance, general
    sort_order INTEGER DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(fiscal_year_id, setting_key)
);

CREATE INDEX IF NOT EXISTS idx_payroll_settings_key ON payroll_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_payroll_settings_category ON payroll_settings(category);

-- ============================================
-- Seed: آیتم‌های حقوق پایه
-- ============================================
DELETE FROM payroll_items;

INSERT INTO payroll_items (code, title, category, calc_type, is_insurance_subject, is_tax_subject, is_overtime_subject, is_holiday_subject, is_nightshift_subject, is_mission_subject, is_family_allowance_subject, is_child_allowance_subject, sort_order) VALUES
  -- حقوق و مزایای پایه
  ('BASE_SALARY', 'حقوق مبنا', 'salary', 'fixed', 1, 1, 0, 0, 0, 0, 0, 0, 1),
  ('SENIORITY', 'افزایش سنواتی', 'salary', 'fixed', 1, 1, 0, 0, 0, 0, 0, 0, 2),
  ('JOB_ALLOWANCE', 'فوق العاده شغل', 'benefit', 'fixed', 1, 1, 0, 0, 0, 0, 0, 0, 3),
  ('MIN_DIFF', 'تفاوت حداقل دریافتی', 'benefit', 'fixed', 1, 1, 0, 0, 0, 0, 0, 0, 4),
  ('ADJUSTMENT_DIFF', 'تفاوت تطبیق', 'benefit', 'fixed', 1, 1, 0, 0, 0, 0, 0, 0, 5),
  
  -- فوق العاده‌ها
  ('HARDSHIP', 'فوق العاده سختی شرایط کار', 'benefit', 'fixed', 1, 1, 0, 0, 0, 0, 0, 0, 6),
  ('BAD_WEATHER', 'فوق العاده بدی آب و هوا', 'benefit', 'fixed', 1, 1, 0, 0, 0, 0, 0, 0, 7),
  ('DEPRIVATION', 'فوق العاده محرومیت از تسهیلات', 'benefit', 'fixed', 1, 1, 0, 0, 0, 0, 0, 0, 8),
  ('LOCATION', 'فوق العاده محل خدمت', 'benefit', 'fixed', 1, 1, 0, 0, 0, 0, 0, 0, 9),
  ('ATTRACTION', 'فوق العاده جذب', 'benefit', 'fixed', 1, 1, 0, 0, 0, 0, 0, 0, 10),
  ('PROMINENCE', 'فوق العاده برجستگی', 'benefit', 'fixed', 1, 1, 0, 0, 0, 0, 0, 0, 11),
  ('SPECIAL', 'فوق العاده ویژه', 'benefit', 'fixed', 1, 1, 0, 0, 0, 0, 0, 0, 12),
  ('SPECIAL_3', 'فوق العاده خاص موضوع جز ۳', 'benefit', 'fixed', 1, 1, 0, 0, 0, 0, 0, 0, 13),
  ('EFFECTIVENESS', 'فوق العاده کارانه', 'benefit', 'fixed', 1, 1, 0, 0, 0, 0, 0, 0, 14),
  ('SACRIFICE', 'فوق العاده ایثارگری', 'benefit', 'fixed', 1, 1, 0, 0, 0, 0, 0, 0, 15),
  ('NIGHTSHIFT', 'فوق العاده نوبت کاری', 'benefit', 'percentage', 1, 1, 0, 0, 1, 0, 0, 0, 16),
  ('BORDER', 'فوق العاده مرزی', 'benefit', 'fixed', 1, 1, 0, 0, 0, 0, 0, 0, 17),
  
  -- تفاوت‌ها
  ('DIFF_BAND_Y', 'تفاوت بند ی', 'benefit', 'fixed', 1, 1, 0, 0, 0, 0, 0, 0, 18),
  ('DIFF_BAND_A', 'تفاوت بند الف', 'benefit', 'fixed', 1, 1, 0, 0, 0, 0, 0, 0, 19),
  ('ADJUSTMENT_1', 'تفاوت تطبیق موضوع جز ۱', 'benefit', 'fixed', 1, 1, 0, 0, 0, 0, 0, 0, 20),
  ('SALARY_REPAIR', 'ترمیم حقوق', 'benefit', 'fixed', 1, 1, 0, 0, 0, 0, 0, 0, 21),
  ('SPECIAL_EXTRA', 'فوق العاده خاص', 'benefit', 'fixed', 1, 1, 0, 0, 0, 0, 0, 0, 22),
  ('INCENTIVE_DIFF', 'ما به تفاوت گروه‌های تشویقی', 'benefit', 'fixed', 1, 1, 0, 0, 0, 0, 0, 0, 23),
  
  -- کمک هزینه‌ها
  ('HOUSING', 'کمک هزینه مسکن', 'allowance', 'fixed', 1, 1, 0, 0, 0, 0, 0, 0, 24),
  ('FAMILY', 'کمک هزینه عائله مندی', 'allowance', 'fixed', 1, 1, 0, 0, 0, 0, 1, 0, 25),
  ('CHILD', 'کمک هزینه اولاد', 'allowance', 'fixed', 1, 1, 0, 0, 0, 0, 0, 1, 26),
  ('CONSUMABLES', 'کمک هزینه اقلام مصرفی خانوار', 'allowance', 'fixed', 1, 1, 0, 0, 0, 0, 0, 0, 27),
  ('JUDICIAL', 'فوق العاده حمایت قضایی', 'benefit', 'fixed', 1, 1, 0, 0, 0, 0, 0, 0, 28),
  
  -- موارد خاص
  ('OVERTIME', 'اضافه کاری', 'overtime', 'percentage', 1, 1, 1, 0, 0, 0, 0, 0, 29),
  ('HOLIDAY_WORK', 'تعطیل کاری', 'overtime', 'percentage', 1, 1, 0, 1, 0, 0, 0, 0, 30),
  ('MISSION', 'مأموریت', 'overtime', 'percentage', 1, 1, 0, 0, 0, 1, 0, 0, 31),
  ('OTHER', 'سایر', 'benefit', 'fixed', 1, 1, 0, 0, 0, 0, 0, 0, 99);

-- ============================================
-- Seed: تنظیمات محاسبات (پیش‌فرض)
-- ============================================
DELETE FROM payroll_settings WHERE fiscal_year_id IS NULL;

INSERT INTO payroll_settings (setting_key, setting_value, setting_type, description, category, sort_order) VALUES
  -- بیمه
  ('insurance_rate_employee', '7', 'percent', 'نرخ بیمه سهم کارمند', 'insurance', 1),
  ('insurance_rate_employer', '23', 'percent', 'نرخ بیمه سهم کارفرما', 'insurance', 2),
  
  -- مالیات
  ('tax_exemption_monthly', '120000000', 'number', 'معافیت مالیاتی ماهانه (ریال)', 'tax', 1),
  ('tax_rate_1', '10', 'percent', 'نرخ مالیات پله اول', 'tax', 2),
  ('tax_rate_2', '15', 'percent', 'نرخ مالیات پله دوم', 'tax', 3),
  ('tax_rate_3', '20', 'percent', 'نرخ مالیات پله سوم', 'tax', 4),
  ('tax_rate_4', '25', 'percent', 'نرخ مالیات پله چهارم', 'tax', 5),
  
  -- ضرایب اضافه‌کاری
  ('overtime_rate', '140', 'percent', 'ضریب اضافه‌کاری', 'overtime', 1),
  ('holiday_rate', '140', 'percent', 'ضریب تعطیل‌کاری', 'overtime', 2),
  ('nightshift_rate', '35', 'percent', 'ضریب نوبت‌کاری', 'overtime', 3),
  ('mission_rate', '100', 'percent', 'ضریب مأموریت', 'overtime', 4),
  
  -- کمک هزینه‌ها
  ('family_allowance_amount', '5000000', 'number', 'مبلغ حق عائله مندی (ریال)', 'allowance', 1),
  ('child_allowance_amount', '3000000', 'number', 'مبلغ حق اولاد هر فرزند (ریال)', 'allowance', 2),
  
  -- عمومی
  ('minimum_salary', '71000000', 'number', 'حداقل حقوق ماهانه (ریال)', 'general', 1),
  ('work_days_per_month', '30', 'number', 'تعداد روزهای کار در ماه', 'general', 2),
  ('work_hours_per_day', '8', 'number', 'ساعت کار در روز', 'general', 3);