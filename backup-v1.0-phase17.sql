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
INSERT INTO "fiscal_years" ("id","year","start_date","end_date","is_active","status","created_at") VALUES(3,1407,'1406/03/19','1406/05/12',1,'active','2026-09-07 04:55:18');
INSERT INTO "fiscal_years" ("id","year","start_date","end_date","is_active","status","created_at") VALUES(4,1406,'1406/01/01','1406/12/29',0,'active','2026-09-15 09:10:43');
CREATE TABLE economic_classifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fiscal_year_id INTEGER NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('resource', 'expense')),
    category TEXT NOT NULL CHECK(category IN ('income', 'asset_sale', 'financial_asset', 'cost', 'capital_acquisition', 'financial_acquisition')),
    main_code TEXT NOT NULL,
    chapter_code TEXT NOT NULL,
    sub_code TEXT NOT NULL,
    title TEXT NOT NULL,
    parent_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (fiscal_year_id) REFERENCES fiscal_years(id)
);
INSERT INTO "economic_classifications" ("id","fiscal_year_id","type","category","main_code","chapter_code","sub_code","title","parent_id","created_at") VALUES(1,3,'resource','income','01','011','0111','درآمد مالیاتی یک',NULL,'2026-09-07 06:57:38');
INSERT INTO "economic_classifications" ("id","fiscal_year_id","type","category","main_code","chapter_code","sub_code","title","parent_id","created_at") VALUES(2,3,'resource','income','01','0101','010101','درآمد مالیاتی',NULL,'2026-09-15 10:02:30');
INSERT INTO "economic_classifications" ("id","fiscal_year_id","type","category","main_code","chapter_code","sub_code","title","parent_id","created_at") VALUES(4,4,'resource','income','01','01002','0100020004','ارزش افزوده',NULL,'2026-09-18 18:46:40');
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
INSERT INTO "organizations" ("id","fiscal_year_id","name","type","manager_name","finance_manager_name","parent_id","is_cost_center","created_at") VALUES(1,3,'معاونت عمرانی','general','خادمی','ساحلی',NULL,0,'2026-09-12 05:08:48');
INSERT INTO "organizations" ("id","fiscal_year_id","name","type","manager_name","finance_manager_name","parent_id","is_cost_center","created_at") VALUES(3,3,'معاونت خدمات وابسته عمرانی','general','ظاهری','صدری',1,0,'2026-09-12 05:11:33');
INSERT INTO "organizations" ("id","fiscal_year_id","name","type","manager_name","finance_manager_name","parent_id","is_cost_center","created_at") VALUES(4,3,'معاونت مالی','general','علی احمدی','رضا رضایی',NULL,1,'2026-09-15 10:04:25');
CREATE TABLE council_resolutions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    budget_proposal_id INTEGER NOT NULL,
    resolution_number TEXT NOT NULL,
    resolution_date TEXT NOT NULL,
    content TEXT,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (budget_proposal_id) REFERENCES budget_proposals(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id)
);
CREATE TABLE budget_approval_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    budget_proposal_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    from_status TEXT,
    to_status TEXT NOT NULL,
    user_id INTEGER,
    note TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (budget_proposal_id) REFERENCES budget_proposals(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
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
INSERT INTO "approval_history" ("id","budget_proposal_id","from_status","to_status","action_by","action_at","comment") VALUES(1,1,'draft','submitted',2,'2026-09-12 09:19:15','بدون توضیح');
INSERT INTO "approval_history" ("id","budget_proposal_id","from_status","to_status","action_by","action_at","comment") VALUES(2,1,'submitted','manager_approved',2,'2026-09-12 09:19:27','بدون توضیحات');
INSERT INTO "approval_history" ("id","budget_proposal_id","from_status","to_status","action_by","action_at","comment") VALUES(3,1,'submitted','manager_approved',2,'2026-09-13 07:53:37',NULL);
INSERT INTO "approval_history" ("id","budget_proposal_id","from_status","to_status","action_by","action_at","comment") VALUES(4,1,'submitted','manager_approved',2,'2026-09-13 08:33:02',NULL);
INSERT INTO "approval_history" ("id","budget_proposal_id","from_status","to_status","action_by","action_at","comment") VALUES(5,1,'submitted','manager_approved',2,'2026-09-13 08:40:04',NULL);
INSERT INTO "approval_history" ("id","budget_proposal_id","from_status","to_status","action_by","action_at","comment") VALUES(6,1,'submitted','manager_approved',2,'2026-09-13 08:40:10',NULL);
INSERT INTO "approval_history" ("id","budget_proposal_id","from_status","to_status","action_by","action_at","comment") VALUES(7,2,'draft','submitted',2,'2026-09-13 08:40:41',NULL);
INSERT INTO "approval_history" ("id","budget_proposal_id","from_status","to_status","action_by","action_at","comment") VALUES(8,2,'submitted','manager_approved',2,'2026-09-13 08:40:51',NULL);
INSERT INTO "approval_history" ("id","budget_proposal_id","from_status","to_status","action_by","action_at","comment") VALUES(9,2,'submitted','manager_approved',2,'2026-09-13 08:43:33',NULL);
INSERT INTO "approval_history" ("id","budget_proposal_id","from_status","to_status","action_by","action_at","comment") VALUES(10,2,'submitted','manager_approved',2,'2026-09-13 08:48:51',NULL);
INSERT INTO "approval_history" ("id","budget_proposal_id","from_status","to_status","action_by","action_at","comment") VALUES(11,2,'submitted','manager_approved',2,'2026-09-13 08:54:18',NULL);
INSERT INTO "approval_history" ("id","budget_proposal_id","from_status","to_status","action_by","action_at","comment") VALUES(12,2,'manager_approved','finance_approved',2,'2026-09-13 08:54:47',NULL);
INSERT INTO "approval_history" ("id","budget_proposal_id","from_status","to_status","action_by","action_at","comment") VALUES(13,1,'submitted','manager_approved',2,'2026-09-13 08:56:36',NULL);
INSERT INTO "approval_history" ("id","budget_proposal_id","from_status","to_status","action_by","action_at","comment") VALUES(14,1,'manager_approved','finance_approved',2,'2026-09-13 08:56:49',NULL);
INSERT INTO "approval_history" ("id","budget_proposal_id","from_status","to_status","action_by","action_at","comment") VALUES(15,2,'finance_approved','approved',2,'2026-09-14 04:17:24',NULL);
INSERT INTO "approval_history" ("id","budget_proposal_id","from_status","to_status","action_by","action_at","comment") VALUES(16,1,'finance_approved','approved',2,'2026-09-14 05:07:42',NULL);
INSERT INTO "approval_history" ("id","budget_proposal_id","from_status","to_status","action_by","action_at","comment") VALUES(17,3,'draft','submitted',2,'2026-09-15 10:06:46',NULL);
INSERT INTO "approval_history" ("id","budget_proposal_id","from_status","to_status","action_by","action_at","comment") VALUES(18,3,'submitted','manager_approved',2,'2026-09-15 10:06:49',NULL);
INSERT INTO "approval_history" ("id","budget_proposal_id","from_status","to_status","action_by","action_at","comment") VALUES(19,3,'manager_approved','finance_approved',2,'2026-09-15 10:06:52',NULL);
INSERT INTO "approval_history" ("id","budget_proposal_id","from_status","to_status","action_by","action_at","comment") VALUES(20,3,'finance_approved','approved',2,'2026-09-15 10:06:55',NULL);
INSERT INTO "approval_history" ("id","budget_proposal_id","from_status","to_status","action_by","action_at","comment") VALUES(21,5,'draft','submitted',2,'2026-09-20 06:03:38',NULL);
INSERT INTO "approval_history" ("id","budget_proposal_id","from_status","to_status","action_by","action_at","comment") VALUES(22,5,'submitted','manager_approved',2,'2026-09-20 06:03:56',NULL);
CREATE TABLE IF NOT EXISTS "budget_proposals" (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fiscal_year_id INTEGER NOT NULL,
    organization_id INTEGER NOT NULL,
    economic_class_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'submitted', 'manager_approved', 'finance_approved', 'approved', 'rejected')),
    proposed_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    submitted_at DATETIME,
    submitted_by INTEGER,
    approved_at DATETIME,
    approved_by INTEGER,
    rejected_at DATETIME,
    rejected_by INTEGER,
    rejection_reason TEXT
);
INSERT INTO "budget_proposals" ("id","fiscal_year_id","organization_id","economic_class_id","title","amount","description","status","proposed_by","created_at","submitted_at","submitted_by","approved_at","approved_by","rejected_at","rejected_by","rejection_reason") VALUES(1,3,3,1,'عنوان بودجه یک',3005000000,'بررسی اولیه','approved',2,'2026-09-12 06:36:21',NULL,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO "budget_proposals" ("id","fiscal_year_id","organization_id","economic_class_id","title","amount","description","status","proposed_by","created_at","submitted_at","submitted_by","approved_at","approved_by","rejected_at","rejected_by","rejection_reason") VALUES(2,3,3,1,'عنوان',764020000,'توضیح','approved',2,'2026-09-13 08:40:29',NULL,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO "budget_proposals" ("id","fiscal_year_id","organization_id","economic_class_id","title","amount","description","status","proposed_by","created_at","submitted_at","submitted_by","approved_at","approved_by","rejected_at","rejected_by","rejection_reason") VALUES(3,3,4,2,'درآمد مالیاتی سال ۱۴۰۷',95000000,'تست','approved',2,'2026-09-15 10:06:37',NULL,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO "budget_proposals" ("id","fiscal_year_id","organization_id","economic_class_id","title","amount","description","status","proposed_by","created_at","submitted_at","submitted_by","approved_at","approved_by","rejected_at","rejected_by","rejection_reason") VALUES(5,3,1,1,'درآمدی',100055000,NULL,'manager_approved',2,'2026-09-15 10:56:26',NULL,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO "budget_proposals" ("id","fiscal_year_id","organization_id","economic_class_id","title","amount","description","status","proposed_by","created_at","submitted_at","submitted_by","approved_at","approved_by","rejected_at","rejected_by","rejection_reason") VALUES(6,3,1,1,'بودجه جدید یک',100055000,NULL,'draft',2,'2026-09-15 10:56:44',NULL,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO "budget_proposals" ("id","fiscal_year_id","organization_id","economic_class_id","title","amount","description","status","proposed_by","created_at","submitted_at","submitted_by","approved_at","approved_by","rejected_at","rejected_by","rejection_reason") VALUES(7,3,1,1,'بودجه 3',15000000,NULL,'draft',2,'2026-09-15 10:57:12',NULL,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO "budget_proposals" ("id","fiscal_year_id","organization_id","economic_class_id","title","amount","description","status","proposed_by","created_at","submitted_at","submitted_by","approved_at","approved_by","rejected_at","rejected_by","rejection_reason") VALUES(8,3,1,1,'درآمد اولیه',50000000,'یک','draft',2,'2026-09-15 11:00:38',NULL,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO "budget_proposals" ("id","fiscal_year_id","organization_id","economic_class_id","title","amount","description","status","proposed_by","created_at","submitted_at","submitted_by","approved_at","approved_by","rejected_at","rejected_by","rejection_reason") VALUES(9,3,1,1,'عنوان بعدی',40000000,NULL,'draft',2,'2026-09-15 11:01:15',NULL,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO "budget_proposals" ("id","fiscal_year_id","organization_id","economic_class_id","title","amount","description","status","proposed_by","created_at","submitted_at","submitted_by","approved_at","approved_by","rejected_at","rejected_by","rejection_reason") VALUES(10,4,1,2,'جدید',1500000000,NULL,'draft',2,'2026-09-15 11:03:08',NULL,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO "budget_proposals" ("id","fiscal_year_id","organization_id","economic_class_id","title","amount","description","status","proposed_by","created_at","submitted_at","submitted_by","approved_at","approved_by","rejected_at","rejected_by","rejection_reason") VALUES(11,3,1,2,'عنوان',100100000,NULL,'draft',2,'2026-09-15 11:08:37',NULL,NULL,NULL,NULL,NULL,NULL,NULL);
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
INSERT INTO "budget_allocations" ("id","approved_budget_id","organization_id","amount","percentage","allocation_date","created_at") VALUES(1,2,3,580000,35,'1404/8/3','2026-09-14 04:18:23');
INSERT INTO "budget_allocations" ("id","approved_budget_id","organization_id","amount","percentage","allocation_date","created_at") VALUES(2,3,4,50000000,50,'۱۴۰۷/۰۲/۱۹','2026-09-15 10:18:44');
INSERT INTO "budget_allocations" ("id","approved_budget_id","organization_id","amount","percentage","allocation_date","created_at") VALUES(3,3,4,10500000,30,'۱۴۰۶/۰۸/۲۳','2026-09-15 10:19:18');
INSERT INTO "budget_allocations" ("id","approved_budget_id","organization_id","amount","percentage","allocation_date","created_at") VALUES(5,3,1,10000,10,'۱۴۰۵/۰۶/۰۲','2026-09-15 11:15:19');
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
INSERT INTO "budget_executions" ("id","allocation_id","technical_code","amount","description","execution_date","approved_by_chain","accounting_doc_no","status","created_at") VALUES(1,1,'055311',11000,'توضیحات','۱۴۰۵/۰۶/۲۳',NULL,NULL,'pending','2026-09-14 04:25:59');
INSERT INTO "budget_executions" ("id","allocation_id","technical_code","amount","description","execution_date","approved_by_chain","accounting_doc_no","status","created_at") VALUES(3,1,'001550',450300,NULL,'۱۴۰۵/۰۶/۲۳',NULL,NULL,'pending','2026-09-14 06:07:45');
INSERT INTO "budget_executions" ("id","allocation_id","technical_code","amount","description","execution_date","approved_by_chain","accounting_doc_no","status","created_at") VALUES(4,1,'0012100',100000,NULL,'۱۴۰۵/۰۶/۰۲',NULL,NULL,'pending','2026-09-14 06:08:31');
INSERT INTO "budget_executions" ("id","allocation_id","technical_code","amount","description","execution_date","approved_by_chain","accounting_doc_no","status","created_at") VALUES(5,1,'0115050',5000,NULL,'۱۴۰۵/۰۶/۰۸',NULL,NULL,'pending','2026-09-14 06:09:36');
INSERT INTO "budget_executions" ("id","allocation_id","technical_code","amount","description","execution_date","approved_by_chain","accounting_doc_no","status","created_at") VALUES(6,3,'010101001',10000000,'تامین اعتبار چهار','۱۴۰۵/۰۶/۱۸',NULL,'۱۲۳۴','pending','2026-09-15 10:20:42');
INSERT INTO "budget_executions" ("id","allocation_id","technical_code","amount","description","execution_date","approved_by_chain","accounting_doc_no","status","created_at") VALUES(8,3,'010101010',10000,NULL,'۱۴۰۵/۰۶/۲۴',NULL,NULL,'pending','2026-09-15 11:19:44');
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
INSERT INTO "budget_revisions" ("id","fiscal_year_id","budget_proposal_id","revision_type","old_amount","new_amount","difference","reason","status","created_by","created_at","approved_by","approved_at") VALUES(8,3,2,'increase',175000000,589020000,589020000,'اعتبارات','approved',2,'2026-09-14 05:33:51',2,'2026-09-14 05:35:00');
INSERT INTO "budget_revisions" ("id","fiscal_year_id","budget_proposal_id","revision_type","old_amount","new_amount","difference","reason","status","created_by","created_at","approved_by","approved_at") VALUES(9,3,1,'decrease',3055000000,50000000,-50000000,'کاهش یک','approved',2,'2026-09-14 05:34:42',2,'2026-09-14 05:34:55');
INSERT INTO "budget_revisions" ("id","fiscal_year_id","budget_proposal_id","revision_type","old_amount","new_amount","difference","reason","status","created_by","created_at","approved_by","approved_at") VALUES(10,3,3,'increase',100000000,100000000,100000000,'افزایش جاری یک','rejected',2,'2026-09-15 10:21:59',2,'2026-09-15 10:23:15');
INSERT INTO "budget_revisions" ("id","fiscal_year_id","budget_proposal_id","revision_type","old_amount","new_amount","difference","reason","status","created_by","created_at","approved_by","approved_at") VALUES(11,3,3,'decrease',100000000,5000000,-5000000,'کاهش جاری یک','approved',2,'2026-09-15 10:22:24',2,'2026-09-15 10:23:06');
INSERT INTO "budget_revisions" ("id","fiscal_year_id","budget_proposal_id","revision_type","old_amount","new_amount","difference","reason","status","created_by","created_at","approved_by","approved_at") VALUES(12,3,3,'increase',95000000,101100,101100,'دلائل','pending',2,'2026-09-15 11:25:01',NULL,NULL);
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
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(1,2,'admin','login','user',2,'{"success":true}','37.255.138.28','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36','2026-09-14 06:23:56');
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(2,NULL,NULL,'login_failed','user',NULL,'{"username":"admin","reason":"wrong_password"}','37.255.138.28','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36','2026-09-14 06:24:04');
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(3,2,'admin','login','user',2,'{"success":true}','37.255.138.28','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36','2026-09-14 06:59:58');
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(4,2,'admin','login','user',2,'{"success":true}','37.255.138.28','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:155.0) Gecko/20100101 Firefox/155.0','2026-09-14 07:20:15');
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(5,NULL,NULL,'login_failed','user',NULL,'{"username":"admin","reason":"wrong_password"}','37.255.138.28','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:155.0) Gecko/20100101 Firefox/155.0','2026-09-14 07:20:41');
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(6,2,'admin','login','user',2,'{"success":true}','37.255.138.28','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:155.0) Gecko/20100101 Firefox/155.0','2026-09-14 07:20:52');
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(7,5,'testuser','login','user',5,'{"success":true}','37.255.138.28','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36 Edg/153.0.0.0','2026-09-14 07:23:24');
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(8,5,'testuser','login','user',5,'{"success":true}','37.255.138.28','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36 Edg/153.0.0.0','2026-09-14 09:14:59');
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(9,NULL,NULL,'login_failed','user',NULL,'{"username":"admin","reason":"wrong_password"}','37.255.138.28','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36','2026-09-14 09:40:47');
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(10,2,'admin','login','user',2,'{"success":true}','37.255.138.28','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36','2026-09-14 09:40:54');
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(11,NULL,NULL,'login_failed','user',NULL,'{"username":"Admin","reason":"user_not_found"}','2a02:4540:906f:abbe:4500:fe2e:702f:33f1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','2026-09-15 08:50:00');
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(12,2,'admin','login','user',2,'{"success":true}','2a02:4540:906f:abbe:4500:fe2e:702f:33f1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','2026-09-15 08:50:08');
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(13,2,'admin','budget_status_changed','budget_proposal',3,'{"from":"draft","to":"submitted","comment":""}','2a02:4540:906f:abbe:4500:fe2e:702f:33f1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','2026-09-15 10:06:46');
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(14,2,'admin','budget_status_changed','budget_proposal',3,'{"from":"submitted","to":"manager_approved","comment":""}','2a02:4540:906f:abbe:4500:fe2e:702f:33f1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','2026-09-15 10:06:49');
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(15,2,'admin','budget_status_changed','budget_proposal',3,'{"from":"manager_approved","to":"finance_approved","comment":""}','2a02:4540:906f:abbe:4500:fe2e:702f:33f1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','2026-09-15 10:06:52');
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(16,2,'admin','budget_status_changed','budget_proposal',3,'{"from":"finance_approved","to":"approved","comment":""}','2a02:4540:906f:abbe:4500:fe2e:702f:33f1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','2026-09-15 10:06:55');
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(17,NULL,NULL,'allocation_created','budget_allocation',2,'{"amount":50000000,"organization_id":4}','2a02:4540:906f:abbe:4500:fe2e:702f:33f1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','2026-09-15 10:18:44');
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(18,NULL,NULL,'allocation_created','budget_allocation',3,'{"amount":10500000,"organization_id":4}','2a02:4540:906f:abbe:4500:fe2e:702f:33f1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','2026-09-15 10:19:18');
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(19,NULL,NULL,'allocation_created','budget_allocation',4,'{"amount":52000,"organization_id":4}','2a02:4540:906f:abbe:4500:fe2e:702f:33f1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','2026-09-15 10:19:40');
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(20,NULL,NULL,'login_failed','user',NULL,'{"username":"ostandari","reason":"user_not_found"}','2a02:4540:906f:abbe:4500:fe2e:702f:33f1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','2026-09-15 10:27:09');
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(21,NULL,NULL,'login_failed','user',NULL,'{"username":"ostandari","reason":"user_not_found"}','2a02:4540:906f:abbe:4500:fe2e:702f:33f1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','2026-09-15 10:27:19');
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(22,NULL,NULL,'login_failed','user',NULL,'{"username":"ostandari","reason":"user_not_found"}','2a02:4540:906f:abbe:4500:fe2e:702f:33f1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','2026-09-15 10:27:21');
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(23,2,'admin','login','user',2,'{"success":true}','2a02:4540:906f:abbe:4500:fe2e:702f:33f1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','2026-09-15 10:27:28');
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(24,4,'vizarat','login','user',4,'{"success":true}','2a02:4540:906f:abbe:4500:fe2e:702f:33f1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','2026-09-15 10:27:58');
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(25,2,'admin','login','user',2,'{"success":true}','2a02:4540:906f:abbe:4500:fe2e:702f:33f1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','2026-09-15 10:54:58');
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(26,NULL,NULL,'allocation_created','budget_allocation',5,'{"amount":10000,"organization_id":1}','2a02:4540:906f:abbe:4500:fe2e:702f:33f1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','2026-09-15 11:15:19');
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(27,2,'admin','login','user',2,'{"success":true}','2a02:4540:9027:a640:f932:4df6:49d:b930','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:156.0) Gecko/20100101 Firefox/156.0','2026-09-16 10:32:59');
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(28,2,'admin','login','user',2,'{"success":true}','2a02:4540:9027:a640:f932:4df6:49d:b930','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:156.0) Gecko/20100101 Firefox/156.0','2026-09-16 10:38:21');
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(29,6,'Modir','login','user',6,'{"success":true}','2a02:4540:9027:a640:f932:4df6:49d:b930','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','2026-09-16 10:56:06');
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(30,6,'Modir','login','user',6,'{"success":true}','5.22.62.216','Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36','2026-09-18 08:56:15');
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(31,NULL,NULL,'login_failed','user',NULL,'{"username":"modir","reason":"user_not_found"}','31.171.101.70','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','2026-09-18 18:39:29');
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(32,6,'Modir','login','user',6,'{"success":true}','31.171.101.70','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','2026-09-18 18:40:01');
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(33,6,'Modir','login','user',6,'{"success":true}','37.255.138.28','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36','2026-09-19 05:46:48');
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(34,2,'admin','login','user',2,'{"success":true}','37.255.138.28','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:156.0) Gecko/20100101 Firefox/156.0','2026-09-19 07:47:58');
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(35,6,'Modir','login','user',6,'{"success":true}','37.255.138.28','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36','2026-09-19 07:48:39');
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(36,2,'admin','login','user',2,'{"success":true}','37.255.138.28','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:156.0) Gecko/20100101 Firefox/156.0','2026-09-19 08:01:42');
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(37,6,'Modir','login','user',6,'{"success":true}','37.255.138.28','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36','2026-09-19 08:02:01');
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(38,2,'admin','login','user',2,'{"success":true}','5.22.62.216','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:156.0) Gecko/20100101 Firefox/156.0','2026-09-20 05:08:07');
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(39,2,'admin','budget_status_changed','budget_proposal',5,'{"from":"draft","to":"submitted","comment":""}','5.22.62.216','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:156.0) Gecko/20100101 Firefox/156.0','2026-09-20 06:03:38');
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(40,2,'admin','budget_status_changed','budget_proposal',5,'{"from":"submitted","to":"manager_approved","comment":""}','5.22.62.216','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:156.0) Gecko/20100101 Firefox/156.0','2026-09-20 06:03:56');
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(41,2,'admin','login','user',2,'{"success":true}','37.255.138.28','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36','2026-09-21 10:59:58');
CREATE TABLE IF NOT EXISTS "users" (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT DEFAULT 'expert' CHECK(role IN ('admin', 'supervisor', 'manager', 'expert', 'viewer', 'province', 'ministry')),
    organization TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "users" ("id","username","password_hash","full_name","role","organization","is_active","created_at") VALUES(2,'admin','3eb3fe66b31e3b4d10fa70b5cad49c7112294af6ae4e476a1c405155d45aa121','مدیر سیستم','admin',NULL,1,'2026-09-06 06:46:18');
INSERT INTO "users" ("id","username","password_hash","full_name","role","organization","is_active","created_at") VALUES(4,'vizarat','cedcdb399cbe7e923e28bf378a9e8f729e06873d60fb58167d86a6bc0ebafd58','کارشناس وزارت','ministry','وزارت کشور',1,'2026-09-14 04:36:54');
INSERT INTO "users" ("id","username","password_hash","full_name","role","organization","is_active","created_at") VALUES(5,'testuser','ecd71870d1963316a97e3ac3408c9835ad8cf0f3c1bc703527c30265534f75ae','کاربر تست','expert',NULL,0,'2026-09-14 07:22:03');
INSERT INTO "users" ("id","username","password_hash","full_name","role","organization","is_active","created_at") VALUES(6,'Modir','7185fd51f73d2605675e47ea69c9922bd8215c4b73603406553df7f12a51c0ef','مدیر سامانه','manager','مدیریت',1,'2026-09-16 10:55:20');
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
DELETE FROM sqlite_sequence;
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('fiscal_years',5);
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('economic_classifications',4);
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('organizations',5);
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('approval_history',22);
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('budget_proposals',11);
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('budget_allocations',5);
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('budget_executions',8);
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('budget_revisions',12);
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('audit_log',41);
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('users',6);
CREATE INDEX idx_logs_proposal ON budget_approval_logs(budget_proposal_id);
CREATE INDEX idx_resolutions_proposal ON council_resolutions(budget_proposal_id);
CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_date ON audit_log(created_at);
