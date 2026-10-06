-- غیرفعال کردن foreign key
PRAGMA foreign_keys = OFF;

-- ساخت جدول جدید با CHECK constraint جدید
CREATE TABLE budget_proposals_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fiscal_year_id INTEGER NOT NULL,
    organization_id INTEGER NOT NULL,
    economic_class_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'submitted', 'manager_approved', 'finance_approved', 'approved', 'rejected')),
    proposed_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    submitted_at DATETIME,
    submitted_by INTEGER,
    approved_at DATETIME,
    approved_by INTEGER,
    rejected_at DATETIME,
    rejected_by INTEGER,
    rejection_reason TEXT
);

-- انتقال داده‌ها
INSERT INTO budget_proposals_new 
SELECT * FROM budget_proposals;

-- حذف جدول قدیمی
DROP TABLE budget_proposals;

-- تغییر نام جدول جدید
ALTER TABLE budget_proposals_new RENAME TO budget_proposals;

-- فعال کردن foreign key
PRAGMA foreign_keys = ON;