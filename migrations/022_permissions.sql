-- ============================================
-- Migration 022: سیستم Permission سفارشی
-- ============================================

-- ============================================
-- جدول Permission های هر نقش (پیش‌فرض)
-- ============================================
CREATE TABLE IF NOT EXISTS role_permissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role TEXT NOT NULL,
    permission_key TEXT NOT NULL,
    granted BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(role, permission_key)
);

CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role);

-- ============================================
-- جدول Permission های اختصاصی هر کاربر (override)
-- ============================================
CREATE TABLE IF NOT EXISTS user_permissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    permission_key TEXT NOT NULL,
    granted BOOLEAN DEFAULT 1,
    granted_by INTEGER,
    granted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, permission_key),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (granted_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_user_permissions_user ON user_permissions(user_id);

-- ============================================
-- Seed: Permission های پیش‌فرض برای admin
-- ============================================
INSERT OR IGNORE INTO role_permissions (role, permission_key, granted) VALUES
    ('admin', 'base_info.view', 1),
    ('admin', 'base_info.edit', 1),
    ('admin', 'persons.view', 1),
    ('admin', 'persons.add', 1),
    ('admin', 'persons.edit', 1),
    ('admin', 'persons.delete', 1),
    ('admin', 'budget.view', 1),
    ('admin', 'budget.add', 1),
    ('admin', 'budget.submit', 1),
    ('admin', 'budget.approve_manager', 1),
    ('admin', 'budget.approve_finance', 1),
    ('admin', 'budget.approve_final', 1),
    ('admin', 'allocations.view', 1),
    ('admin', 'allocations.add', 1),
    ('admin', 'executions.view', 1),
    ('admin', 'executions.add', 1),
    ('admin', 'reports.view', 1),
    ('admin', 'reports.export', 1),
    ('admin', 'users.view', 1),
    ('admin', 'users.add', 1),
    ('admin', 'users.edit', 1),
    ('admin', 'users.delete', 1),
    ('admin', 'users.permissions', 1),
    ('admin', 'fiscal_years.view', 1),
    ('admin', 'fiscal_years.manage', 1),
    ('admin', 'audit_log.view', 1),
    ('admin', 'municipality_info.view', 1),
    ('admin', 'municipality_info.edit', 1);

-- ============================================
-- Seed: Permission های پیش‌فرض برای manager
-- ============================================
INSERT OR IGNORE INTO role_permissions (role, permission_key, granted) VALUES
    ('manager', 'base_info.view', 1),
    ('manager', 'base_info.edit', 1),
    ('manager', 'persons.view', 1),
    ('manager', 'persons.add', 1),
    ('manager', 'persons.edit', 1),
    ('manager', 'persons.delete', 1),
    ('manager', 'budget.view', 1),
    ('manager', 'budget.add', 1),
    ('manager', 'budget.submit', 1),
    ('manager', 'budget.approve_manager', 1),
    ('manager', 'budget.approve_finance', 1),
    ('manager', 'allocations.view', 1),
    ('manager', 'allocations.add', 1),
    ('manager', 'executions.view', 1),
    ('manager', 'executions.add', 1),
    ('manager', 'reports.view', 1),
    ('manager', 'reports.export', 1),
    ('manager', 'users.view', 1),
    ('manager', 'fiscal_years.view', 1),
    ('manager', 'fiscal_years.manage', 1),
    ('manager', 'audit_log.view', 1),
    ('manager', 'municipality_info.view', 1);

-- ============================================
-- Seed: Permission های پیش‌فرض برای expert
-- ============================================
INSERT OR IGNORE INTO role_permissions (role, permission_key, granted) VALUES
    ('expert', 'base_info.view', 1),
    ('expert', 'persons.view', 1),
    ('expert', 'budget.view', 1),
    ('expert', 'budget.add', 1),
    ('expert', 'budget.submit', 1),
    ('expert', 'executions.view', 1),
    ('expert', 'executions.add', 1),
    ('expert', 'reports.view', 1),
    ('expert', 'fiscal_years.view', 1),
    ('expert', 'municipality_info.view', 1);

-- ============================================
-- Seed: Permission های پیش‌فرض برای viewer
-- ============================================
INSERT OR IGNORE INTO role_permissions (role, permission_key, granted) VALUES
    ('viewer', 'base_info.view', 1),
    ('viewer', 'persons.view', 1),
    ('viewer', 'budget.view', 1),
    ('viewer', 'reports.view', 1),
    ('viewer', 'fiscal_years.view', 1),
    ('viewer', 'municipality_info.view', 1);

-- ============================================
-- Seed: Permission های پیش‌فرض برای province
-- ============================================
INSERT OR IGNORE INTO role_permissions (role, permission_key, granted) VALUES
    ('province', 'reports.view', 1),
    ('province', 'reports.export', 1);

-- ============================================
-- Seed: Permission های پیش‌فرض برای ministry
-- ============================================
INSERT OR IGNORE INTO role_permissions (role, permission_key, granted) VALUES
    ('ministry', 'reports.view', 1),
    ('ministry', 'reports.export', 1);