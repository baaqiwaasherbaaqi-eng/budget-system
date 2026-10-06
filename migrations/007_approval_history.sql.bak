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