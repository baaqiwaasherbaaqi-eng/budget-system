PRAGMA defer_foreign_keys=TRUE;
CREATE TABLE fiscal_years (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    year INTEGER NOT NULL UNIQUE,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    is_active BOOLEAN DEFAULT 0,
    status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'active', 'closed', 'archived')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
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
CREATE TABLE budget_allocations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    approved_budget_id INTEGER NOT NULL,
    organization_id INTEGER NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    percentage DECIMAL(5,2),
    allocation_date TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (approved_budget_id) REFERENCES budget_proposals(id),
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
);
CREATE TABLE budget_executions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    allocation_id INTEGER NOT NULL,
    technical_code TEXT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    description TEXT,
    execution_date TEXT,
    approved_by_chain TEXT,
    accounting_doc_no TEXT,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'executed', 'rejected')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (allocation_id) REFERENCES budget_allocations(id)
);
CREATE TABLE IF NOT EXISTS "users" (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT DEFAULT 'expert' CHECK(role IN ('admin', 'manager', 'expert', 'viewer', 'province', 'ministry')),
    organization TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "users" ("id","username","password_hash","full_name","role","organization","is_active","created_at") VALUES(1,'admin','3eb3fe66b31e3b4d10fa70b5cad49c7112294af6ae4e476a1c405155d45aa121','مدیر سیستم','admin',NULL,1,'2026-10-06 15:18:00');
CREATE TABLE budget_revisions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fiscal_year_id INTEGER NOT NULL,
    budget_proposal_id INTEGER,
    revision_type TEXT NOT NULL CHECK(revision_type IN ('add', 'increase', 'decrease', 'remove')),
    old_amount DECIMAL(15,2),
    new_amount DECIMAL(15,2),
    difference DECIMAL(15,2),
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
    created_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    approved_by INTEGER,
    approved_at DATETIME,
    FOREIGN KEY (fiscal_year_id) REFERENCES fiscal_years(id),
    FOREIGN KEY (budget_proposal_id) REFERENCES budget_proposals(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (approved_by) REFERENCES users(id)
);
CREATE TABLE audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    username TEXT,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id INTEGER,
    details TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
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
CREATE TABLE base_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fiscal_year_id INTEGER,
    section TEXT NOT NULL,
    type TEXT,
    prefix TEXT,
    code TEXT NOT NULL,
    digit_count INTEGER DEFAULT 3,
    level INTEGER DEFAULT 0,
    level_name TEXT,
    title TEXT NOT NULL,
    parent_id INTEGER,
    description TEXT,
    extra_data TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,

    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at_shamsi TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at_shamsi TEXT,

    FOREIGN KEY (fiscal_year_id) REFERENCES fiscal_years(id),
    FOREIGN KEY (parent_id) REFERENCES base_data(id)
);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(1,NULL,'economic','resource',NULL,'001',3,0,'گروه','منابع (درآمدها)',NULL,NULL,NULL,1,1,'2026-10-06 15:18:22','1405/06/31','2026-10-06 15:18:22',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(2,NULL,'economic','resource',NULL,'001001',3,1,'سرفصل','درآمدهای ناشی از عوارض عمومی (مستمر)',1,NULL,NULL,1,1,'2026-10-06 15:18:22','1405/06/31','2026-10-06 15:18:22',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(3,NULL,'economic','resource',NULL,'001002',3,1,'سرفصل','درآمدهای ناشی از عوارض اختصاصی',1,NULL,NULL,2,1,'2026-10-06 15:18:22','1405/06/31','2026-10-06 15:18:22',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(4,NULL,'economic','resource',NULL,'001003',3,1,'سرفصل','بهای خدمات و درآمدهای مؤسسات انتفاعی شهرداری',1,NULL,NULL,3,1,'2026-10-06 15:18:22','1405/06/31','2026-10-06 15:18:22',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(5,NULL,'economic','resource',NULL,'001004',3,1,'سرفصل','درآمدهای حاصل از وجوه و اموال شهرداری',1,NULL,NULL,4,1,'2026-10-06 15:18:22','1405/06/31','2026-10-06 15:18:22',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(6,NULL,'economic','resource',NULL,'001005',3,1,'سرفصل','کمک‌های اعطائی دولت و سازمان‌های دولتی',1,NULL,NULL,5,1,'2026-10-06 15:18:22','1405/06/31','2026-10-06 15:18:22',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(7,NULL,'economic','resource',NULL,'001006',3,1,'سرفصل','اعانات و کمک‌های اهدائی اشخاص و سازمان‌های خصوصی',1,NULL,NULL,6,1,'2026-10-06 15:18:22','1405/06/31','2026-10-06 15:18:22',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(8,NULL,'economic','resource',NULL,'001007',3,1,'سرفصل','واگذاری دارائی‌های سرمایه‌ای',1,NULL,NULL,7,1,'2026-10-06 15:18:22','1405/06/31','2026-10-06 15:18:22',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(9,NULL,'economic','resource',NULL,'001008',3,1,'سرفصل','واگذاری دارائی‌های مالی',1,NULL,NULL,8,1,'2026-10-06 15:18:22','1405/06/31','2026-10-06 15:18:22',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(10,NULL,'economic','resource',NULL,'001007001',3,2,'بند','درآمدهای نقدی و غیرنقدی ناشی از اجرای تبصره ۴ ماده ۱۰۱',8,NULL,NULL,1,1,'2026-10-06 15:18:22','1405/06/31','2026-10-06 15:18:22',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(11,NULL,'economic','resource',NULL,'001007002',3,2,'بند','فروش اموال غیر منقول',8,NULL,NULL,2,1,'2026-10-06 15:18:22','1405/06/31','2026-10-06 15:18:22',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(12,NULL,'economic','resource',NULL,'001007003',3,2,'بند','فروش اموال منقول و اسقاطی',8,NULL,NULL,3,1,'2026-10-06 15:18:22','1405/06/31','2026-10-06 15:18:22',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(13,NULL,'economic','resource',NULL,'001007004',3,2,'بند','فروش سرقفلی',8,NULL,NULL,4,1,'2026-10-06 15:18:22','1405/06/31','2026-10-06 15:18:22',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(14,NULL,'economic','resource',NULL,'001007005',3,2,'بند','فروش حقوق انتفاعی',8,NULL,NULL,5,1,'2026-10-06 15:18:22','1405/06/31','2026-10-06 15:18:22',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(15,NULL,'economic','resource',NULL,'001007006',3,2,'بند','سایر',8,NULL,NULL,6,1,'2026-10-06 15:18:22','1405/06/31','2026-10-06 15:18:22',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(16,NULL,'economic','resource',NULL,'001008001',3,2,'بند','وام‌های دریافتی',9,NULL,NULL,1,1,'2026-10-06 15:18:22','1405/06/31','2026-10-06 15:18:22',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(17,NULL,'economic','resource',NULL,'001008002',3,2,'بند','اوراق مشارکت',9,NULL,NULL,2,1,'2026-10-06 15:18:22','1405/06/31','2026-10-06 15:18:22',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(18,NULL,'economic','resource',NULL,'001008003',3,2,'بند','سایر منابع',9,NULL,NULL,3,1,'2026-10-06 15:18:22','1405/06/31','2026-10-06 15:18:22',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(19,NULL,'economic','expense',NULL,'002',3,0,'گروه','مصارف (هزینه‌ها)',NULL,NULL,NULL,2,1,'2026-10-06 15:18:22','1405/06/31','2026-10-06 15:18:22',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(20,NULL,'economic','expense',NULL,'002001',3,1,'سرفصل','هزینه‌ها (جاری)',19,NULL,NULL,1,1,'2026-10-06 15:18:22','1405/06/31','2026-10-06 15:18:22',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(21,NULL,'economic','expense',NULL,'002002',3,1,'سرفصل','تملک دارائی‌های سرمایه‌ای',19,NULL,NULL,2,1,'2026-10-06 15:18:22','1405/06/31','2026-10-06 15:18:22',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(22,NULL,'economic','expense',NULL,'002003',3,1,'سرفصل','تملک دارائی‌های مالی',19,NULL,NULL,3,1,'2026-10-06 15:18:22','1405/06/31','2026-10-06 15:18:22',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(23,NULL,'economic','expense',NULL,'002001001',3,2,'فصل','فصل اول - جبران خدمات کارکنان',20,NULL,NULL,1,1,'2026-10-06 15:18:22','1405/06/31','2026-10-06 15:18:22',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(24,NULL,'economic','expense',NULL,'002001002',3,2,'فصل','فصل دوم',20,NULL,NULL,2,1,'2026-10-06 15:18:22','1405/06/31','2026-10-06 15:18:22',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(25,NULL,'economic','expense',NULL,'002001003',3,2,'فصل','فصل سوم',20,NULL,NULL,3,1,'2026-10-06 15:18:22','1405/06/31','2026-10-06 15:18:22',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(26,NULL,'economic','expense',NULL,'002001004',3,2,'فصل','فصل چهارم',20,NULL,NULL,4,1,'2026-10-06 15:18:22','1405/06/31','2026-10-06 15:18:22',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(27,NULL,'economic','expense',NULL,'002001005',3,2,'فصل','فصل پنجم',20,NULL,NULL,5,1,'2026-10-06 15:18:22','1405/06/31','2026-10-06 15:18:22',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(28,NULL,'economic','expense',NULL,'002001006',3,2,'فصل','فصل ششم',20,NULL,NULL,6,1,'2026-10-06 15:18:22','1405/06/31','2026-10-06 15:18:22',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(29,NULL,'economic','expense',NULL,'002001007',3,2,'فصل','فصل هفتم',20,NULL,NULL,7,1,'2026-10-06 15:18:22','1405/06/31','2026-10-06 15:18:22',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(30,NULL,'economic','expense',NULL,'002001008',3,2,'فصل','فصل هشتم',20,NULL,NULL,8,1,'2026-10-06 15:18:22','1405/06/31','2026-10-06 15:18:22',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(31,NULL,'economic','expense',NULL,'002001001001',3,3,'بند','حقوق و دستمزد',23,NULL,NULL,1,1,'2026-10-06 15:18:22','1405/06/31','2026-10-06 15:18:22',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(32,NULL,'economic','expense',NULL,'002001001001001',3,4,'جزء','حقوق شهردار',31,NULL,NULL,1,1,'2026-10-06 15:18:22','1405/06/31','2026-10-06 15:18:22',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(33,NULL,'economic','expense',NULL,'002001001001002',3,4,'جزء','حقوق کارمندان رسمی و پیمانی (تأمین اجتماعی)',31,NULL,NULL,2,1,'2026-10-06 15:18:22','1405/06/31','2026-10-06 15:18:22',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(34,NULL,'economic','expense',NULL,'002002001',3,2,'بند','ساختمان و سایر مستحدثات',21,NULL,NULL,1,1,'2026-10-06 15:18:22','1405/06/31','2026-10-06 15:18:22',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(35,NULL,'economic','expense',NULL,'002002002',3,2,'بند','ماشین‌آلات و تجهیزات',21,NULL,NULL,2,1,'2026-10-06 15:18:22','1405/06/31','2026-10-06 15:18:22',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(36,NULL,'economic','expense',NULL,'002002003',3,2,'بند','سایر دارائی‌های ثابت',21,NULL,NULL,3,1,'2026-10-06 15:18:22','1405/06/31','2026-10-06 15:18:22',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(37,NULL,'economic','expense',NULL,'002002004',3,2,'بند','موجودی انبار',21,NULL,NULL,4,1,'2026-10-06 15:18:22','1405/06/31','2026-10-06 15:18:22',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(38,NULL,'economic','expense',NULL,'002002005',3,2,'بند','اقلام گرانبها',21,NULL,NULL,5,1,'2026-10-06 15:18:22','1405/06/31','2026-10-06 15:18:22',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(39,NULL,'economic','expense',NULL,'002002006',3,2,'بند','زمین',21,NULL,NULL,6,1,'2026-10-06 15:18:22','1405/06/31','2026-10-06 15:18:22',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(40,NULL,'economic','expense',NULL,'002002007',3,2,'بند','سایر دارائی‌های تولید نشده',21,NULL,NULL,7,1,'2026-10-06 15:18:22','1405/06/31','2026-10-06 15:18:22',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(41,NULL,'economic','expense',NULL,'002003001',3,2,'بند','تعهدات قطعی نشده انتقالی سنواتی',22,NULL,NULL,1,1,'2026-10-06 15:18:22','1405/06/31','2026-10-06 15:18:22',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(42,NULL,'economic','expense',NULL,'002003002',3,2,'بند','بازپرداخت اصل و سود تسهیلات داخلی',22,NULL,NULL,2,1,'2026-10-06 15:18:22','1405/06/31','2026-10-06 15:18:22',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(43,NULL,'economic','expense',NULL,'002003003',3,2,'بند','بازپرداخت اصل و سود تسهیلات خارجی',22,NULL,NULL,3,1,'2026-10-06 15:18:22','1405/06/31','2026-10-06 15:18:22',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(44,NULL,'economic','expense',NULL,'002003004',3,2,'بند','بازپرداخت اصل و سود اوراق مشارکت، صکوک و سایر',22,NULL,NULL,4,1,'2026-10-06 15:18:22','1405/06/31','2026-10-06 15:18:22',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(46,NULL,'accounting','asset','ح','ح-001',3,0,'گروه','دارایی‌ها',NULL,NULL,NULL,1,1,'2026-10-06 15:18:26','1405/06/31','2026-10-06 15:18:26',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(47,NULL,'accounting','liability','ح','ح-002',3,0,'گروه','بدهی‌ها',NULL,NULL,NULL,2,1,'2026-10-06 15:18:26','1405/06/31','2026-10-06 15:18:26',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(48,NULL,'accounting','equity','ح','ح-003',3,0,'گروه','سرمایه',NULL,NULL,NULL,3,1,'2026-10-06 15:18:26','1405/06/31','2026-10-06 15:18:26',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(49,NULL,'accounting','performance','ح','ح-004',3,0,'گروه','عملکرد (مازاد/کسری) درآمد بر هزینه',NULL,NULL,NULL,4,1,'2026-10-06 15:18:26','1405/06/31','2026-10-06 15:18:26',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(50,NULL,'accounting','warehouse','ح','ح-005',3,0,'گروه','انبارداری',NULL,NULL,NULL,5,1,'2026-10-06 15:18:26','1405/06/31','2026-10-06 15:18:26',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(51,NULL,'accounting','asset','ح','ح-001001',3,1,'سرفصل','موجودی نقد و بانک‌ها (نقل از خزانه‌داری)',46,NULL,NULL,1,1,'2026-10-06 15:18:26','1405/06/31','2026-10-06 15:18:26',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(52,NULL,'accounting','asset','ح','ح-001002',3,1,'سرفصل','بدهکاران',46,NULL,NULL,2,1,'2026-10-06 15:18:26','1405/06/31','2026-10-06 15:18:26',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(53,NULL,'accounting','asset','ح','ح-001003',3,1,'سرفصل','اموال',46,NULL,NULL,3,1,'2026-10-06 15:18:26','1405/06/31','2026-10-06 15:18:26',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(54,NULL,'accounting','asset','ح','ح-001002001',3,2,'کل','بدهکاران حقیقی (نقل از اشخاص)',52,NULL,NULL,1,1,'2026-10-06 15:18:26','1405/06/31','2026-10-06 15:18:26',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(55,NULL,'accounting','asset','ح','ح-001002002',3,2,'کل','بدهکاران حقوقی (نقل از اشخاص)',52,NULL,NULL,2,1,'2026-10-06 15:18:26','1405/06/31','2026-10-06 15:18:26',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(56,NULL,'accounting','asset','ح','ح-001003001',3,2,'کل','اموال منقول (تقسیم‌بندی بر اساس جدول ۱۵۱ قانون مالیات‌های مستقیم)',53,NULL,NULL,1,1,'2026-10-06 15:18:26','1405/06/31','2026-10-06 15:18:26',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(57,NULL,'accounting','asset','ح','ح-001003002',3,2,'کل','اموال غیر منقول',53,NULL,NULL,2,1,'2026-10-06 15:18:26','1405/06/31','2026-10-06 15:18:26',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(58,NULL,'accounting','liability','ح','ح-002001',3,1,'سرفصل','بستانکاران',47,NULL,NULL,1,1,'2026-10-06 15:18:26','1405/06/31','2026-10-06 15:18:26',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(59,NULL,'accounting','liability','ح','ح-002001001',3,2,'کل','بستانکاران حقیقی (نقل از اشخاص)',58,NULL,NULL,1,1,'2026-10-06 15:18:26','1405/06/31','2026-10-06 15:18:26',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(60,NULL,'accounting','liability','ح','ح-002001002',3,2,'کل','بستانکاران حقوقی (نقل از اشخاص)',58,NULL,NULL,2,1,'2026-10-06 15:18:26','1405/06/31','2026-10-06 15:18:26',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(61,NULL,'accounting','warehouse','ح','ح-005001',3,1,'سرفصل','کدینگ کالاهای انبار بر اساس استاندارد انبارداری',50,NULL,NULL,1,1,'2026-10-06 15:18:26','1405/06/31','2026-10-06 15:18:26',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(62,NULL,'accounting','warehouse','ح','ح-005002',3,1,'سرفصل','تعریف کد اموال',50,NULL,NULL,2,1,'2026-10-06 15:18:26','1405/06/31','2026-10-06 15:18:26',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(63,NULL,'accounting','warehouse','ح','ح-005003',3,1,'سرفصل','تعریف استهلاکات اموال بر اساس ق.م.م',50,NULL,NULL,3,1,'2026-10-06 15:18:26','1405/06/31','2026-10-06 15:18:26',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(64,NULL,'accounting','warehouse','ح','ح-005004',3,1,'سرفصل','جعداری اموال',50,NULL,NULL,4,1,'2026-10-06 15:18:26','1405/06/31','2026-10-06 15:18:26',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(65,NULL,'accounting','warehouse','ح','ح-005002001',3,2,'کل','اموال سرمایه‌ای',62,NULL,NULL,1,1,'2026-10-06 15:18:26','1405/06/31','2026-10-06 15:18:26',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(66,NULL,'accounting','warehouse','ح','ح-005002002',3,2,'کل','اموال اداری',62,NULL,NULL,2,1,'2026-10-06 15:18:26','1405/06/31','2026-10-06 15:18:26',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(67,NULL,'accounting','warehouse','ح','ح-005002003',3,2,'کل','اموال در حکم مصرفی',62,NULL,NULL,3,1,'2026-10-06 15:18:26','1405/06/31','2026-10-06 15:18:26',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(68,NULL,'accounting','warehouse','ح','ح-005002004',3,2,'کل','اموال مصرفی',62,NULL,NULL,4,1,'2026-10-06 15:18:26','1405/06/31','2026-10-06 15:18:26',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(69,NULL,'accounting','warehouse','ح','ح-005004001',3,2,'کل','ثبت اموال تحویلی اداری',64,NULL,NULL,1,1,'2026-10-06 15:18:26','1405/06/31','2026-10-06 15:18:26',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(70,NULL,'accounting','warehouse','ح','ح-005004002',3,2,'کل','ثبت اموال منقول تحویلی',64,NULL,NULL,2,1,'2026-10-06 15:18:26','1405/06/31','2026-10-06 15:18:26',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(71,NULL,'accounting','warehouse','ح','ح-005004003',3,2,'کل','ثبت اموال غیرمنقول تحویلی',64,NULL,NULL,3,1,'2026-10-06 15:18:26','1405/06/31','2026-10-06 15:18:26',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(72,NULL,'accounting','warehouse','ح','ح-005004004',3,2,'کل','ثبت گردش اموال بین کارکنان',64,NULL,NULL,4,1,'2026-10-06 15:18:26','1405/06/31','2026-10-06 15:18:26',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(73,NULL,'budget_type','credit',NULL,'001',3,0,'نوع','اعتبارات هزینه‌ای',NULL,NULL,NULL,1,1,'2026-10-06 15:18:28','1405/06/31','2026-10-06 15:18:28',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(74,NULL,'budget_type','credit',NULL,'002',3,0,'نوع','اعتبارات تملک دارایی سرمایه‌ای',NULL,NULL,NULL,2,1,'2026-10-06 15:18:28','1405/06/31','2026-10-06 15:18:28',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(75,NULL,'budget_type','credit',NULL,'003',3,0,'نوع','اعتبارات تملک دارایی مالی',NULL,NULL,NULL,3,1,'2026-10-06 15:18:28','1405/06/31','2026-10-06 15:18:28',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(76,NULL,'budget_type','usage',NULL,'001',3,0,'نوع','مصرف عمومی',NULL,NULL,NULL,1,1,'2026-10-06 15:18:28','1405/06/31','2026-10-06 15:18:28',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(77,NULL,'budget_type','usage',NULL,'002',3,0,'نوع','مصرف اختصاصی',NULL,NULL,NULL,2,1,'2026-10-06 15:18:28','1405/06/31','2026-10-06 15:18:28',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(78,NULL,'goods','goods',NULL,'1',3,1,'گروه اصلی','کالاها',NULL,NULL,NULL,0,1,'2026-10-06 15:18:33',NULL,'2026-10-06 15:18:33',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(79,NULL,'goods','goods',NULL,'2',3,1,'گروه اصلی','خدمات',NULL,NULL,NULL,0,1,'2026-10-06 15:18:33',NULL,'2026-10-06 15:18:33',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(80,NULL,'goods','goods',NULL,'3',3,1,'گروه اصلی','دارایی‌های ثابت',NULL,NULL,NULL,0,1,'2026-10-06 15:18:33',NULL,'2026-10-06 15:18:33',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(81,NULL,'goods','goods',NULL,'101',3,2,'گروه فرعی','مواد مصرفی',78,NULL,NULL,0,1,'2026-10-06 15:18:33',NULL,'2026-10-06 15:18:33',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(82,NULL,'goods','goods',NULL,'102',3,2,'گروه فرعی','قطعات یدکی',78,NULL,NULL,0,1,'2026-10-06 15:18:33',NULL,'2026-10-06 15:18:33',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(83,NULL,'goods','goods',NULL,'103',3,2,'گروه فرعی','لوازم اداری',78,NULL,NULL,0,1,'2026-10-06 15:18:33',NULL,'2026-10-06 15:18:33',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(84,NULL,'goods','goods',NULL,'104',3,2,'گروه فرعی','تجهیزات فنی',78,NULL,NULL,0,1,'2026-10-06 15:18:33',NULL,'2026-10-06 15:18:33',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(85,NULL,'goods','goods',NULL,'105',3,2,'گروه فرعی','ابزارآلات',78,NULL,NULL,0,1,'2026-10-06 15:18:33',NULL,'2026-10-06 15:18:33',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(86,NULL,'goods','goods',NULL,'201',3,2,'گروه فرعی','خدمات فنی و مهندسی',79,NULL,NULL,0,1,'2026-10-06 15:18:33',NULL,'2026-10-06 15:18:33',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(87,NULL,'goods','goods',NULL,'202',3,2,'گروه فرعی','خدمات عمومی',79,NULL,NULL,0,1,'2026-10-06 15:18:33',NULL,'2026-10-06 15:18:33',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(88,NULL,'goods','goods',NULL,'203',3,2,'گروه فرعی','خدمات آموزشی',79,NULL,NULL,0,1,'2026-10-06 15:18:33',NULL,'2026-10-06 15:18:33',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(89,NULL,'goods','goods',NULL,'204',3,2,'گروه فرعی','خدمات بهداشتی و درمانی',79,NULL,NULL,0,1,'2026-10-06 15:18:33',NULL,'2026-10-06 15:18:33',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(90,NULL,'goods','goods',NULL,'205',3,2,'گروه فرعی','خدمات فرهنگی و هنری',79,NULL,NULL,0,1,'2026-10-06 15:18:33',NULL,'2026-10-06 15:18:33',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(91,NULL,'goods','goods',NULL,'206',3,2,'گروه فرعی','خدمات رایانه‌ای و نرم‌افزاری',79,NULL,NULL,0,1,'2026-10-06 15:18:33',NULL,'2026-10-06 15:18:33',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(92,NULL,'goods','goods',NULL,'207',3,2,'گروه فرعی','خدمات حمل و نقل',79,NULL,NULL,0,1,'2026-10-06 15:18:33',NULL,'2026-10-06 15:18:33',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(93,NULL,'goods','goods',NULL,'301',3,2,'گروه فرعی','ساختمان‌ها',80,NULL,NULL,0,1,'2026-10-06 15:18:33',NULL,'2026-10-06 15:18:33',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(94,NULL,'goods','goods',NULL,'302',3,2,'گروه فرعی','ماشین‌آلات و تجهیزات',80,NULL,NULL,0,1,'2026-10-06 15:18:33',NULL,'2026-10-06 15:18:33',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(95,NULL,'goods','goods',NULL,'303',3,2,'گروه فرعی','وسایل نقلیه',80,NULL,NULL,0,1,'2026-10-06 15:18:33',NULL,'2026-10-06 15:18:33',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(96,NULL,'goods','goods',NULL,'304',3,2,'گروه فرعی','اثاثیه و منصوبات',80,NULL,NULL,0,1,'2026-10-06 15:18:33',NULL,'2026-10-06 15:18:33',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(97,NULL,'goods','goods',NULL,'305',3,2,'گروه فرعی','زمین',80,NULL,NULL,0,1,'2026-10-06 15:18:33',NULL,'2026-10-06 15:18:33',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(98,NULL,'goods','goods',NULL,'306',3,2,'گروه فرعی','دارایی‌های نامشهود',80,NULL,NULL,0,1,'2026-10-06 15:18:33',NULL,'2026-10-06 15:18:33',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(99,NULL,'organization','general','س','س-001',3,0,'حوزه','حوزه شهردار',NULL,NULL,NULL,1,1,'2026-10-06 15:20:39','1405/06/31','2026-10-06 15:20:39',NULL);
CREATE TABLE role_permissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role TEXT NOT NULL,
    permission_key TEXT NOT NULL,
    granted BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(role, permission_key)
);
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(1,'admin','base_info.view',1,'2026-10-06 15:18:35');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(2,'admin','base_info.edit',1,'2026-10-06 15:18:35');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(3,'admin','persons.view',1,'2026-10-06 15:18:35');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(4,'admin','persons.add',1,'2026-10-06 15:18:35');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(5,'admin','persons.edit',1,'2026-10-06 15:18:35');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(6,'admin','persons.delete',1,'2026-10-06 15:18:35');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(7,'admin','budget.view',1,'2026-10-06 15:18:35');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(8,'admin','budget.add',1,'2026-10-06 15:18:35');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(9,'admin','budget.submit',1,'2026-10-06 15:18:35');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(10,'admin','budget.approve_manager',1,'2026-10-06 15:18:35');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(11,'admin','budget.approve_finance',1,'2026-10-06 15:18:35');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(12,'admin','budget.approve_final',1,'2026-10-06 15:18:35');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(13,'admin','allocations.view',1,'2026-10-06 15:18:35');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(14,'admin','allocations.add',1,'2026-10-06 15:18:35');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(15,'admin','executions.view',1,'2026-10-06 15:18:35');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(16,'admin','executions.add',1,'2026-10-06 15:18:35');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(17,'admin','reports.view',1,'2026-10-06 15:18:35');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(18,'admin','reports.export',1,'2026-10-06 15:18:35');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(19,'admin','users.view',1,'2026-10-06 15:18:35');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(20,'admin','users.add',1,'2026-10-06 15:18:35');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(21,'admin','users.edit',1,'2026-10-06 15:18:35');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(22,'admin','users.delete',1,'2026-10-06 15:18:35');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(23,'admin','users.permissions',1,'2026-10-06 15:18:35');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(24,'admin','fiscal_years.view',1,'2026-10-06 15:18:35');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(25,'admin','fiscal_years.manage',1,'2026-10-06 15:18:35');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(26,'admin','audit_log.view',1,'2026-10-06 15:18:35');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(27,'admin','municipality_info.view',1,'2026-10-06 15:18:35');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(28,'admin','municipality_info.edit',1,'2026-10-06 15:18:35');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(29,'manager','base_info.view',1,'2026-10-06 15:18:35');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(30,'manager','base_info.edit',1,'2026-10-06 15:18:35');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(31,'manager','persons.view',1,'2026-10-06 15:18:35');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(32,'manager','persons.add',1,'2026-10-06 15:18:35');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(33,'manager','persons.edit',1,'2026-10-06 15:18:35');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(34,'manager','persons.delete',1,'2026-10-06 15:18:35');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(35,'manager','budget.view',1,'2026-10-06 15:18:35');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(36,'manager','budget.add',1,'2026-10-06 15:18:35');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(37,'manager','budget.submit',1,'2026-10-06 15:18:35');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(38,'manager','budget.approve_manager',1,'2026-10-06 15:18:35');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(39,'manager','budget.approve_finance',1,'2026-10-06 15:18:35');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(40,'manager','allocations.view',1,'2026-10-06 15:18:35');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(41,'manager','allocations.add',1,'2026-10-06 15:18:35');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(42,'manager','executions.view',1,'2026-10-06 15:18:35');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(43,'manager','executions.add',1,'2026-10-06 15:18:35');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(44,'manager','reports.view',1,'2026-10-06 15:18:35');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(45,'manager','reports.export',1,'2026-10-06 15:18:35');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(46,'manager','users.view',1,'2026-10-06 15:18:35');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(47,'manager','fiscal_years.view',1,'2026-10-06 15:18:35');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(48,'manager','fiscal_years.manage',1,'2026-10-06 15:18:35');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(49,'manager','audit_log.view',1,'2026-10-06 15:18:35');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(50,'manager','municipality_info.view',1,'2026-10-06 15:18:35');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(51,'expert','base_info.view',1,'2026-10-06 15:18:35');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(52,'expert','persons.view',1,'2026-10-06 15:18:35');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(53,'expert','budget.view',1,'2026-10-06 15:18:35');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(54,'expert','budget.add',1,'2026-10-06 15:18:35');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(55,'expert','budget.submit',1,'2026-10-06 15:18:35');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(56,'expert','executions.view',1,'2026-10-06 15:18:35');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(57,'expert','executions.add',1,'2026-10-06 15:18:35');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(58,'expert','reports.view',1,'2026-10-06 15:18:35');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(59,'expert','fiscal_years.view',1,'2026-10-06 15:18:35');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(60,'expert','municipality_info.view',1,'2026-10-06 15:18:35');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(61,'viewer','base_info.view',1,'2026-10-06 15:18:35');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(62,'viewer','persons.view',1,'2026-10-06 15:18:35');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(63,'viewer','budget.view',1,'2026-10-06 15:18:35');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(64,'viewer','reports.view',1,'2026-10-06 15:18:35');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(65,'viewer','fiscal_years.view',1,'2026-10-06 15:18:35');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(66,'viewer','municipality_info.view',1,'2026-10-06 15:18:35');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(67,'province','reports.view',1,'2026-10-06 15:18:35');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(68,'province','reports.export',1,'2026-10-06 15:18:35');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(69,'ministry','reports.view',1,'2026-10-06 15:18:35');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(70,'ministry','reports.export',1,'2026-10-06 15:18:35');
CREATE TABLE user_permissions (
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
CREATE TABLE persons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    national_id TEXT UNIQUE,
    national_id_verified BOOLEAN DEFAULT 0,
    national_id_verified_at DATETIME,
    
    code TEXT UNIQUE,
    parent_id INTEGER,
    level INTEGER DEFAULT 0,
    level_name TEXT,
    
    person_type TEXT NOT NULL CHECK(person_type IN ('employee', 'citizen', 'foreigner', 'legal')),
    
    first_name TEXT,
    last_name TEXT,
    full_name TEXT NOT NULL,
    father_name TEXT,
    mother_name TEXT,
    id_number TEXT,
    birth_date_shamsi TEXT,
    birth_place TEXT,
    gender TEXT CHECK(gender IN ('male', 'female') OR gender IS NULL),
    religion TEXT,
    nationality TEXT DEFAULT 'ایرانی',
    
    economic_code TEXT,
    registration_number TEXT,
    legal_type TEXT,
    
    relationship_type TEXT,
    relationship_start_shamsi TEXT,
    
    phone TEXT,
    mobile TEXT,
    address TEXT,
    postal_code TEXT,
    email TEXT,
    
    bank_name TEXT,
    bank_account TEXT,
    iban TEXT,
    
    notes TEXT,
    extra_data TEXT,
    is_active BOOLEAN DEFAULT 1,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at_shamsi TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at_shamsi TEXT,
    
    FOREIGN KEY (parent_id) REFERENCES persons(id)
);
INSERT INTO "persons" ("id","national_id","national_id_verified","national_id_verified_at","code","parent_id","level","level_name","person_type","first_name","last_name","full_name","father_name","mother_name","id_number","birth_date_shamsi","birth_place","gender","religion","nationality","economic_code","registration_number","legal_type","relationship_type","relationship_start_shamsi","phone","mobile","address","postal_code","email","bank_name","bank_account","iban","notes","extra_data","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(1,NULL,0,NULL,'1000000000',NULL,1,'گروه اصلی','employee',NULL,NULL,'کارکنان',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'ایرانی',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,'2026-10-06 15:20:51',NULL,'2026-10-06 15:20:51',NULL);
INSERT INTO "persons" ("id","national_id","national_id_verified","national_id_verified_at","code","parent_id","level","level_name","person_type","first_name","last_name","full_name","father_name","mother_name","id_number","birth_date_shamsi","birth_place","gender","religion","nationality","economic_code","registration_number","legal_type","relationship_type","relationship_start_shamsi","phone","mobile","address","postal_code","email","bank_name","bank_account","iban","notes","extra_data","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(2,NULL,0,NULL,'1001000000',1,2,'گروه فرعی','employee',NULL,NULL,'رسمی',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'ایرانی',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,'2026-10-06 15:20:51',NULL,'2026-10-06 15:20:51',NULL);
INSERT INTO "persons" ("id","national_id","national_id_verified","national_id_verified_at","code","parent_id","level","level_name","person_type","first_name","last_name","full_name","father_name","mother_name","id_number","birth_date_shamsi","birth_place","gender","religion","nationality","economic_code","registration_number","legal_type","relationship_type","relationship_start_shamsi","phone","mobile","address","postal_code","email","bank_name","bank_account","iban","notes","extra_data","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(3,NULL,0,NULL,'1002000000',1,2,'گروه فرعی','employee',NULL,NULL,'پیمانی',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'ایرانی',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,'2026-10-06 15:20:51',NULL,'2026-10-06 15:20:51',NULL);
INSERT INTO "persons" ("id","national_id","national_id_verified","national_id_verified_at","code","parent_id","level","level_name","person_type","first_name","last_name","full_name","father_name","mother_name","id_number","birth_date_shamsi","birth_place","gender","religion","nationality","economic_code","registration_number","legal_type","relationship_type","relationship_start_shamsi","phone","mobile","address","postal_code","email","bank_name","bank_account","iban","notes","extra_data","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(4,NULL,0,NULL,'1003000000',1,2,'گروه فرعی','employee',NULL,NULL,'قراردادی',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'ایرانی',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,'2026-10-06 15:20:51',NULL,'2026-10-06 15:20:51',NULL);
INSERT INTO "persons" ("id","national_id","national_id_verified","national_id_verified_at","code","parent_id","level","level_name","person_type","first_name","last_name","full_name","father_name","mother_name","id_number","birth_date_shamsi","birth_place","gender","religion","nationality","economic_code","registration_number","legal_type","relationship_type","relationship_start_shamsi","phone","mobile","address","postal_code","email","bank_name","bank_account","iban","notes","extra_data","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(5,NULL,0,NULL,'1004000000',1,2,'گروه فرعی','employee',NULL,NULL,'روزمزد',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'ایرانی',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,'2026-10-06 15:20:51',NULL,'2026-10-06 15:20:51',NULL);
INSERT INTO "persons" ("id","national_id","national_id_verified","national_id_verified_at","code","parent_id","level","level_name","person_type","first_name","last_name","full_name","father_name","mother_name","id_number","birth_date_shamsi","birth_place","gender","religion","nationality","economic_code","registration_number","legal_type","relationship_type","relationship_start_shamsi","phone","mobile","address","postal_code","email","bank_name","bank_account","iban","notes","extra_data","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(6,NULL,0,NULL,'1005000000',1,2,'گروه فرعی','employee',NULL,NULL,'سایر',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'ایرانی',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,'2026-10-06 15:20:51',NULL,'2026-10-06 15:20:51',NULL);
INSERT INTO "persons" ("id","national_id","national_id_verified","national_id_verified_at","code","parent_id","level","level_name","person_type","first_name","last_name","full_name","father_name","mother_name","id_number","birth_date_shamsi","birth_place","gender","religion","nationality","economic_code","registration_number","legal_type","relationship_type","relationship_start_shamsi","phone","mobile","address","postal_code","email","bank_name","bank_account","iban","notes","extra_data","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(7,NULL,0,NULL,'2000000000',NULL,1,'گروه اصلی','citizen',NULL,NULL,'شهروندان',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'ایرانی',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,'2026-10-06 15:20:51',NULL,'2026-10-06 15:20:51',NULL);
INSERT INTO "persons" ("id","national_id","national_id_verified","national_id_verified_at","code","parent_id","level","level_name","person_type","first_name","last_name","full_name","father_name","mother_name","id_number","birth_date_shamsi","birth_place","gender","religion","nationality","economic_code","registration_number","legal_type","relationship_type","relationship_start_shamsi","phone","mobile","address","postal_code","email","bank_name","bank_account","iban","notes","extra_data","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(8,NULL,0,NULL,'2001000000',7,2,'گروه فرعی','citizen',NULL,NULL,'حقیقی',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'ایرانی',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,'2026-10-06 15:20:51',NULL,'2026-10-06 15:20:51',NULL);
INSERT INTO "persons" ("id","national_id","national_id_verified","national_id_verified_at","code","parent_id","level","level_name","person_type","first_name","last_name","full_name","father_name","mother_name","id_number","birth_date_shamsi","birth_place","gender","religion","nationality","economic_code","registration_number","legal_type","relationship_type","relationship_start_shamsi","phone","mobile","address","postal_code","email","bank_name","bank_account","iban","notes","extra_data","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(9,NULL,0,NULL,'2002000000',7,2,'گروه فرعی','citizen',NULL,NULL,'پیمانکاران',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'ایرانی',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,'2026-10-06 15:20:51',NULL,'2026-10-06 15:20:51',NULL);
INSERT INTO "persons" ("id","national_id","national_id_verified","national_id_verified_at","code","parent_id","level","level_name","person_type","first_name","last_name","full_name","father_name","mother_name","id_number","birth_date_shamsi","birth_place","gender","religion","nationality","economic_code","registration_number","legal_type","relationship_type","relationship_start_shamsi","phone","mobile","address","postal_code","email","bank_name","bank_account","iban","notes","extra_data","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(10,NULL,0,NULL,'2003000000',7,2,'گروه فرعی','citizen',NULL,NULL,'مشاوران',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'ایرانی',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,'2026-10-06 15:20:51',NULL,'2026-10-06 15:20:51',NULL);
INSERT INTO "persons" ("id","national_id","national_id_verified","national_id_verified_at","code","parent_id","level","level_name","person_type","first_name","last_name","full_name","father_name","mother_name","id_number","birth_date_shamsi","birth_place","gender","religion","nationality","economic_code","registration_number","legal_type","relationship_type","relationship_start_shamsi","phone","mobile","address","postal_code","email","bank_name","bank_account","iban","notes","extra_data","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(11,NULL,0,NULL,'2004000000',7,2,'گروه فرعی','citizen',NULL,NULL,'فروشندگان',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'ایرانی',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,'2026-10-06 15:20:51',NULL,'2026-10-06 15:20:51',NULL);
INSERT INTO "persons" ("id","national_id","national_id_verified","national_id_verified_at","code","parent_id","level","level_name","person_type","first_name","last_name","full_name","father_name","mother_name","id_number","birth_date_shamsi","birth_place","gender","religion","nationality","economic_code","registration_number","legal_type","relationship_type","relationship_start_shamsi","phone","mobile","address","postal_code","email","bank_name","bank_account","iban","notes","extra_data","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(12,NULL,0,NULL,'2005000000',7,2,'گروه فرعی','citizen',NULL,NULL,'سایر',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'ایرانی',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,'2026-10-06 15:20:51',NULL,'2026-10-06 15:20:51',NULL);
INSERT INTO "persons" ("id","national_id","national_id_verified","national_id_verified_at","code","parent_id","level","level_name","person_type","first_name","last_name","full_name","father_name","mother_name","id_number","birth_date_shamsi","birth_place","gender","religion","nationality","economic_code","registration_number","legal_type","relationship_type","relationship_start_shamsi","phone","mobile","address","postal_code","email","bank_name","bank_account","iban","notes","extra_data","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(13,NULL,0,NULL,'3000000000',NULL,1,'گروه اصلی','legal',NULL,NULL,'اشخاص حقوقی',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'ایرانی',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,'2026-10-06 15:20:51',NULL,'2026-10-06 15:20:51',NULL);
INSERT INTO "persons" ("id","national_id","national_id_verified","national_id_verified_at","code","parent_id","level","level_name","person_type","first_name","last_name","full_name","father_name","mother_name","id_number","birth_date_shamsi","birth_place","gender","religion","nationality","economic_code","registration_number","legal_type","relationship_type","relationship_start_shamsi","phone","mobile","address","postal_code","email","bank_name","bank_account","iban","notes","extra_data","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(14,NULL,0,NULL,'3001000000',13,2,'گروه فرعی','legal',NULL,NULL,'شرکت‌های خصوصی',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'ایرانی',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,'2026-10-06 15:20:51',NULL,'2026-10-06 15:20:51',NULL);
INSERT INTO "persons" ("id","national_id","national_id_verified","national_id_verified_at","code","parent_id","level","level_name","person_type","first_name","last_name","full_name","father_name","mother_name","id_number","birth_date_shamsi","birth_place","gender","religion","nationality","economic_code","registration_number","legal_type","relationship_type","relationship_start_shamsi","phone","mobile","address","postal_code","email","bank_name","bank_account","iban","notes","extra_data","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(15,NULL,0,NULL,'3002000000',13,2,'گروه فرعی','legal',NULL,NULL,'سازمان‌های دولتی',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'ایرانی',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,'2026-10-06 15:20:51',NULL,'2026-10-06 15:20:51',NULL);
INSERT INTO "persons" ("id","national_id","national_id_verified","national_id_verified_at","code","parent_id","level","level_name","person_type","first_name","last_name","full_name","father_name","mother_name","id_number","birth_date_shamsi","birth_place","gender","religion","nationality","economic_code","registration_number","legal_type","relationship_type","relationship_start_shamsi","phone","mobile","address","postal_code","email","bank_name","bank_account","iban","notes","extra_data","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(16,NULL,0,NULL,'3003000000',13,2,'گروه فرعی','legal',NULL,NULL,'شهرداری‌ها',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'ایرانی',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,'2026-10-06 15:20:51',NULL,'2026-10-06 15:20:51',NULL);
INSERT INTO "persons" ("id","national_id","national_id_verified","national_id_verified_at","code","parent_id","level","level_name","person_type","first_name","last_name","full_name","father_name","mother_name","id_number","birth_date_shamsi","birth_place","gender","religion","nationality","economic_code","registration_number","legal_type","relationship_type","relationship_start_shamsi","phone","mobile","address","postal_code","email","bank_name","bank_account","iban","notes","extra_data","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(17,NULL,0,NULL,'3004000000',13,2,'گروه فرعی','legal',NULL,NULL,'سایر',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'ایرانی',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,'2026-10-06 15:20:51',NULL,'2026-10-06 15:20:51',NULL);
INSERT INTO "persons" ("id","national_id","national_id_verified","national_id_verified_at","code","parent_id","level","level_name","person_type","first_name","last_name","full_name","father_name","mother_name","id_number","birth_date_shamsi","birth_place","gender","religion","nationality","economic_code","registration_number","legal_type","relationship_type","relationship_start_shamsi","phone","mobile","address","postal_code","email","bank_name","bank_account","iban","notes","extra_data","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(18,NULL,0,NULL,'4000000000',NULL,1,'گروه اصلی','foreigner',NULL,NULL,'خارج شهروندان',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'ایرانی',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,'2026-10-06 15:20:51',NULL,'2026-10-06 15:20:51',NULL);
INSERT INTO "persons" ("id","national_id","national_id_verified","national_id_verified_at","code","parent_id","level","level_name","person_type","first_name","last_name","full_name","father_name","mother_name","id_number","birth_date_shamsi","birth_place","gender","religion","nationality","economic_code","registration_number","legal_type","relationship_type","relationship_start_shamsi","phone","mobile","address","postal_code","email","bank_name","bank_account","iban","notes","extra_data","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(19,NULL,0,NULL,'4001000000',18,2,'گروه فرعی','foreigner',NULL,NULL,'پیمانکاران غیرشهری',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'ایرانی',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,'2026-10-06 15:20:51',NULL,'2026-10-06 15:20:51',NULL);
INSERT INTO "persons" ("id","national_id","national_id_verified","national_id_verified_at","code","parent_id","level","level_name","person_type","first_name","last_name","full_name","father_name","mother_name","id_number","birth_date_shamsi","birth_place","gender","religion","nationality","economic_code","registration_number","legal_type","relationship_type","relationship_start_shamsi","phone","mobile","address","postal_code","email","bank_name","bank_account","iban","notes","extra_data","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(20,NULL,0,NULL,'4002000000',18,2,'گروه فرعی','foreigner',NULL,NULL,'مشاوران غیرشهری',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'ایرانی',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,'2026-10-06 15:20:51',NULL,'2026-10-06 15:20:51',NULL);
INSERT INTO "persons" ("id","national_id","national_id_verified","national_id_verified_at","code","parent_id","level","level_name","person_type","first_name","last_name","full_name","father_name","mother_name","id_number","birth_date_shamsi","birth_place","gender","religion","nationality","economic_code","registration_number","legal_type","relationship_type","relationship_start_shamsi","phone","mobile","address","postal_code","email","bank_name","bank_account","iban","notes","extra_data","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(21,NULL,0,NULL,'4003000000',18,2,'گروه فرعی','foreigner',NULL,NULL,'فروشندگان غیرشهری',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'ایرانی',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,'2026-10-06 15:20:51',NULL,'2026-10-06 15:20:51',NULL);
INSERT INTO "persons" ("id","national_id","national_id_verified","national_id_verified_at","code","parent_id","level","level_name","person_type","first_name","last_name","full_name","father_name","mother_name","id_number","birth_date_shamsi","birth_place","gender","religion","nationality","economic_code","registration_number","legal_type","relationship_type","relationship_start_shamsi","phone","mobile","address","postal_code","email","bank_name","bank_account","iban","notes","extra_data","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(22,NULL,0,NULL,'4004000000',18,2,'گروه فرعی','foreigner',NULL,NULL,'سایر',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'ایرانی',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,'2026-10-06 15:20:51',NULL,'2026-10-06 15:20:51',NULL);
CREATE TABLE person_organizations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  person_id INTEGER NOT NULL,
  organization_id INTEGER NOT NULL,
  role TEXT,
  start_date_shamsi TEXT,
  end_date_shamsi TEXT,
  is_primary BOOLEAN DEFAULT 0,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at_shamsi TEXT,
  FOREIGN KEY (person_id) REFERENCES persons(id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id) REFERENCES base_data(id)
);
CREATE TABLE entity_relations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_type TEXT NOT NULL,
  source_id INTEGER NOT NULL,
  target_type TEXT NOT NULL,
  target_id INTEGER NOT NULL,
  relation_type TEXT NOT NULL,
  metadata TEXT,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at_shamsi TEXT
);
DELETE FROM sqlite_sequence;
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('users',1);
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('base_data',99);
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('role_permissions',70);
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('persons',22);
CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_date ON audit_log(created_at);
CREATE INDEX idx_base_data_section ON base_data(section, type);
CREATE INDEX idx_base_data_parent ON base_data(parent_id);
CREATE INDEX idx_base_data_fiscal ON base_data(fiscal_year_id);
CREATE INDEX idx_base_data_code ON base_data(code);
CREATE INDEX idx_base_data_created_shamsi ON base_data(created_at_shamsi);
CREATE INDEX idx_base_data_sort ON base_data(section, sort_order);
CREATE INDEX idx_role_permissions_role ON role_permissions(role);
CREATE INDEX idx_user_permissions_user ON user_permissions(user_id);
CREATE UNIQUE INDEX idx_base_data_unique_code ON base_data(section, COALESCE(fiscal_year_id, 0), COALESCE(type, ''), code);
CREATE INDEX idx_persons_national_id ON persons(national_id);
CREATE INDEX idx_persons_type ON persons(person_type);
CREATE INDEX idx_persons_code ON persons(code);
CREATE INDEX idx_persons_parent ON persons(parent_id);
CREATE INDEX idx_persons_active ON persons(is_active);
CREATE INDEX idx_person_org_person ON person_organizations(person_id);
CREATE INDEX idx_person_org_org ON person_organizations(organization_id);
CREATE INDEX idx_entity_rel_source ON entity_relations(source_type, source_id);
CREATE INDEX idx_entity_rel_target ON entity_relations(target_type, target_id);
CREATE INDEX idx_entity_rel_type ON entity_relations(relation_type);