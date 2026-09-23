-- ============================================
-- Migration 015b: rebuild دو جدول وابسته
-- ============================================

-- rename قدیمی‌ها
ALTER TABLE budget_approval_logs RENAME TO budget_approval_logs_old;
ALTER TABLE council_resolutions RENAME TO council_resolutions_old;

-- ============================================
-- جدول جدید budget_approval_logs
-- ============================================

CREATE TABLE budget_approval_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    budget_proposal_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    from_status TEXT,
    to_status TEXT NOT NULL,
    user_id INTEGER,
    note TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (budget_proposal_id) REFERENCES budget_proposals(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_budget_approval_logs_proposal ON budget_approval_logs(budget_proposal_id);

-- ============================================
-- جدول جدید council_resolutions
-- ============================================

CREATE TABLE council_resolutions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    budget_proposal_id INTEGER NOT NULL,
    resolution_number TEXT NOT NULL,
    resolution_date TEXT NOT NULL,
    content TEXT,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (budget_proposal_id) REFERENCES budget_proposals(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX idx_council_resolutions_proposal ON council_resolutions(budget_proposal_id);