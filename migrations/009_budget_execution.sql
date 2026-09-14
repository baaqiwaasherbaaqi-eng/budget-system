-- تخصیص اعتبار
CREATE TABLE budget_allocations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    approved_budget_id INTEGER NOT NULL,
    organization_id INTEGER NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    percentage DECIMAL(5,2),
    allocation_date TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (approved_budget_id) REFERENCES budget_proposals(id),
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

-- اجرای بودجه (تامین اعتبار)
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
    FOREIGN KEY (allocation_id) REFERENCES budget_allocations(id)
);