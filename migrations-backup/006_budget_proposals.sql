CREATE TABLE budget_proposals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fiscal_year_id INTEGER NOT NULL,
    organization_id INTEGER NOT NULL,
    economic_class_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'submitted', 'approved', 'rejected')),
    proposed_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (fiscal_year_id) REFERENCES fiscal_years(id),
    FOREIGN KEY (organization_id) REFERENCES organizations(id),
    FOREIGN KEY (economic_class_id) REFERENCES economic_classifications(id),
    FOREIGN KEY (proposed_by) REFERENCES users(id)
);