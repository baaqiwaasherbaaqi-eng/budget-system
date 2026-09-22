CREATE TABLE municipality_info (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    -- موقعیت
    province TEXT,
    county TEXT,
    city TEXT,
    
    -- مشخصات
    title TEXT NOT NULL,
    grade TEXT,
    address TEXT,
    postal_code TEXT,
    economic_code TEXT,
    national_id TEXT,
    
    -- شهردار
    mayor_name TEXT,
    mayor_details TEXT,
    
    -- امضاکنندگان
    finance_signers TEXT,
    treasury_signers TEXT,
    allocation_signers TEXT,
    execution_signers TEXT,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);