-- ============================================
-- Migration 028: جدول وظایف کارکنان
-- ============================================

CREATE TABLE IF NOT EXISTS employee_tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    person_id INTEGER NOT NULL,
    
    -- مرجع طبقه‌بندی عملیاتی
    task_type TEXT NOT NULL,          -- mission, program, service, plan, activity, project
    task_id INTEGER NOT NULL,         -- id توی base_data (section='operational')
    
    -- اطلاعات
    task_title TEXT,                  -- عنوان (کپی برای سریع‌خوانی)
    percentage INTEGER NOT NULL DEFAULT 0,  -- درصد زمانی (0-100)
    
    -- عمومی
    notes TEXT,
    is_active BOOLEAN DEFAULT 1,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at_shamsi TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at_shamsi TEXT,
    
    FOREIGN KEY (person_id) REFERENCES persons(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_employee_tasks_person ON employee_tasks(person_id);
CREATE INDEX IF NOT EXISTS idx_employee_tasks_type ON employee_tasks(task_type);
CREATE INDEX IF NOT EXISTS idx_employee_tasks_task ON employee_tasks(task_id);