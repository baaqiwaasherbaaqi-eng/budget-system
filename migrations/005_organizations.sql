CREATE TABLE organizations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fiscal_year_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('general', 'specific')),
    manager_name TEXT,
    finance_manager_name TEXT,
    parent_id INTEGER,
    is_cost_center BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (fiscal_year_id) REFERENCES fiscal_years(id),
    FOREIGN KEY (parent_id) REFERENCES organizations(id)
);