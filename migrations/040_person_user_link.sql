-- ============================================
-- Migration 040: اتصال اشخاص به کاربران
-- ============================================

-- فیلد user_id توی persons
ALTER TABLE persons ADD COLUMN user_id INTEGER;

-- جدول user_creation_log برای OTP ثبت‌نام
CREATE TABLE IF NOT EXISTS user_creation_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    person_id INTEGER NOT NULL,
    national_id TEXT NOT NULL,
    username TEXT NOT NULL,
    temp_password TEXT,
    otp_code TEXT,
    mobile TEXT,
    status TEXT DEFAULT 'pending', -- pending, created, sent, failed
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at_shamsi TEXT,
    sent_at DATETIME,
    notes TEXT,
    FOREIGN KEY (person_id) REFERENCES persons(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ucl_person ON user_creation_log(person_id);
CREATE INDEX IF NOT EXISTS idx_ucl_status ON user_creation_log(status);