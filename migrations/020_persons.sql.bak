-- ============================================
-- Migration 020: جدول اشخاص
-- ============================================

-- پاک‌سازی (اگه قبلاً بوده)
DROP TABLE IF EXISTS person_organizations;
DROP TABLE IF EXISTS entity_relations;
DROP TABLE IF EXISTS persons;

-- ============================================
-- جدول اصلی اشخاص
-- ============================================

CREATE TABLE persons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- نوع شخص
  person_type TEXT NOT NULL,  -- 'employee', 'natural', 'legal', 'floating'
  
  -- کدینگ ۱۰ رقمی
  code TEXT NOT NULL UNIQUE,
  parent_id INTEGER,
  
  -- سطح در درخت
  level INTEGER DEFAULT 0,
  level_name TEXT,
  
  -- اطلاعات هویتی
  full_name TEXT NOT NULL,
  national_id TEXT,              -- کد ملی ۱۰ رقمی
  economic_code TEXT,            -- کد اقتصادی (حقوقی)
  registration_number TEXT,      -- شماره ثبت (حقوقی)
  father_name TEXT,
  id_number TEXT,                -- شماره شناسنامه
  birth_date_shamsi TEXT,
  
  -- اطلاعات تماس
  phone TEXT,
  mobile TEXT,
  address TEXT,
  postal_code TEXT,
  email TEXT,
  
  -- اطلاعات کارکنان
  employee_code TEXT,            -- کد پرسنلی
  employment_type TEXT,          -- 'رسمی', 'پیمانی', 'قراردادی'
  position TEXT,
  hire_date_shamsi TEXT,
  end_date_shamsi TEXT,
  
  -- اطلاعات مالی
  bank_name TEXT,
  bank_account TEXT,
  iban TEXT,
  
  -- استعلام کد ملی (placeholder)
  national_id_verified BOOLEAN DEFAULT 0,
  national_id_verified_at DATETIME,
  
  -- عمومی
  notes TEXT,
  extra_data TEXT,               -- JSON
  is_active BOOLEAN DEFAULT 1,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at_shamsi TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at_shamsi TEXT,
  
  FOREIGN KEY (parent_id) REFERENCES persons(id)
);

-- ایندکس‌ها
CREATE INDEX idx_persons_type ON persons(person_type);
CREATE INDEX idx_persons_code ON persons(code);
CREATE INDEX idx_persons_national_id ON persons(national_id);
CREATE INDEX idx_persons_parent ON persons(parent_id);
CREATE INDEX idx_persons_active ON persons(is_active);

-- ============================================
-- جدول ارتباط اشخاص با سازمان‌ها (چندبه‌چند)
-- ============================================

CREATE TABLE person_organizations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  person_id INTEGER NOT NULL,
  organization_id INTEGER NOT NULL,    -- FK به base_data(section='organization')
  role TEXT,                            -- 'employee', 'manager', 'contractor', ...
  start_date_shamsi TEXT,
  end_date_shamsi TEXT,
  is_primary BOOLEAN DEFAULT 0,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at_shamsi TEXT,
  
  FOREIGN KEY (person_id) REFERENCES persons(id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id) REFERENCES base_data(id)
);

CREATE INDEX idx_person_org_person ON person_organizations(person_id);
CREATE INDEX idx_person_org_org ON person_organizations(organization_id);

-- ============================================
-- جدول ارتباطات عمومی (چندمنظوره)
-- ============================================

CREATE TABLE entity_relations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_type TEXT NOT NULL,      -- 'person', 'base_data', 'budget_proposal', ...
  source_id INTEGER NOT NULL,
  target_type TEXT NOT NULL,
  target_id INTEGER NOT NULL,
  relation_type TEXT NOT NULL,    -- 'employee_of', 'contractor_for', 'owner_of', ...
  metadata TEXT,                  -- JSON برای اطلاعات اضافی
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at_shamsi TEXT
);

CREATE INDEX idx_entity_rel_source ON entity_relations(source_type, source_id);
CREATE INDEX idx_entity_rel_target ON entity_relations(target_type, target_id);
CREATE INDEX idx_entity_rel_type ON entity_relations(relation_type);