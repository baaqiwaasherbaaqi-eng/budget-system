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
    approved_by INTEGER,
    approved_at DATETIME,
    FOREIGN KEY (fiscal_year_id) REFERENCES fiscal_years(id),
    FOREIGN KEY (budget_proposal_id) REFERENCES budget_proposals(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (approved_by) REFERENCES users(id)
);