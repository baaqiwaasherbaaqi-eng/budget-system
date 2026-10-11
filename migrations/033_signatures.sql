-- ============================================
-- Migration 033: امضاهای دیجیتال و لاگ SMS
-- ============================================

-- جدول امضاها
CREATE TABLE IF NOT EXISTS signatures (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_type TEXT NOT NULL,       -- decree, contract
    entity_id INTEGER NOT NULL,
    employee_person_id INTEGER NOT NULL,
    
    -- اطلاعات موبایل
    mobile TEXT NOT NULL,
    
    -- OTP
    otp_code TEXT,
    otp_sent_at DATETIME,
    otp_verified_at DATETIME,
    otp_attempts INTEGER DEFAULT 0,
    
    -- امضا
    signed_at DATETIME,
    ip_address TEXT,
    user_agent TEXT,
    
    -- وضعیت
    status TEXT DEFAULT 'pending',    -- pending, sent, verified, expired, failed, cancelled
    
    -- اطلاعات اضافی
    notes TEXT,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at_shamsi TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at_shamsi TEXT,
    
    FOREIGN KEY (employee_person_id) REFERENCES persons(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_signatures_entity ON signatures(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_signatures_employee ON signatures(employee_person_id);
CREATE INDEX IF NOT EXISTS idx_signatures_status ON signatures(status);

-- جدول لاگ SMS
CREATE TABLE IF NOT EXISTS sms_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mobile TEXT NOT NULL,
    message TEXT NOT NULL,
    message_type TEXT,               -- otp, notification, contract_signed, decree_issued, ...
    
    -- ارسال
    provider TEXT DEFAULT 'mock',    -- mock, kavenegar, sms_ir, ...
    provider_message_id TEXT,
    
    -- وضعیت
    status TEXT DEFAULT 'sent',      -- sent, failed, delivered, pending
    error_message TEXT,
    
    -- ارتباط
    entity_type TEXT,
    entity_id INTEGER,
    employee_person_id INTEGER,
    
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    sent_at_shamsi TEXT,
    delivered_at DATETIME,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sms_log_mobile ON sms_log(mobile);
CREATE INDEX IF NOT EXISTS idx_sms_log_entity ON sms_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_sms_log_status ON sms_log(status);