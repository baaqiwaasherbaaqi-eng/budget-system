-- ============================================
-- Migration 023: بازسازی کامل persons
-- ============================================

-- ۱. حذف جدول‌های وابسته (اگه وجود دارن)
DROP TABLE IF EXISTS person_organizations;
DROP TABLE IF EXISTS entity_relations;
DROP TABLE IF EXISTS persons;

-- ۲. ساخت جدول جدید persons
CREATE TABLE persons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    national_id TEXT UNIQUE,
    national_id_verified BOOLEAN DEFAULT 0,
    national_id_verified_at DATETIME,
    
    code TEXT UNIQUE,
    parent_id INTEGER,
    level INTEGER DEFAULT 0,
    level_name TEXT,
    
    person_type TEXT NOT NULL CHECK(person_type IN ('employee', 'citizen', 'foreigner', 'legal')),
    
    first_name TEXT,
    last_name TEXT,
    full_name TEXT NOT NULL,
    father_name TEXT,
    mother_name TEXT,
    id_number TEXT,
    birth_date_shamsi TEXT,
    birth_place TEXT,
    gender TEXT CHECK(gender IN ('male', 'female') OR gender IS NULL),
    religion TEXT,
    nationality TEXT DEFAULT 'ایرانی',
    
    economic_code TEXT,
    registration_number TEXT,
    legal_type TEXT,
    
    relationship_type TEXT,
    relationship_start_shamsi TEXT,
    
    phone TEXT,
    mobile TEXT,
    address TEXT,
    postal_code TEXT,
    email TEXT,
    
    bank_name TEXT,
    bank_account TEXT,
    iban TEXT,
    
    notes TEXT,
    extra_data TEXT,
    is_active BOOLEAN DEFAULT 1,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at_shamsi TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at_shamsi TEXT,
    
    FOREIGN KEY (parent_id) REFERENCES persons(id)
);

-- ۳. ایندکس‌ها
CREATE INDEX idx_persons_national_id ON persons(national_id);
CREATE INDEX idx_persons_type ON persons(person_type);
CREATE INDEX idx_persons_code ON persons(code);
CREATE INDEX idx_persons_parent ON persons(parent_id);
CREATE INDEX idx_persons_active ON persons(is_active);

-- ۴. بازسازی person_organizations
CREATE TABLE person_organizations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  person_id INTEGER NOT NULL,
  organization_id INTEGER NOT NULL,
  role TEXT,
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

-- ۵. بازسازی entity_relations
CREATE TABLE entity_relations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_type TEXT NOT NULL,
  source_id INTEGER NOT NULL,
  target_type TEXT NOT NULL,
  target_id INTEGER NOT NULL,
  relation_type TEXT NOT NULL,
  metadata TEXT,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at_shamsi TEXT
);

CREATE INDEX idx_entity_rel_source ON entity_relations(source_type, source_id);
CREATE INDEX idx_entity_rel_target ON entity_relations(target_type, target_id);
CREATE INDEX idx_entity_rel_type ON entity_relations(relation_type);

-- ۶. Seed گروه‌ها
-- کارکنان
INSERT INTO persons (person_type, code, level, level_name, full_name, is_active)
VALUES ('employee', '1000000000', 1, 'گروه اصلی', 'کارکنان', 1);

INSERT INTO persons (person_type, code, parent_id, level, level_name, full_name, is_active)
VALUES 
  ('employee', '1001000000', (SELECT id FROM persons WHERE code='1000000000'), 2, 'گروه فرعی', 'رسمی', 1),
  ('employee', '1002000000', (SELECT id FROM persons WHERE code='1000000000'), 2, 'گروه فرعی', 'پیمانی', 1),
  ('employee', '1003000000', (SELECT id FROM persons WHERE code='1000000000'), 2, 'گروه فرعی', 'قراردادی', 1),
  ('employee', '1004000000', (SELECT id FROM persons WHERE code='1000000000'), 2, 'گروه فرعی', 'روزمزد', 1),
  ('employee', '1005000000', (SELECT id FROM persons WHERE code='1000000000'), 2, 'گروه فرعی', 'سایر', 1);

-- شهروندان
INSERT INTO persons (person_type, code, level, level_name, full_name, is_active)
VALUES ('citizen', '2000000000', 1, 'گروه اصلی', 'شهروندان', 1);

INSERT INTO persons (person_type, code, parent_id, level, level_name, full_name, is_active)
VALUES 
  ('citizen', '2001000000', (SELECT id FROM persons WHERE code='2000000000'), 2, 'گروه فرعی', 'حقیقی', 1),
  ('citizen', '2002000000', (SELECT id FROM persons WHERE code='2000000000'), 2, 'گروه فرعی', 'پیمانکاران', 1),
  ('citizen', '2003000000', (SELECT id FROM persons WHERE code='2000000000'), 2, 'گروه فرعی', 'مشاوران', 1),
  ('citizen', '2004000000', (SELECT id FROM persons WHERE code='2000000000'), 2, 'گروه فرعی', 'فروشندگان', 1),
  ('citizen', '2005000000', (SELECT id FROM persons WHERE code='2000000000'), 2, 'گروه فرعی', 'سایر', 1);

-- اشخاص حقوقی
INSERT INTO persons (person_type, code, level, level_name, full_name, is_active)
VALUES ('legal', '3000000000', 1, 'گروه اصلی', 'اشخاص حقوقی', 1);

INSERT INTO persons (person_type, code, parent_id, level, level_name, full_name, is_active)
VALUES 
  ('legal', '3001000000', (SELECT id FROM persons WHERE code='3000000000'), 2, 'گروه فرعی', 'شرکت‌های خصوصی', 1),
  ('legal', '3002000000', (SELECT id FROM persons WHERE code='3000000000'), 2, 'گروه فرعی', 'سازمان‌های دولتی', 1),
  ('legal', '3003000000', (SELECT id FROM persons WHERE code='3000000000'), 2, 'گروه فرعی', 'شهرداری‌ها', 1),
  ('legal', '3004000000', (SELECT id FROM persons WHERE code='3000000000'), 2, 'گروه فرعی', 'سایر', 1);

-- خارج شهروندان
INSERT INTO persons (person_type, code, level, level_name, full_name, is_active)
VALUES ('foreigner', '4000000000', 1, 'گروه اصلی', 'خارج شهروندان', 1);

INSERT INTO persons (person_type, code, parent_id, level, level_name, full_name, is_active)
VALUES 
  ('foreigner', '4001000000', (SELECT id FROM persons WHERE code='4000000000'), 2, 'گروه فرعی', 'پیمانکاران غیرشهری', 1),
  ('foreigner', '4002000000', (SELECT id FROM persons WHERE code='4000000000'), 2, 'گروه فرعی', 'مشاوران غیرشهری', 1),
  ('foreigner', '4003000000', (SELECT id FROM persons WHERE code='4000000000'), 2, 'گروه فرعی', 'فروشندگان غیرشهری', 1),
  ('foreigner', '4004000000', (SELECT id FROM persons WHERE code='4000000000'), 2, 'گروه فرعی', 'سایر', 1);