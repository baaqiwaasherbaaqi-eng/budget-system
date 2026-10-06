-- ============================================
-- Migration 015: بازسازی کامل جداول بودجه
-- ============================================

-- rename جداول قدیمی
ALTER TABLE budget_executions RENAME TO budget_executions_old;
ALTER TABLE budget_allocations RENAME TO budget_allocations_old;
ALTER TABLE approval_history RENAME TO approval_history_old;
ALTER TABLE budget_revisions RENAME TO budget_revisions_old;
ALTER TABLE budget_proposals RENAME TO budget_proposals_old;
ALTER TABLE organizations RENAME TO organizations_old;
ALTER TABLE economic_classifications RENAME TO economic_classifications_old;

-- جدول جدید budget_proposals
CREATE TABLE budget_proposals (
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
    created_at_shamsi TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at_shamsi TEXT,
    submitted_at DATETIME,
    submitted_by INTEGER,
    approved_at DATETIME,
    approved_by INTEGER,
    rejected_at DATETIME,
    rejected_by INTEGER,
    rejection_reason TEXT,
    FOREIGN KEY (fiscal_year_id) REFERENCES fiscal_years(id),
    FOREIGN KEY (organization_id) REFERENCES base_data(id),
    FOREIGN KEY (economic_class_id) REFERENCES base_data(id),
    FOREIGN KEY (proposed_by) REFERENCES users(id)
);

CREATE INDEX idx_budget_proposals_fiscal ON budget_proposals(fiscal_year_id);
CREATE INDEX idx_budget_proposals_org ON budget_proposals(organization_id);
CREATE INDEX idx_budget_proposals_econ ON budget_proposals(economic_class_id);
CREATE INDEX idx_budget_proposals_status ON budget_proposals(status);

-- جدول جدید budget_allocations
CREATE TABLE budget_allocations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    approved_budget_id INTEGER NOT NULL,
    organization_id INTEGER NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    percentage DECIMAL(5,2),
    allocation_date TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at_shamsi TEXT,
    FOREIGN KEY (approved_budget_id) REFERENCES budget_proposals(id),
    FOREIGN KEY (organization_id) REFERENCES base_data(id)
);

CREATE INDEX idx_budget_allocations_budget ON budget_allocations(approved_budget_id);
CREATE INDEX idx_budget_allocations_org ON budget_allocations(organization_id);

-- جدول جدید budget_executions
CREATE TABLE budget_executions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    allocation_id INTEGER NOT NULL,
    technical_code TEXT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    description TEXT,
    execution_date TEXT,
    approved_by_chain TEXT,
    accounting_doc_no TEXT,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'executed', 'rejected')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at_shamsi TEXT,
    FOREIGN KEY (allocation_id) REFERENCES budget_allocations(id)
);

CREATE INDEX idx_budget_executions_allocation ON budget_executions(allocation_id);

-- جدول جدید approval_history
CREATE TABLE approval_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    budget_proposal_id INTEGER NOT NULL,
    from_status TEXT NOT NULL,
    to_status TEXT NOT NULL,
    action_by INTEGER NOT NULL,
    action_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    comment TEXT,
    FOREIGN KEY (budget_proposal_id) REFERENCES budget_proposals(id),
    FOREIGN KEY (action_by) REFERENCES users(id)
);

CREATE INDEX idx_approval_history_budget ON approval_history(budget_proposal_id);

-- جدول جدید budget_revisions
CREATE TABLE budget_revisions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fiscal_year_id INTEGER NOT NULL,
    budget_proposal_id INTEGER,
    revision_type TEXT NOT NULL CHECK(revision_type IN ('add', 'increase', 'decrease', 'remove')),
    old_amount DECIMAL(15,2),
    new_amount DECIMAL(15,2),
    difference DECIMAL(15,2),
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
    created_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at_shamsi TEXT,
    approved_by INTEGER,
    approved_at DATETIME,
    FOREIGN KEY (fiscal_year_id) REFERENCES fiscal_years(id),
    FOREIGN KEY (budget_proposal_id) REFERENCES budget_proposals(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (approved_by) REFERENCES users(id)
);

CREATE INDEX idx_budget_revisions_fiscal ON budget_revisions(fiscal_year_id);
CREATE INDEX idx_budget_revisions_budget ON budget_revisions(budget_proposal_id);