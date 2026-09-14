-- غیرفعال کردن foreign key
PRAGMA foreign_keys = OFF;

-- ساخت جدول جدید با نقش‌های بیشتر
CREATE TABLE users_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT DEFAULT 'expert' CHECK(role IN ('admin', 'manager', 'expert', 'viewer', 'province', 'ministry')),
    organization TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- انتقال داده‌ها
INSERT INTO users_new 
SELECT * FROM users;

-- حذف جدول قدیمی
DROP TABLE users;

-- تغییر نام جدول جدید
ALTER TABLE users_new RENAME TO users;

-- فعال کردن foreign key
PRAGMA foreign_keys = ON;