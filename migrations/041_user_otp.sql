-- ============================================
-- Migration 041: OTP برای لاگین
-- ============================================

ALTER TABLE users ADD COLUMN mobile TEXT;

CREATE TABLE IF NOT EXISTS login_otp (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    username TEXT NOT NULL,
    mobile TEXT,
    otp_code TEXT NOT NULL,
    otp_sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    otp_expires_at DATETIME,
    verified_at DATETIME,
    attempts INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending',  -- pending, verified, expired, failed
    ip_address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at_shamsi TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_login_otp_user ON login_otp(user_id);
CREATE INDEX IF NOT EXISTS idx_login_otp_status ON login_otp(status);
CREATE INDEX IF NOT EXISTS idx_login_otp_mobile ON login_otp(mobile);