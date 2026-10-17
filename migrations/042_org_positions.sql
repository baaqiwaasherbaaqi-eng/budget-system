-- ============================================
-- Migration 042: پست‌های سازمانی
-- ============================================

-- جدول پست‌ها
CREATE TABLE IF NOT EXISTS org_positions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    organization_id INTEGER NOT NULL,
    position_code TEXT,
    position_title TEXT NOT NULL,
    position_level INTEGER DEFAULT 0,   -- 0=شهردار، 1=معاون، 2=رئیس، 3=کارشناس، 4=کارمند
    position_order INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT 1,
    description TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at_shamsi TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at_shamsi TEXT,
    FOREIGN KEY (organization_id) REFERENCES base_data(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_org_positions_org ON org_positions(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_positions_active ON org_positions(is_active);

-- افزودن position_id به person_organizations
ALTER TABLE person_organizations ADD COLUMN position_id INTEGER;

-- ============================================
-- Seed: پست‌های پیش‌فرض برای سازمان‌های موجود
-- ============================================

-- س-001: حوزه شهردار
INSERT INTO org_positions (organization_id, position_title, position_level, position_order, is_primary)
SELECT id, 'شهردار', 0, 1, 1 FROM base_data WHERE section='organization' AND code='س-001';
INSERT INTO org_positions (organization_id, position_title, position_level, position_order, is_primary)
SELECT id, 'مشاور', 3, 2, 0 FROM base_data WHERE section='organization' AND code='س-001';
INSERT INTO org_positions (organization_id, position_title, position_level, position_order, is_primary)
SELECT id, 'منشی', 4, 3, 0 FROM base_data WHERE section='organization' AND code='س-001';

-- س-002: معاونت مالی و اداری
INSERT INTO org_positions (organization_id, position_title, position_level, position_order, is_primary)
SELECT id, 'معاون', 1, 1, 1 FROM base_data WHERE section='organization' AND code='س-002';
INSERT INTO org_positions (organization_id, position_title, position_level, position_order, is_primary)
SELECT id, 'کارشناس', 3, 2, 0 FROM base_data WHERE section='organization' AND code='س-002';

-- س-002001: اداره منابع انسانی
INSERT INTO org_positions (organization_id, position_title, position_level, position_order, is_primary)
SELECT id, 'رئیس', 2, 1, 1 FROM base_data WHERE section='organization' AND code='س-002001';
INSERT INTO org_positions (organization_id, position_title, position_level, position_order, is_primary)
SELECT id, 'کارشناس', 3, 2, 0 FROM base_data WHERE section='organization' AND code='س-002001';
INSERT INTO org_positions (organization_id, position_title, position_level, position_order, is_primary)
SELECT id, 'کارمند', 4, 3, 0 FROM base_data WHERE section='organization' AND code='س-002001';

-- س-002002: اداره مالی
INSERT INTO org_positions (organization_id, position_title, position_level, position_order, is_primary)
SELECT id, 'رئیس', 2, 1, 1 FROM base_data WHERE section='organization' AND code='س-002002';
INSERT INTO org_positions (organization_id, position_title, position_level, position_order, is_primary)
SELECT id, 'کارشناس', 3, 2, 0 FROM base_data WHERE section='organization' AND code='س-002002';
INSERT INTO org_positions (organization_id, position_title, position_level, position_order, is_primary)
SELECT id, 'کارمند', 4, 3, 0 FROM base_data WHERE section='organization' AND code='س-002002';

-- س-002003: اداره بودجه و برنامه‌ریزی
INSERT INTO org_positions (organization_id, position_title, position_level, position_order, is_primary)
SELECT id, 'رئیس', 2, 1, 1 FROM base_data WHERE section='organization' AND code='س-002003';
INSERT INTO org_positions (organization_id, position_title, position_level, position_order, is_primary)
SELECT id, 'کارشناس', 3, 2, 0 FROM base_data WHERE section='organization' AND code='س-002003';

-- س-002004: اداره پشتیبانی
INSERT INTO org_positions (organization_id, position_title, position_level, position_order, is_primary)
SELECT id, 'رئیس', 2, 1, 1 FROM base_data WHERE section='organization' AND code='س-002004';
INSERT INTO org_positions (organization_id, position_title, position_level, position_order, is_primary)
SELECT id, 'کارشناس', 3, 2, 0 FROM base_data WHERE section='organization' AND code='س-002004';

-- س-003: معاونت فنی و عمرانی
INSERT INTO org_positions (organization_id, position_title, position_level, position_order, is_primary)
SELECT id, 'معاون', 1, 1, 1 FROM base_data WHERE section='organization' AND code='س-003';
INSERT INTO org_positions (organization_id, position_title, position_level, position_order, is_primary)
SELECT id, 'کارشناس', 3, 2, 0 FROM base_data WHERE section='organization' AND code='س-003';

-- س-003001: اداره عمران
INSERT INTO org_positions (organization_id, position_title, position_level, position_order, is_primary)
SELECT id, 'رئیس', 2, 1, 1 FROM base_data WHERE section='organization' AND code='س-003001';
INSERT INTO org_positions (organization_id, position_title, position_level, position_order, is_primary)
SELECT id, 'کارشناس', 3, 2, 0 FROM base_data WHERE section='organization' AND code='س-003001';

-- س-003002: اداره فنی
INSERT INTO org_positions (organization_id, position_title, position_level, position_order, is_primary)
SELECT id, 'رئیس', 2, 1, 1 FROM base_data WHERE section='organization' AND code='س-003002';
INSERT INTO org_positions (organization_id, position_title, position_level, position_order, is_primary)
SELECT id, 'کارشناس', 3, 2, 0 FROM base_data WHERE section='organization' AND code='س-003002';

-- س-003003: اداره نظارت
INSERT INTO org_positions (organization_id, position_title, position_level, position_order, is_primary)
SELECT id, 'رئیس', 2, 1, 1 FROM base_data WHERE section='organization' AND code='س-003003';
INSERT INTO org_positions (organization_id, position_title, position_level, position_order, is_primary)
SELECT id, 'کارشناس', 3, 2, 0 FROM base_data WHERE section='organization' AND code='س-003003';

-- س-004: معاونت خدمات شهری
INSERT INTO org_positions (organization_id, position_title, position_level, position_order, is_primary)
SELECT id, 'معاون', 1, 1, 1 FROM base_data WHERE section='organization' AND code='س-004';
INSERT INTO org_positions (organization_id, position_title, position_level, position_order, is_primary)
SELECT id, 'کارشناس', 3, 2, 0 FROM base_data WHERE section='organization' AND code='س-004';

-- س-004001: اداره خدمات عمومی
INSERT INTO org_positions (organization_id, position_title, position_level, position_order, is_primary)
SELECT id, 'رئیس', 2, 1, 1 FROM base_data WHERE section='organization' AND code='س-004001';
INSERT INTO org_positions (organization_id, position_title, position_level, position_order, is_primary)
SELECT id, 'کارشناس', 3, 2, 0 FROM base_data WHERE section='organization' AND code='س-004001';

-- س-004002: اداره فضای سبز
INSERT INTO org_positions (organization_id, position_title, position_level, position_order, is_primary)
SELECT id, 'رئیس', 2, 1, 1 FROM base_data WHERE section='organization' AND code='س-004002';
INSERT INTO org_positions (organization_id, position_title, position_level, position_order, is_primary)
SELECT id, 'کارشناس', 3, 2, 0 FROM base_data WHERE section='organization' AND code='س-004002';

-- س-004003: اداره پسماند
INSERT INTO org_positions (organization_id, position_title, position_level, position_order, is_primary)
SELECT id, 'رئیس', 2, 1, 1 FROM base_data WHERE section='organization' AND code='س-004003';
INSERT INTO org_positions (organization_id, position_title, position_level, position_order, is_primary)
SELECT id, 'کارشناس', 3, 2, 0 FROM base_data WHERE section='organization' AND code='س-004003';

-- س-005: معاونت فرهنگی و اجتماعی
INSERT INTO org_positions (organization_id, position_title, position_level, position_order, is_primary)
SELECT id, 'معاون', 1, 1, 1 FROM base_data WHERE section='organization' AND code='س-005';
INSERT INTO org_positions (organization_id, position_title, position_level, position_order, is_primary)
SELECT id, 'کارشناس', 3, 2, 0 FROM base_data WHERE section='organization' AND code='س-005';

-- س-006: معاونت برنامه‌ریزی و توسعه
INSERT INTO org_positions (organization_id, position_title, position_level, position_order, is_primary)
SELECT id, 'معاون', 1, 1, 1 FROM base_data WHERE section='organization' AND code='س-006';
INSERT INTO org_positions (organization_id, position_title, position_level, position_order, is_primary)
SELECT id, 'کارشناس', 3, 2, 0 FROM base_data WHERE section='organization' AND code='س-006';

-- س-007: معاونت متفرقه
INSERT INTO org_positions (organization_id, position_title, position_level, position_order, is_primary)
SELECT id, 'معاون', 1, 1, 1 FROM base_data WHERE section='organization' AND code='س-007';
INSERT INTO org_positions (organization_id, position_title, position_level, position_order, is_primary)
SELECT id, 'کارشناس', 3, 2, 0 FROM base_data WHERE section='organization' AND code='س-007';