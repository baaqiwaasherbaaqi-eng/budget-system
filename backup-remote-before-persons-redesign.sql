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
CREATE TABLE IF NOT EXISTS "economic_classifications_old" (
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
INSERT INTO "economic_classifications_old" ("id","fiscal_year_id","type","category","main_code","chapter_code","sub_code","title","parent_id","created_at") VALUES(1,3,'resource','income','01','011','0111','درآمد مالیاتی یک',NULL,'2026-09-07 06:57:38');
INSERT INTO "economic_classifications_old" ("id","fiscal_year_id","type","category","main_code","chapter_code","sub_code","title","parent_id","created_at") VALUES(2,3,'resource','income','01','0101','010101','درآمد مالیاتی',NULL,'2026-09-15 10:02:30');
INSERT INTO "economic_classifications_old" ("id","fiscal_year_id","type","category","main_code","chapter_code","sub_code","title","parent_id","created_at") VALUES(4,4,'resource','income','01','01002','0100020004','ارزش افزوده',NULL,'2026-09-18 18:46:40');
CREATE TABLE IF NOT EXISTS "organizations_old" (
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
    FOREIGN KEY (parent_id) REFERENCES "organizations_old"(id)
);
INSERT INTO "organizations_old" ("id","fiscal_year_id","name","type","manager_name","finance_manager_name","parent_id","is_cost_center","created_at") VALUES(1,3,'معاونت عمرانی','general','خادمی','ساحلی',NULL,0,'2026-09-12 05:08:48');
INSERT INTO "organizations_old" ("id","fiscal_year_id","name","type","manager_name","finance_manager_name","parent_id","is_cost_center","created_at") VALUES(3,3,'معاونت خدمات وابسته عمرانی','general','ظاهری','صدری',1,0,'2026-09-12 05:11:33');
INSERT INTO "organizations_old" ("id","fiscal_year_id","name","type","manager_name","finance_manager_name","parent_id","is_cost_center","created_at") VALUES(4,3,'معاونت مالی','general','علی احمدی','رضا رضایی',NULL,1,'2026-09-15 10:04:25');
CREATE TABLE IF NOT EXISTS "council_resolutions_old" (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    budget_proposal_id INTEGER NOT NULL,
    resolution_number TEXT NOT NULL,
    resolution_date TEXT NOT NULL,
    content TEXT,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (budget_proposal_id) REFERENCES "budget_proposals_old"(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id)
);
CREATE TABLE IF NOT EXISTS "budget_approval_logs_old" (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    budget_proposal_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    from_status TEXT,
    to_status TEXT NOT NULL,
    user_id INTEGER,
    note TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (budget_proposal_id) REFERENCES "budget_proposals_old"(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE TABLE IF NOT EXISTS "approval_history_old" (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    budget_proposal_id INTEGER NOT NULL,
    from_status TEXT NOT NULL,
    to_status TEXT NOT NULL,
    action_by INTEGER NOT NULL,
    action_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    comment TEXT,
    FOREIGN KEY (budget_proposal_id) REFERENCES "budget_proposals_old"(id),
    FOREIGN KEY (action_by) REFERENCES users(id)
);
INSERT INTO "approval_history_old" ("id","budget_proposal_id","from_status","to_status","action_by","action_at","comment") VALUES(1,1,'draft','submitted',2,'2026-09-12 09:19:15','بدون توضیح');
INSERT INTO "approval_history_old" ("id","budget_proposal_id","from_status","to_status","action_by","action_at","comment") VALUES(2,1,'submitted','manager_approved',2,'2026-09-12 09:19:27','بدون توضیحات');
INSERT INTO "approval_history_old" ("id","budget_proposal_id","from_status","to_status","action_by","action_at","comment") VALUES(3,1,'submitted','manager_approved',2,'2026-09-13 07:53:37',NULL);
INSERT INTO "approval_history_old" ("id","budget_proposal_id","from_status","to_status","action_by","action_at","comment") VALUES(4,1,'submitted','manager_approved',2,'2026-09-13 08:33:02',NULL);
INSERT INTO "approval_history_old" ("id","budget_proposal_id","from_status","to_status","action_by","action_at","comment") VALUES(5,1,'submitted','manager_approved',2,'2026-09-13 08:40:04',NULL);
INSERT INTO "approval_history_old" ("id","budget_proposal_id","from_status","to_status","action_by","action_at","comment") VALUES(6,1,'submitted','manager_approved',2,'2026-09-13 08:40:10',NULL);
INSERT INTO "approval_history_old" ("id","budget_proposal_id","from_status","to_status","action_by","action_at","comment") VALUES(7,2,'draft','submitted',2,'2026-09-13 08:40:41',NULL);
INSERT INTO "approval_history_old" ("id","budget_proposal_id","from_status","to_status","action_by","action_at","comment") VALUES(8,2,'submitted','manager_approved',2,'2026-09-13 08:40:51',NULL);
INSERT INTO "approval_history_old" ("id","budget_proposal_id","from_status","to_status","action_by","action_at","comment") VALUES(9,2,'submitted','manager_approved',2,'2026-09-13 08:43:33',NULL);
INSERT INTO "approval_history_old" ("id","budget_proposal_id","from_status","to_status","action_by","action_at","comment") VALUES(10,2,'submitted','manager_approved',2,'2026-09-13 08:48:51',NULL);
INSERT INTO "approval_history_old" ("id","budget_proposal_id","from_status","to_status","action_by","action_at","comment") VALUES(11,2,'submitted','manager_approved',2,'2026-09-13 08:54:18',NULL);
INSERT INTO "approval_history_old" ("id","budget_proposal_id","from_status","to_status","action_by","action_at","comment") VALUES(12,2,'manager_approved','finance_approved',2,'2026-09-13 08:54:47',NULL);
INSERT INTO "approval_history_old" ("id","budget_proposal_id","from_status","to_status","action_by","action_at","comment") VALUES(13,1,'submitted','manager_approved',2,'2026-09-13 08:56:36',NULL);
INSERT INTO "approval_history_old" ("id","budget_proposal_id","from_status","to_status","action_by","action_at","comment") VALUES(14,1,'manager_approved','finance_approved',2,'2026-09-13 08:56:49',NULL);
INSERT INTO "approval_history_old" ("id","budget_proposal_id","from_status","to_status","action_by","action_at","comment") VALUES(15,2,'finance_approved','approved',2,'2026-09-14 04:17:24',NULL);
INSERT INTO "approval_history_old" ("id","budget_proposal_id","from_status","to_status","action_by","action_at","comment") VALUES(16,1,'finance_approved','approved',2,'2026-09-14 05:07:42',NULL);
INSERT INTO "approval_history_old" ("id","budget_proposal_id","from_status","to_status","action_by","action_at","comment") VALUES(17,3,'draft','submitted',2,'2026-09-15 10:06:46',NULL);
INSERT INTO "approval_history_old" ("id","budget_proposal_id","from_status","to_status","action_by","action_at","comment") VALUES(18,3,'submitted','manager_approved',2,'2026-09-15 10:06:49',NULL);
INSERT INTO "approval_history_old" ("id","budget_proposal_id","from_status","to_status","action_by","action_at","comment") VALUES(19,3,'manager_approved','finance_approved',2,'2026-09-15 10:06:52',NULL);
INSERT INTO "approval_history_old" ("id","budget_proposal_id","from_status","to_status","action_by","action_at","comment") VALUES(20,3,'finance_approved','approved',2,'2026-09-15 10:06:55',NULL);
INSERT INTO "approval_history_old" ("id","budget_proposal_id","from_status","to_status","action_by","action_at","comment") VALUES(21,5,'draft','submitted',2,'2026-09-20 06:03:38',NULL);
INSERT INTO "approval_history_old" ("id","budget_proposal_id","from_status","to_status","action_by","action_at","comment") VALUES(22,5,'submitted','manager_approved',2,'2026-09-20 06:03:56',NULL);
CREATE TABLE IF NOT EXISTS "budget_proposals_old" (
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
INSERT INTO "budget_proposals_old" ("id","fiscal_year_id","organization_id","economic_class_id","title","amount","description","status","proposed_by","created_at","submitted_at","submitted_by","approved_at","approved_by","rejected_at","rejected_by","rejection_reason") VALUES(1,3,3,1,'عنوان بودجه یک',3005000000,'بررسی اولیه','approved',2,'2026-09-12 06:36:21',NULL,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO "budget_proposals_old" ("id","fiscal_year_id","organization_id","economic_class_id","title","amount","description","status","proposed_by","created_at","submitted_at","submitted_by","approved_at","approved_by","rejected_at","rejected_by","rejection_reason") VALUES(2,3,3,1,'عنوان',764020000,'توضیح','approved',2,'2026-09-13 08:40:29',NULL,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO "budget_proposals_old" ("id","fiscal_year_id","organization_id","economic_class_id","title","amount","description","status","proposed_by","created_at","submitted_at","submitted_by","approved_at","approved_by","rejected_at","rejected_by","rejection_reason") VALUES(3,3,4,2,'درآمد مالیاتی سال ۱۴۰۷',95000000,'تست','approved',2,'2026-09-15 10:06:37',NULL,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO "budget_proposals_old" ("id","fiscal_year_id","organization_id","economic_class_id","title","amount","description","status","proposed_by","created_at","submitted_at","submitted_by","approved_at","approved_by","rejected_at","rejected_by","rejection_reason") VALUES(5,3,1,1,'درآمدی',100055000,NULL,'manager_approved',2,'2026-09-15 10:56:26',NULL,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO "budget_proposals_old" ("id","fiscal_year_id","organization_id","economic_class_id","title","amount","description","status","proposed_by","created_at","submitted_at","submitted_by","approved_at","approved_by","rejected_at","rejected_by","rejection_reason") VALUES(6,3,1,1,'بودجه جدید یک',100055000,NULL,'draft',2,'2026-09-15 10:56:44',NULL,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO "budget_proposals_old" ("id","fiscal_year_id","organization_id","economic_class_id","title","amount","description","status","proposed_by","created_at","submitted_at","submitted_by","approved_at","approved_by","rejected_at","rejected_by","rejection_reason") VALUES(7,3,1,1,'بودجه 3',15000000,NULL,'draft',2,'2026-09-15 10:57:12',NULL,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO "budget_proposals_old" ("id","fiscal_year_id","organization_id","economic_class_id","title","amount","description","status","proposed_by","created_at","submitted_at","submitted_by","approved_at","approved_by","rejected_at","rejected_by","rejection_reason") VALUES(8,3,1,1,'درآمد اولیه',50000000,'یک','draft',2,'2026-09-15 11:00:38',NULL,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO "budget_proposals_old" ("id","fiscal_year_id","organization_id","economic_class_id","title","amount","description","status","proposed_by","created_at","submitted_at","submitted_by","approved_at","approved_by","rejected_at","rejected_by","rejection_reason") VALUES(9,3,1,1,'عنوان بعدی',40000000,NULL,'draft',2,'2026-09-15 11:01:15',NULL,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO "budget_proposals_old" ("id","fiscal_year_id","organization_id","economic_class_id","title","amount","description","status","proposed_by","created_at","submitted_at","submitted_by","approved_at","approved_by","rejected_at","rejected_by","rejection_reason") VALUES(10,4,1,2,'جدید',1500000000,NULL,'draft',2,'2026-09-15 11:03:08',NULL,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO "budget_proposals_old" ("id","fiscal_year_id","organization_id","economic_class_id","title","amount","description","status","proposed_by","created_at","submitted_at","submitted_by","approved_at","approved_by","rejected_at","rejected_by","rejection_reason") VALUES(11,3,1,2,'عنوان',100100000,NULL,'draft',2,'2026-09-15 11:08:37',NULL,NULL,NULL,NULL,NULL,NULL,NULL);
CREATE TABLE IF NOT EXISTS "budget_allocations_old" (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    approved_budget_id INTEGER NOT NULL,
    organization_id INTEGER NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    percentage DECIMAL(5,2),
    allocation_date TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (approved_budget_id) REFERENCES "budget_proposals_old"(id),
    FOREIGN KEY (organization_id) REFERENCES "organizations_old"(id)
);
INSERT INTO "budget_allocations_old" ("id","approved_budget_id","organization_id","amount","percentage","allocation_date","created_at") VALUES(1,2,3,580000,35,'1404/8/3','2026-09-14 04:18:23');
INSERT INTO "budget_allocations_old" ("id","approved_budget_id","organization_id","amount","percentage","allocation_date","created_at") VALUES(2,3,4,50000000,50,'۱۴۰۷/۰۲/۱۹','2026-09-15 10:18:44');
INSERT INTO "budget_allocations_old" ("id","approved_budget_id","organization_id","amount","percentage","allocation_date","created_at") VALUES(3,3,4,10500000,30,'۱۴۰۶/۰۸/۲۳','2026-09-15 10:19:18');
INSERT INTO "budget_allocations_old" ("id","approved_budget_id","organization_id","amount","percentage","allocation_date","created_at") VALUES(5,3,1,10000,10,'۱۴۰۵/۰۶/۰۲','2026-09-15 11:15:19');
CREATE TABLE IF NOT EXISTS "budget_executions_old" (
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
    FOREIGN KEY (allocation_id) REFERENCES "budget_allocations_old"(id)
);
INSERT INTO "budget_executions_old" ("id","allocation_id","technical_code","amount","description","execution_date","approved_by_chain","accounting_doc_no","status","created_at") VALUES(1,1,'055311',11000,'توضیحات','۱۴۰۵/۰۶/۲۳',NULL,NULL,'pending','2026-09-14 04:25:59');
INSERT INTO "budget_executions_old" ("id","allocation_id","technical_code","amount","description","execution_date","approved_by_chain","accounting_doc_no","status","created_at") VALUES(3,1,'001550',450300,NULL,'۱۴۰۵/۰۶/۲۳',NULL,NULL,'pending','2026-09-14 06:07:45');
INSERT INTO "budget_executions_old" ("id","allocation_id","technical_code","amount","description","execution_date","approved_by_chain","accounting_doc_no","status","created_at") VALUES(4,1,'0012100',100000,NULL,'۱۴۰۵/۰۶/۰۲',NULL,NULL,'pending','2026-09-14 06:08:31');
INSERT INTO "budget_executions_old" ("id","allocation_id","technical_code","amount","description","execution_date","approved_by_chain","accounting_doc_no","status","created_at") VALUES(5,1,'0115050',5000,NULL,'۱۴۰۵/۰۶/۰۸',NULL,NULL,'pending','2026-09-14 06:09:36');
INSERT INTO "budget_executions_old" ("id","allocation_id","technical_code","amount","description","execution_date","approved_by_chain","accounting_doc_no","status","created_at") VALUES(6,3,'010101001',10000000,'تامین اعتبار چهار','۱۴۰۵/۰۶/۱۸',NULL,'۱۲۳۴','pending','2026-09-15 10:20:42');
INSERT INTO "budget_executions_old" ("id","allocation_id","technical_code","amount","description","execution_date","approved_by_chain","accounting_doc_no","status","created_at") VALUES(8,3,'010101010',10000,NULL,'۱۴۰۵/۰۶/۲۴',NULL,NULL,'pending','2026-09-15 11:19:44');
CREATE TABLE IF NOT EXISTS "budget_revisions_old" (
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
    FOREIGN KEY (budget_proposal_id) REFERENCES "budget_proposals_old"(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (approved_by) REFERENCES users(id)
);
INSERT INTO "budget_revisions_old" ("id","fiscal_year_id","budget_proposal_id","revision_type","old_amount","new_amount","difference","reason","status","created_by","created_at","approved_by","approved_at") VALUES(8,3,2,'increase',175000000,589020000,589020000,'اعتبارات','approved',2,'2026-09-14 05:33:51',2,'2026-09-14 05:35:00');
INSERT INTO "budget_revisions_old" ("id","fiscal_year_id","budget_proposal_id","revision_type","old_amount","new_amount","difference","reason","status","created_by","created_at","approved_by","approved_at") VALUES(9,3,1,'decrease',3055000000,50000000,-50000000,'کاهش یک','approved',2,'2026-09-14 05:34:42',2,'2026-09-14 05:34:55');
INSERT INTO "budget_revisions_old" ("id","fiscal_year_id","budget_proposal_id","revision_type","old_amount","new_amount","difference","reason","status","created_by","created_at","approved_by","approved_at") VALUES(10,3,3,'increase',100000000,100000000,100000000,'افزایش جاری یک','rejected',2,'2026-09-15 10:21:59',2,'2026-09-15 10:23:15');
INSERT INTO "budget_revisions_old" ("id","fiscal_year_id","budget_proposal_id","revision_type","old_amount","new_amount","difference","reason","status","created_by","created_at","approved_by","approved_at") VALUES(11,3,3,'decrease',100000000,5000000,-5000000,'کاهش جاری یک','approved',2,'2026-09-15 10:22:24',2,'2026-09-15 10:23:06');
INSERT INTO "budget_revisions_old" ("id","fiscal_year_id","budget_proposal_id","revision_type","old_amount","new_amount","difference","reason","status","created_by","created_at","approved_by","approved_at") VALUES(12,3,3,'increase',95000000,101100,101100,'دلائل','pending',2,'2026-09-15 11:25:01',NULL,NULL);
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
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(42,2,'admin','login','user',2,'{"success":true}','2a02:4540:90a9:6b8e:61b4:2bde:d937:f93f','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:156.0) Gecko/20100101 Firefox/156.0','2026-09-22 18:03:23');
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(43,2,'admin','base_data_created','base_data',48,'{"section":"organization","type":"general","code":"س-001001","title":"زیر سازمان یک"}','2a02:4540:90a9:6b8e:61b4:2bde:d937:f93f','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:156.0) Gecko/20100101 Firefox/156.0','2026-09-22 18:03:52');
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(44,2,'admin','base_data_created','base_data',49,'{"section":"organization","type":"general","code":"س-001001001","title":"زیر زیر سازمان یک"}','2a02:4540:90a9:6b8e:61b4:2bde:d937:f93f','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:156.0) Gecko/20100101 Firefox/156.0','2026-09-22 18:04:04');
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(45,2,'admin','base_data_deleted','base_data',49,'{}','2a02:4540:90a9:6b8e:61b4:2bde:d937:f93f','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:156.0) Gecko/20100101 Firefox/156.0','2026-09-22 18:04:14');
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(46,2,'admin','login','user',2,'{"success":true}','37.255.138.28','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36','2026-09-23 04:20:53');
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(47,2,'admin','base_data_created','base_data',50,'{"section":"economic","type":"resource","code":"001007004001","title":"یک فروش"}','37.255.138.28','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36','2026-09-23 06:28:57');
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(48,2,'admin','login','user',2,'{"success":true}','31.171.101.29','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36','2026-09-23 11:51:15');
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(49,2,'admin','base_data_created','base_data',51,'{"section":"organization","type":"general","code":"س-001001001","title":"اداره طرح و برنامه"}','31.171.101.16','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36','2026-09-23 11:53:26');
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(50,2,'admin','base_data_created','base_data',52,'{"section":"organization","type":"general","code":"س-001002","title":"سازمان دو"}','31.171.101.16','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36','2026-09-23 11:53:58');
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(51,2,'admin','login','user',2,'{"success":true}','2a02:4540:9024:ab32:7942:400d:bfc:c73','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:156.0) Gecko/20100101 Firefox/156.0','2026-09-25 07:51:35');
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(52,2,'admin','login','user',2,'{"success":true}','37.255.138.28','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','2026-09-28 06:58:03');
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(53,2,'admin','login','user',2,'{"success":true}','130.195.211.9','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','2026-10-01 09:43:17');
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(54,2,'admin','login','user',2,'{"success":true}','130.195.211.9','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','2026-10-01 09:43:17');
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(55,6,'Modir','login','user',6,'{"success":true}','130.195.211.9','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','2026-10-01 09:44:43');
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(56,2,'admin','login','user',2,'{"success":true}','130.195.211.9','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','2026-10-01 09:45:00');
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(57,6,'Modir','login','user',6,'{"success":true}','130.195.211.11','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','2026-10-01 09:47:21');
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(58,2,'admin','login','user',2,'{"success":true}','130.195.211.11','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','2026-10-01 09:47:38');
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(59,6,'Modir','login','user',6,'{"success":true}','130.195.211.6','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','2026-10-01 10:00:17');
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(60,6,'Modir','login','user',6,'{"success":true}','130.195.211.7','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','2026-10-01 10:03:12');
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(61,2,'admin','login','user',2,'{"success":true}','130.195.211.7','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','2026-10-01 10:03:30');
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(62,6,'Modir','login','user',6,'{"success":true}','130.195.211.8','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','2026-10-01 10:05:43');
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(63,6,'Modir','login','user',6,'{"success":true}','130.195.211.14','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','2026-10-02 15:14:13');
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(64,2,'admin','login','user',2,'{"success":true}','130.195.211.14','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','2026-10-02 15:14:13');
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(65,NULL,NULL,'login_failed','user',NULL,'{"username":"Modir","reason":"wrong_password"}','37.202.177.204','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','2026-10-02 15:15:37');
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(66,6,'Modir','login','user',6,'{"success":true}','37.202.177.204','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','2026-10-02 15:15:55');
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(67,6,'Modir','base_data_updated','base_data',48,'{"title":"معاونت اجرائی و خدمات شهری"}','37.202.177.204','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','2026-10-02 15:17:24');
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(68,6,'Modir','base_data_created','base_data',127,'{"section":"organization","type":"general","code":"س-002","title":"معاونت عمرانی"}','37.202.177.204','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','2026-10-02 15:17:51');
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(69,6,'Modir','base_data_deleted','base_data',127,'{}','37.202.177.204','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','2026-10-02 15:18:24');
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(70,6,'Modir','base_data_created','base_data',128,'{"section":"organization","type":"general","code":"س-002","title":"معاونت عمرانی"}','37.202.177.204','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','2026-10-02 15:18:44');
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(71,6,'Modir','base_data_deleted','base_data',128,'{}','37.202.177.204','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','2026-10-02 15:18:59');
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(72,6,'Modir','base_data_created','base_data',129,'{"section":"organization","type":"general","code":"س-002","title":"معاونت عمرانی"}','37.202.177.204','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','2026-10-02 15:19:05');
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(73,6,'Modir','base_data_created','base_data',130,'{"section":"operational","type":"mission","code":"001","title":"مأموریت کالبدی و شهرسازی"}','37.202.177.204','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','2026-10-02 15:22:18');
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(74,6,'Modir','base_data_created','base_data',131,'{"section":"operational","type":"mission","code":"002","title":"مأموریت خدمات شهری و فضای سبز"}','37.202.177.204','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','2026-10-02 15:23:08');
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(75,6,'Modir','base_data_created','base_data',132,'{"section":"operational","type":"mission","code":"003","title":"مأموریت خدمات ایمنی و مدیریت بحران"}','37.202.177.204','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','2026-10-02 15:23:49');
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(76,6,'Modir','base_data_updated','base_data',131,'{"title":"مأموریت محیط زیست و خدمات شهری"}','37.202.177.204','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','2026-10-02 15:25:28');
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(77,6,'Modir','base_data_updated','base_data',132,'{"title":"مأموریت ایمنی و مدیریت بحران"}','37.202.177.204','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','2026-10-02 15:25:38');
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(78,6,'Modir','base_data_created','base_data',133,'{"section":"operational","type":"mission","code":"004","title":"مأموریت حمل و نقل و ترافیک"}','37.202.177.204','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','2026-10-02 15:25:56');
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(79,6,'Modir','base_data_created','base_data',134,'{"section":"operational","type":"mission","code":"005","title":"مأموریت خدمات مدیریت"}','37.202.177.204','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','2026-10-02 15:26:10');
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(80,6,'Modir','base_data_created','base_data',135,'{"section":"operational","type":"mission","code":"006","title":"مأموریت اجتماعی و فرهنگی"}','37.202.177.204','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','2026-10-02 15:26:25');
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(81,6,'Modir','base_data_created','base_data',136,'{"section":"operational","type":"program","code":"001001","title":"برنامه بازآفرینی فضاهای شهری"}','37.202.177.204','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','2026-10-02 15:26:50');
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(82,6,'Modir','base_data_created','base_data',137,'{"section":"operational","type":"program","code":"001002","title":"برنامه طرح های توسعه شهری"}','37.202.177.204','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','2026-10-02 15:27:15');
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(83,6,'Modir','base_data_created','base_data',138,'{"section":"operational","type":"program","code":"001003","title":"برنامه زیباسازی شهری (ارتقای کیفیت معماری و سیما و منظر شهری)"}','37.202.177.204','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','2026-10-02 15:27:50');
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(84,6,'Modir','base_data_created','base_data',139,'{"section":"operational","type":"program","code":"001004","title":"برنامه تهیه و اجرای طرح های موضعی وموضوعی شهر"}','37.202.177.204','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','2026-10-02 15:28:17');
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(85,2,'admin','permissions_changed','user',6,'{"count":28}','2a02:4540:902a:eea2:7469:3fd4:2db:8ee1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','2026-10-03 14:01:46');
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(86,2,'admin','permissions_changed','user',6,'{"count":28}','2a02:4540:902a:eea2:7469:3fd4:2db:8ee1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','2026-10-03 14:01:55');
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(87,2,'admin','permissions_changed','user',6,'{"count":28}','2a02:4540:902a:eea2:7469:3fd4:2db:8ee1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','2026-10-03 14:02:01');
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(88,2,'admin','permissions_changed','user',6,'{"count":28}','2a02:4540:902a:eea2:7469:3fd4:2db:8ee1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','2026-10-03 14:02:08');
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(89,NULL,NULL,'login_failed','user',NULL,'{"username":"Modir","reason":"wrong_password"}','2a02:4540:902a:eea2:7469:3fd4:2db:8ee1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','2026-10-03 14:02:39');
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(90,6,'Modir','login','user',6,'{"success":true}','2a02:4540:902a:eea2:7469:3fd4:2db:8ee1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','2026-10-03 14:02:48');
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(91,2,'admin','permissions_changed','user',6,'{"count":28}','2a02:4540:902a:eea2:7469:3fd4:2db:8ee1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','2026-10-03 14:03:17');
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(92,2,'admin','permissions_changed','user',6,'{"count":28}','2a02:4540:902a:eea2:7469:3fd4:2db:8ee1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','2026-10-03 14:04:35');
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(93,2,'admin','permissions_changed','user',4,'{"count":5}','2a02:4540:902a:eea2:7469:3fd4:2db:8ee1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','2026-10-03 14:11:08');
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(94,2,'admin','permissions_changed','user',6,'{"count":11}','2a02:4540:902a:eea2:7469:3fd4:2db:8ee1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','2026-10-03 14:11:36');
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(95,2,'admin','permissions_changed','user',6,'{"count":5}','2a02:4540:902a:eea2:7469:3fd4:2db:8ee1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','2026-10-03 14:11:48');
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(96,6,'Modir','login','user',6,'{"success":true}','2a02:4540:902a:eea2:7469:3fd4:2db:8ee1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','2026-10-03 14:15:24');
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(97,2,'admin','permissions_changed','user',6,'{"count":0}','2a02:4540:902a:eea2:7469:3fd4:2db:8ee1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','2026-10-03 14:15:51');
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(98,2,'admin','permissions_changed','user',6,'{"count":5}','2a02:4540:902a:eea2:7469:3fd4:2db:8ee1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','2026-10-03 14:15:56');
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(99,6,'Modir','login','user',6,'{"success":true}','2a02:4540:902a:eea2:7469:3fd4:2db:8ee1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','2026-10-03 14:16:06');
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(100,2,'admin','permissions_changed','user',6,'{"count":5}','2a02:4540:902a:eea2:7469:3fd4:2db:8ee1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','2026-10-03 14:29:34');
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(101,2,'admin','permissions_changed','user',6,'{"count":5}','2a02:4540:902a:eea2:7469:3fd4:2db:8ee1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','2026-10-03 14:32:09');
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(102,2,'admin','permissions_changed','user',6,'{"count":7}','2a02:4540:902a:eea2:7469:3fd4:2db:8ee1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','2026-10-03 14:32:26');
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(103,2,'admin','permissions_changed','user',6,'{"count":26}','2a02:4540:902a:eea2:7469:3fd4:2db:8ee1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','2026-10-03 14:43:32');
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(104,2,'admin','permissions_changed','user',6,'{"count":26}','2a02:4540:902a:eea2:7469:3fd4:2db:8ee1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','2026-10-03 14:44:04');
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(105,2,'admin','permissions_changed','user',6,'{"count":26}','5.219.233.53','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','2026-10-03 14:56:22');
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(106,2,'admin','permissions_changed','user',6,'{"count":26}','5.219.233.53','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','2026-10-03 15:00:36');
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(107,2,'admin','permissions_changed','user',6,'{"count":26}','5.219.233.53','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','2026-10-03 15:00:46');
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(108,6,'Modir','login','user',6,'{"success":true}','37.255.138.28','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','2026-10-05 05:24:06');
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(109,2,'admin','login','user',2,'{"success":true}','2a02:4540:9065:9a68:e0ee:2748:aec0:c778','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','2026-10-06 13:39:18');
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(110,6,'Modir','login','user',6,'{"success":true}','2a02:4540:9065:9a68:e0ee:2748:aec0:c778','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','2026-10-06 13:40:10');
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(111,2,'admin','permissions_changed','user',2,'{"count":26}','2a02:4540:9065:9a68:e0ee:2748:aec0:c778','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','2026-10-06 13:41:10');
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(112,6,'Modir','login','user',6,'{"success":true}','2a02:4540:9065:9a68:e0ee:2748:aec0:c778','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','2026-10-06 13:49:55');
INSERT INTO "audit_log" ("id","user_id","username","action","entity_type","entity_id","details","ip_address","user_agent","created_at") VALUES(113,6,'Modir','login','user',6,'{"success":true}','2a02:4540:9065:9a68:e0ee:2748:aec0:c778','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','2026-10-06 13:52:21');
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

    -- تاریخ‌ها
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at_shamsi TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at_shamsi TEXT,

    FOREIGN KEY (fiscal_year_id) REFERENCES fiscal_years(id),
    FOREIGN KEY (parent_id) REFERENCES base_data(id)
);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(1,NULL,'economic','resource',NULL,'001',3,0,'گروه','منابع (درآمدها)',NULL,NULL,NULL,1,1,'2026-09-22 10:49:51','1405/06/31','2026-09-22 10:49:51',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(2,NULL,'economic','resource',NULL,'001001',3,1,'سرفصل','درآمدهای ناشی از عوارض عمومی (مستمر)',1,NULL,NULL,1,1,'2026-09-22 10:49:51','1405/06/31','2026-09-22 10:49:51',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(3,NULL,'economic','resource',NULL,'001002',3,1,'سرفصل','درآمدهای ناشی از عوارض اختصاصی',1,NULL,NULL,2,1,'2026-09-22 10:49:51','1405/06/31','2026-09-22 10:49:51',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(4,NULL,'economic','resource',NULL,'001003',3,1,'سرفصل','بهای خدمات و درآمدهای مؤسسات انتفاعی شهرداری',1,NULL,NULL,3,1,'2026-09-22 10:49:51','1405/06/31','2026-09-22 10:49:51',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(5,NULL,'economic','resource',NULL,'001004',3,1,'سرفصل','درآمدهای حاصل از وجوه و اموال شهرداری',1,NULL,NULL,4,1,'2026-09-22 10:49:51','1405/06/31','2026-09-22 10:49:51',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(6,NULL,'economic','resource',NULL,'001005',3,1,'سرفصل','کمک‌های اعطائی دولت و سازمان‌های دولتی',1,NULL,NULL,5,1,'2026-09-22 10:49:51','1405/06/31','2026-09-22 10:49:51',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(7,NULL,'economic','resource',NULL,'001006',3,1,'سرفصل','اعانات و کمک‌های اهدائی اشخاص و سازمان‌های خصوصی',1,NULL,NULL,6,1,'2026-09-22 10:49:51','1405/06/31','2026-09-22 10:49:51',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(8,NULL,'economic','resource',NULL,'001007',3,1,'سرفصل','واگذاری دارائی‌های سرمایه‌ای',1,NULL,NULL,7,1,'2026-09-22 10:49:51','1405/06/31','2026-09-22 10:49:51',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(9,NULL,'economic','resource',NULL,'001008',3,1,'سرفصل','واگذاری دارائی‌های مالی',1,NULL,NULL,8,1,'2026-09-22 10:49:51','1405/06/31','2026-09-22 10:49:51',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(10,NULL,'economic','resource',NULL,'001007001',3,2,'بند','درآمدهای نقدی و غیرنقدی ناشی از اجرای تبصره ۴ ماده ۱۰۱',8,NULL,NULL,1,1,'2026-09-22 10:49:51','1405/06/31','2026-09-22 10:49:51',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(11,NULL,'economic','resource',NULL,'001007002',3,2,'بند','فروش اموال غیر منقول',8,NULL,NULL,2,1,'2026-09-22 10:49:51','1405/06/31','2026-09-22 10:49:51',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(12,NULL,'economic','resource',NULL,'001007003',3,2,'بند','فروش اموال منقول و اسقاطی',8,NULL,NULL,3,1,'2026-09-22 10:49:51','1405/06/31','2026-09-22 10:49:51',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(13,NULL,'economic','resource',NULL,'001007004',3,2,'بند','فروش سرقفلی',8,NULL,NULL,4,1,'2026-09-22 10:49:51','1405/06/31','2026-09-22 10:49:51',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(14,NULL,'economic','resource',NULL,'001007005',3,2,'بند','فروش حقوق انتفاعی',8,NULL,NULL,5,1,'2026-09-22 10:49:51','1405/06/31','2026-09-22 10:49:51',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(15,NULL,'economic','resource',NULL,'001007006',3,2,'بند','سایر',8,NULL,NULL,6,1,'2026-09-22 10:49:51','1405/06/31','2026-09-22 10:49:51',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(16,NULL,'economic','resource',NULL,'001008001',3,2,'بند','وام‌های دریافتی',9,NULL,NULL,1,1,'2026-09-22 10:49:51','1405/06/31','2026-09-22 10:49:51',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(17,NULL,'economic','resource',NULL,'001008002',3,2,'بند','اوراق مشارکت',9,NULL,NULL,2,1,'2026-09-22 10:49:51','1405/06/31','2026-09-22 10:49:51',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(18,NULL,'economic','resource',NULL,'001008003',3,2,'بند','سایر منابع',9,NULL,NULL,3,1,'2026-09-22 10:49:51','1405/06/31','2026-09-22 10:49:51',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(19,NULL,'economic','expense',NULL,'002',3,0,'گروه','مصارف (هزینه‌ها)',NULL,NULL,NULL,2,1,'2026-09-22 10:49:51','1405/06/31','2026-09-22 10:49:51',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(20,NULL,'economic','expense',NULL,'002001',3,1,'سرفصل','هزینه‌ها (جاری)',19,NULL,NULL,1,1,'2026-09-22 10:49:51','1405/06/31','2026-09-22 10:49:51',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(21,NULL,'economic','expense',NULL,'002002',3,1,'سرفصل','تملک دارائی‌های سرمایه‌ای',19,NULL,NULL,2,1,'2026-09-22 10:49:51','1405/06/31','2026-09-22 10:49:51',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(22,NULL,'economic','expense',NULL,'002003',3,1,'سرفصل','تملک دارائی‌های مالی',19,NULL,NULL,3,1,'2026-09-22 10:49:51','1405/06/31','2026-09-22 10:49:51',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(23,NULL,'economic','expense',NULL,'002001001',3,2,'فصل','فصل اول - جبران خدمات کارکنان',20,NULL,NULL,1,1,'2026-09-22 10:49:51','1405/06/31','2026-09-22 10:49:51',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(24,NULL,'economic','expense',NULL,'002001002',3,2,'فصل','فصل دوم',20,NULL,NULL,2,1,'2026-09-22 10:49:51','1405/06/31','2026-09-22 10:49:51',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(25,NULL,'economic','expense',NULL,'002001003',3,2,'فصل','فصل سوم',20,NULL,NULL,3,1,'2026-09-22 10:49:51','1405/06/31','2026-09-22 10:49:51',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(26,NULL,'economic','expense',NULL,'002001004',3,2,'فصل','فصل چهارم',20,NULL,NULL,4,1,'2026-09-22 10:49:51','1405/06/31','2026-09-22 10:49:51',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(27,NULL,'economic','expense',NULL,'002001005',3,2,'فصل','فصل پنجم',20,NULL,NULL,5,1,'2026-09-22 10:49:51','1405/06/31','2026-09-22 10:49:51',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(28,NULL,'economic','expense',NULL,'002001006',3,2,'فصل','فصل ششم',20,NULL,NULL,6,1,'2026-09-22 10:49:51','1405/06/31','2026-09-22 10:49:51',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(29,NULL,'economic','expense',NULL,'002001007',3,2,'فصل','فصل هفتم',20,NULL,NULL,7,1,'2026-09-22 10:49:51','1405/06/31','2026-09-22 10:49:51',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(30,NULL,'economic','expense',NULL,'002001008',3,2,'فصل','فصل هشتم',20,NULL,NULL,8,1,'2026-09-22 10:49:51','1405/06/31','2026-09-22 10:49:51',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(31,NULL,'economic','expense',NULL,'002001001001',3,3,'بند','حقوق و دستمزد',23,NULL,NULL,1,1,'2026-09-22 10:49:51','1405/06/31','2026-09-22 10:49:51',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(32,NULL,'economic','expense',NULL,'002001001001001',3,4,'جزء','حقوق شهردار',31,NULL,NULL,1,1,'2026-09-22 10:49:51','1405/06/31','2026-09-22 10:49:51',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(33,NULL,'economic','expense',NULL,'002001001001002',3,4,'جزء','حقوق کارمندان رسمی و پیمانی (تأمین اجتماعی)',31,NULL,NULL,2,1,'2026-09-22 10:49:51','1405/06/31','2026-09-22 10:49:51',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(34,NULL,'economic','expense',NULL,'002002001',3,2,'بند','ساختمان و سایر مستحدثات',21,NULL,NULL,1,1,'2026-09-22 10:49:51','1405/06/31','2026-09-22 10:49:51',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(35,NULL,'economic','expense',NULL,'002002002',3,2,'بند','ماشین‌آلات و تجهیزات',21,NULL,NULL,2,1,'2026-09-22 10:49:51','1405/06/31','2026-09-22 10:49:51',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(36,NULL,'economic','expense',NULL,'002002003',3,2,'بند','سایر دارائی‌های ثابت',21,NULL,NULL,3,1,'2026-09-22 10:49:51','1405/06/31','2026-09-22 10:49:51',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(37,NULL,'economic','expense',NULL,'002002004',3,2,'بند','موجودی انبار',21,NULL,NULL,4,1,'2026-09-22 10:49:51','1405/06/31','2026-09-22 10:49:51',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(38,NULL,'economic','expense',NULL,'002002005',3,2,'بند','اقلام گرانبها',21,NULL,NULL,5,1,'2026-09-22 10:49:51','1405/06/31','2026-09-22 10:49:51',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(39,NULL,'economic','expense',NULL,'002002006',3,2,'بند','زمین',21,NULL,NULL,6,1,'2026-09-22 10:49:51','1405/06/31','2026-09-22 10:49:51',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(40,NULL,'economic','expense',NULL,'002002007',3,2,'بند','سایر دارائی‌های تولید نشده',21,NULL,NULL,7,1,'2026-09-22 10:49:51','1405/06/31','2026-09-22 10:49:51',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(41,NULL,'economic','expense',NULL,'002003001',3,2,'بند','تعهدات قطعی نشده انتقالی سنواتی',22,NULL,NULL,1,1,'2026-09-22 10:49:51','1405/06/31','2026-09-22 10:49:51',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(42,NULL,'economic','expense',NULL,'002003002',3,2,'بند','بازپرداخت اصل و سود تسهیلات داخلی',22,NULL,NULL,2,1,'2026-09-22 10:49:51','1405/06/31','2026-09-22 10:49:51',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(43,NULL,'economic','expense',NULL,'002003003',3,2,'بند','بازپرداخت اصل و سود تسهیلات خارجی',22,NULL,NULL,3,1,'2026-09-22 10:49:51','1405/06/31','2026-09-22 10:49:51',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(44,NULL,'economic','expense',NULL,'002003004',3,2,'بند','بازپرداخت اصل و سود اوراق مشارکت، صکوک و سایر',22,NULL,NULL,4,1,'2026-09-22 10:49:51','1405/06/31','2026-09-22 10:49:51',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(47,NULL,'organization','general','س','س-001',3,0,'حوزه','حوزه شهردار',NULL,NULL,NULL,1,1,'2026-09-22 18:02:00','1405/06/31','2026-09-22 18:02:00',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(48,NULL,'organization','general','س','س-001001',3,1,NULL,'معاونت اجرائی و خدمات شهری',47,NULL,NULL,0,1,'2026-09-22 18:03:52','1405/06/31','2026-10-02 15:17:24','1405/07/10');
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(50,NULL,'economic','resource',NULL,'001007004001',3,3,'جزء','یک فروش',13,NULL,NULL,0,1,'2026-09-23 06:28:57','1405/07/01','2026-09-23 06:28:57','1405/07/01');
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(51,NULL,'organization','general','س','س-001001001',3,2,'اداره','اداره طرح و برنامه',48,NULL,NULL,0,1,'2026-09-23 11:53:26','1405/07/01','2026-09-23 11:53:26','1405/07/01');
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(52,NULL,'organization','general','س','س-001002',3,1,'معاونت','سازمان دو',47,NULL,NULL,0,1,'2026-09-23 11:53:58','1405/07/01','2026-09-23 11:53:58','1405/07/01');
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(53,NULL,'accounting','asset','ح','ح-001',3,0,'گروه','دارایی‌ها',NULL,NULL,NULL,1,1,'2026-09-28 06:49:08','1405/06/31','2026-09-28 06:49:08',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(54,NULL,'accounting','liability','ح','ح-002',3,0,'گروه','بدهی‌ها',NULL,NULL,NULL,2,1,'2026-09-28 06:49:08','1405/06/31','2026-09-28 06:49:08',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(55,NULL,'accounting','equity','ح','ح-003',3,0,'گروه','سرمایه',NULL,NULL,NULL,3,1,'2026-09-28 06:49:08','1405/06/31','2026-09-28 06:49:08',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(56,NULL,'accounting','performance','ح','ح-004',3,0,'گروه','عملکرد (مازاد/کسری) درآمد بر هزینه',NULL,NULL,NULL,4,1,'2026-09-28 06:49:08','1405/06/31','2026-09-28 06:49:08',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(57,NULL,'accounting','warehouse','ح','ح-005',3,0,'گروه','انبارداری',NULL,NULL,NULL,5,1,'2026-09-28 06:49:08','1405/06/31','2026-09-28 06:49:08',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(58,NULL,'accounting','asset','ح','ح-001001',3,1,'سرفصل','موجودی نقد و بانک‌ها (نقل از خزانه‌داری)',53,NULL,NULL,1,1,'2026-09-28 06:49:08','1405/06/31','2026-09-28 06:49:08',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(59,NULL,'accounting','asset','ح','ح-001002',3,1,'سرفصل','بدهکاران',53,NULL,NULL,2,1,'2026-09-28 06:49:08','1405/06/31','2026-09-28 06:49:08',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(60,NULL,'accounting','asset','ح','ح-001003',3,1,'سرفصل','اموال',53,NULL,NULL,3,1,'2026-09-28 06:49:08','1405/06/31','2026-09-28 06:49:08',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(61,NULL,'accounting','asset','ح','ح-001002001',3,2,'کل','بدهکاران حقیقی (نقل از اشخاص)',59,NULL,NULL,1,1,'2026-09-28 06:49:08','1405/06/31','2026-09-28 06:49:08',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(62,NULL,'accounting','asset','ح','ح-001002002',3,2,'کل','بدهکاران حقوقی (نقل از اشخاص)',59,NULL,NULL,2,1,'2026-09-28 06:49:08','1405/06/31','2026-09-28 06:49:08',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(63,NULL,'accounting','asset','ح','ح-001003001',3,2,'کل','اموال منقول (تقسیم‌بندی بر اساس جدول ۱۵۱ قانون مالیات‌های مستقیم)',60,NULL,NULL,1,1,'2026-09-28 06:49:08','1405/06/31','2026-09-28 06:49:08',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(64,NULL,'accounting','asset','ح','ح-001003002',3,2,'کل','اموال غیر منقول',60,NULL,NULL,2,1,'2026-09-28 06:49:08','1405/06/31','2026-09-28 06:49:08',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(65,NULL,'accounting','liability','ح','ح-002001',3,1,'سرفصل','بستانکاران',54,NULL,NULL,1,1,'2026-09-28 06:49:08','1405/06/31','2026-09-28 06:49:08',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(66,NULL,'accounting','liability','ح','ح-002001001',3,2,'کل','بستانکاران حقیقی (نقل از اشخاص)',65,NULL,NULL,1,1,'2026-09-28 06:49:08','1405/06/31','2026-09-28 06:49:08',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(67,NULL,'accounting','liability','ح','ح-002001002',3,2,'کل','بستانکاران حقوقی (نقل از اشخاص)',65,NULL,NULL,2,1,'2026-09-28 06:49:08','1405/06/31','2026-09-28 06:49:08',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(68,NULL,'accounting','warehouse','ح','ح-005001',3,1,'سرفصل','کدینگ کالاهای انبار بر اساس استاندارد انبارداری',57,NULL,NULL,1,1,'2026-09-28 06:49:08','1405/06/31','2026-09-28 06:49:08',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(69,NULL,'accounting','warehouse','ح','ح-005002',3,1,'سرفصل','تعریف کد اموال',57,NULL,NULL,2,1,'2026-09-28 06:49:08','1405/06/31','2026-09-28 06:49:08',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(70,NULL,'accounting','warehouse','ح','ح-005003',3,1,'سرفصل','تعریف استهلاکات اموال بر اساس ق.م.م',57,NULL,NULL,3,1,'2026-09-28 06:49:08','1405/06/31','2026-09-28 06:49:08',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(71,NULL,'accounting','warehouse','ح','ح-005004',3,1,'سرفصل','جعداری اموال',57,NULL,NULL,4,1,'2026-09-28 06:49:08','1405/06/31','2026-09-28 06:49:08',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(72,NULL,'accounting','warehouse','ح','ح-005002001',3,2,'کل','اموال سرمایه‌ای',69,NULL,NULL,1,1,'2026-09-28 06:49:08','1405/06/31','2026-09-28 06:49:08',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(73,NULL,'accounting','warehouse','ح','ح-005002002',3,2,'کل','اموال اداری',69,NULL,NULL,2,1,'2026-09-28 06:49:08','1405/06/31','2026-09-28 06:49:08',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(74,NULL,'accounting','warehouse','ح','ح-005002003',3,2,'کل','اموال در حکم مصرفی',69,NULL,NULL,3,1,'2026-09-28 06:49:08','1405/06/31','2026-09-28 06:49:08',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(75,NULL,'accounting','warehouse','ح','ح-005002004',3,2,'کل','اموال مصرفی',69,NULL,NULL,4,1,'2026-09-28 06:49:08','1405/06/31','2026-09-28 06:49:08',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(76,NULL,'accounting','warehouse','ح','ح-005004001',3,2,'کل','ثبت اموال تحویلی اداری',71,NULL,NULL,1,1,'2026-09-28 06:49:08','1405/06/31','2026-09-28 06:49:08',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(77,NULL,'accounting','warehouse','ح','ح-005004002',3,2,'کل','ثبت اموال منقول تحویلی',71,NULL,NULL,2,1,'2026-09-28 06:49:08','1405/06/31','2026-09-28 06:49:08',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(78,NULL,'accounting','warehouse','ح','ح-005004003',3,2,'کل','ثبت اموال غیرمنقول تحویلی',71,NULL,NULL,3,1,'2026-09-28 06:49:08','1405/06/31','2026-09-28 06:49:08',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(79,NULL,'accounting','warehouse','ح','ح-005004004',3,2,'کل','ثبت گردش اموال بین کارکنان',71,NULL,NULL,4,1,'2026-09-28 06:49:08','1405/06/31','2026-09-28 06:49:08',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(80,NULL,'budget_type','credit',NULL,'001',3,0,'نوع','اعتبارات هزینه‌ای',NULL,NULL,NULL,1,1,'2026-09-28 09:44:42','1405/06/31','2026-09-28 09:44:42',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(81,NULL,'budget_type','credit',NULL,'002',3,0,'نوع','اعتبارات تملک دارایی سرمایه‌ای',NULL,NULL,NULL,2,1,'2026-09-28 09:44:42','1405/06/31','2026-09-28 09:44:42',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(82,NULL,'budget_type','credit',NULL,'003',3,0,'نوع','اعتبارات تملک دارایی مالی',NULL,NULL,NULL,3,1,'2026-09-28 09:44:42','1405/06/31','2026-09-28 09:44:42',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(83,NULL,'budget_type','usage',NULL,'001',3,0,'نوع','مصرف عمومی',NULL,NULL,NULL,1,1,'2026-09-28 09:44:42','1405/06/31','2026-09-28 09:44:42',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(84,NULL,'budget_type','usage',NULL,'002',3,0,'نوع','مصرف اختصاصی',NULL,NULL,NULL,2,1,'2026-09-28 09:44:42','1405/06/31','2026-09-28 09:44:42',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(106,NULL,'goods','goods',NULL,'1',3,1,'گروه اصلی','کالاها',NULL,NULL,NULL,0,1,'2026-10-01 09:38:55',NULL,'2026-10-01 09:38:55',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(107,NULL,'goods','goods',NULL,'2',3,1,'گروه اصلی','خدمات',NULL,NULL,NULL,0,1,'2026-10-01 09:38:55',NULL,'2026-10-01 09:38:55',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(108,NULL,'goods','goods',NULL,'3',3,1,'گروه اصلی','دارایی‌های ثابت',NULL,NULL,NULL,0,1,'2026-10-01 09:38:55',NULL,'2026-10-01 09:38:55',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(109,NULL,'goods','goods',NULL,'101',3,2,'گروه فرعی','مواد مصرفی',106,NULL,NULL,0,1,'2026-10-01 09:38:55',NULL,'2026-10-01 09:38:55',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(110,NULL,'goods','goods',NULL,'102',3,2,'گروه فرعی','قطعات یدکی',106,NULL,NULL,0,1,'2026-10-01 09:38:55',NULL,'2026-10-01 09:38:55',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(111,NULL,'goods','goods',NULL,'103',3,2,'گروه فرعی','لوازم اداری',106,NULL,NULL,0,1,'2026-10-01 09:38:55',NULL,'2026-10-01 09:38:55',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(112,NULL,'goods','goods',NULL,'104',3,2,'گروه فرعی','تجهیزات فنی',106,NULL,NULL,0,1,'2026-10-01 09:38:55',NULL,'2026-10-01 09:38:55',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(113,NULL,'goods','goods',NULL,'105',3,2,'گروه فرعی','ابزارآلات',106,NULL,NULL,0,1,'2026-10-01 09:38:55',NULL,'2026-10-01 09:38:55',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(114,NULL,'goods','goods',NULL,'201',3,2,'گروه فرعی','خدمات فنی و مهندسی',107,NULL,NULL,0,1,'2026-10-01 09:38:55',NULL,'2026-10-01 09:38:55',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(115,NULL,'goods','goods',NULL,'202',3,2,'گروه فرعی','خدمات عمومی',107,NULL,NULL,0,1,'2026-10-01 09:38:55',NULL,'2026-10-01 09:38:55',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(116,NULL,'goods','goods',NULL,'203',3,2,'گروه فرعی','خدمات آموزشی',107,NULL,NULL,0,1,'2026-10-01 09:38:55',NULL,'2026-10-01 09:38:55',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(117,NULL,'goods','goods',NULL,'204',3,2,'گروه فرعی','خدمات بهداشتی و درمانی',107,NULL,NULL,0,1,'2026-10-01 09:38:55',NULL,'2026-10-01 09:38:55',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(118,NULL,'goods','goods',NULL,'205',3,2,'گروه فرعی','خدمات فرهنگی و هنری',107,NULL,NULL,0,1,'2026-10-01 09:38:55',NULL,'2026-10-01 09:38:55',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(119,NULL,'goods','goods',NULL,'206',3,2,'گروه فرعی','خدمات رایانه‌ای و نرم‌افزاری',107,NULL,NULL,0,1,'2026-10-01 09:38:55',NULL,'2026-10-01 09:38:55',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(120,NULL,'goods','goods',NULL,'207',3,2,'گروه فرعی','خدمات حمل و نقل',107,NULL,NULL,0,1,'2026-10-01 09:38:55',NULL,'2026-10-01 09:38:55',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(121,NULL,'goods','goods',NULL,'301',3,2,'گروه فرعی','ساختمان‌ها',108,NULL,NULL,0,1,'2026-10-01 09:38:55',NULL,'2026-10-01 09:38:55',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(122,NULL,'goods','goods',NULL,'302',3,2,'گروه فرعی','ماشین‌آلات و تجهیزات',108,NULL,NULL,0,1,'2026-10-01 09:38:55',NULL,'2026-10-01 09:38:55',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(123,NULL,'goods','goods',NULL,'303',3,2,'گروه فرعی','وسایل نقلیه',108,NULL,NULL,0,1,'2026-10-01 09:38:55',NULL,'2026-10-01 09:38:55',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(124,NULL,'goods','goods',NULL,'304',3,2,'گروه فرعی','اثاثیه و منصوبات',108,NULL,NULL,0,1,'2026-10-01 09:38:55',NULL,'2026-10-01 09:38:55',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(125,NULL,'goods','goods',NULL,'305',3,2,'گروه فرعی','زمین',108,NULL,NULL,0,1,'2026-10-01 09:38:55',NULL,'2026-10-01 09:38:55',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(126,NULL,'goods','goods',NULL,'306',3,2,'گروه فرعی','دارایی‌های نامشهود',108,NULL,NULL,0,1,'2026-10-01 09:38:55',NULL,'2026-10-01 09:38:55',NULL);
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(129,NULL,'organization','general','س','س-002',3,0,'حوزه','معاونت عمرانی',NULL,NULL,NULL,0,1,'2026-10-02 15:19:05','1405/07/10','2026-10-02 15:19:05','1405/07/10');
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(130,NULL,'operational','mission',NULL,'001',3,0,'مأموریت','مأموریت کالبدی و شهرسازی',NULL,NULL,NULL,0,1,'2026-10-02 15:22:18','1405/07/10','2026-10-02 15:22:18','1405/07/10');
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(131,NULL,'operational','mission',NULL,'002',3,0,NULL,'مأموریت محیط زیست و خدمات شهری',NULL,NULL,NULL,0,1,'2026-10-02 15:23:08','1405/07/10','2026-10-02 15:25:28','1405/07/10');
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(132,NULL,'operational','mission',NULL,'003',3,0,NULL,'مأموریت ایمنی و مدیریت بحران',NULL,NULL,NULL,0,1,'2026-10-02 15:23:49','1405/07/10','2026-10-02 15:25:38','1405/07/10');
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(133,NULL,'operational','mission',NULL,'004',3,0,'مأموریت','مأموریت حمل و نقل و ترافیک',NULL,NULL,NULL,0,1,'2026-10-02 15:25:56','1405/07/10','2026-10-02 15:25:56','1405/07/10');
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(134,NULL,'operational','mission',NULL,'005',3,0,'مأموریت','مأموریت خدمات مدیریت',NULL,NULL,NULL,0,1,'2026-10-02 15:26:10','1405/07/10','2026-10-02 15:26:10','1405/07/10');
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(135,NULL,'operational','mission',NULL,'006',3,0,'مأموریت','مأموریت اجتماعی و فرهنگی',NULL,NULL,NULL,0,1,'2026-10-02 15:26:25','1405/07/10','2026-10-02 15:26:25','1405/07/10');
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(136,NULL,'operational','program',NULL,'001001',3,1,'برنامه','برنامه بازآفرینی فضاهای شهری',130,NULL,NULL,0,1,'2026-10-02 15:26:50','1405/07/10','2026-10-02 15:26:50','1405/07/10');
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(137,NULL,'operational','program',NULL,'001002',3,1,'برنامه','برنامه طرح های توسعه شهری',130,NULL,NULL,0,1,'2026-10-02 15:27:15','1405/07/10','2026-10-02 15:27:15','1405/07/10');
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(138,NULL,'operational','program',NULL,'001003',3,1,'برنامه','برنامه زیباسازی شهری (ارتقای کیفیت معماری و سیما و منظر شهری)',130,NULL,NULL,0,1,'2026-10-02 15:27:50','1405/07/10','2026-10-02 15:27:50','1405/07/10');
INSERT INTO "base_data" ("id","fiscal_year_id","section","type","prefix","code","digit_count","level","level_name","title","parent_id","description","extra_data","sort_order","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(139,NULL,'operational','program',NULL,'001004',3,1,'برنامه','برنامه تهیه و اجرای طرح های موضعی وموضوعی شهر',130,NULL,NULL,0,1,'2026-10-02 15:28:17','1405/07/10','2026-10-02 15:28:17','1405/07/10');
CREATE TABLE budget_proposals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fiscal_year_id INTEGER NOT NULL,
    organization_id INTEGER NOT NULL,        -- FK به base_data (section=organization)
    economic_class_id INTEGER NOT NULL,      -- FK به base_data (section=economic)
    title TEXT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'submitted', 'manager_approved', 'finance_approved', 'approved', 'rejected')),
    proposed_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at_shamsi TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at_shamsi TEXT,
    submitted_at DATETIME,
    submitted_by INTEGER,
    approved_at DATETIME,
    approved_by INTEGER,
    rejected_at DATETIME,
    rejected_by INTEGER,
    rejection_reason TEXT,
    FOREIGN KEY (fiscal_year_id) REFERENCES fiscal_years(id),
    FOREIGN KEY (organization_id) REFERENCES base_data(id),
    FOREIGN KEY (economic_class_id) REFERENCES base_data(id),
    FOREIGN KEY (proposed_by) REFERENCES users(id)
);
CREATE TABLE budget_allocations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    approved_budget_id INTEGER NOT NULL,
    organization_id INTEGER NOT NULL,        -- FK به base_data
    amount DECIMAL(15,2) NOT NULL,
    percentage DECIMAL(5,2),
    allocation_date TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at_shamsi TEXT,
    FOREIGN KEY (approved_budget_id) REFERENCES budget_proposals(id),
    FOREIGN KEY (organization_id) REFERENCES base_data(id)
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
    created_at_shamsi TEXT,
    FOREIGN KEY (allocation_id) REFERENCES budget_allocations(id)
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
    created_at_shamsi TEXT,
    approved_by INTEGER,
    approved_at DATETIME,
    FOREIGN KEY (fiscal_year_id) REFERENCES fiscal_years(id),
    FOREIGN KEY (budget_proposal_id) REFERENCES budget_proposals(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (approved_by) REFERENCES users(id)
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
CREATE TABLE persons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- نوع شخص
  person_type TEXT NOT NULL,  -- 'employee', 'natural', 'legal', 'floating'
  
  -- کدینگ ۱۰ رقمی
  code TEXT NOT NULL UNIQUE,
  parent_id INTEGER,
  
  -- سطح در درخت
  level INTEGER DEFAULT 0,
  level_name TEXT,
  
  -- اطلاعات هویتی
  full_name TEXT NOT NULL,
  national_id TEXT,              -- کد ملی ۱۰ رقمی
  economic_code TEXT,            -- کد اقتصادی (حقوقی)
  registration_number TEXT,      -- شماره ثبت (حقوقی)
  father_name TEXT,
  id_number TEXT,                -- شماره شناسنامه
  birth_date_shamsi TEXT,
  
  -- اطلاعات تماس
  phone TEXT,
  mobile TEXT,
  address TEXT,
  postal_code TEXT,
  email TEXT,
  
  -- اطلاعات کارکنان
  employee_code TEXT,            -- کد پرسنلی
  employment_type TEXT,          -- 'رسمی', 'پیمانی', 'قراردادی'
  position TEXT,
  hire_date_shamsi TEXT,
  end_date_shamsi TEXT,
  
  -- اطلاعات مالی
  bank_name TEXT,
  bank_account TEXT,
  iban TEXT,
  
  -- استعلام کد ملی (placeholder)
  national_id_verified BOOLEAN DEFAULT 0,
  national_id_verified_at DATETIME,
  
  -- عمومی
  notes TEXT,
  extra_data TEXT,               -- JSON
  is_active BOOLEAN DEFAULT 1,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at_shamsi TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at_shamsi TEXT,
  
  FOREIGN KEY (parent_id) REFERENCES persons(id)
);
INSERT INTO "persons" ("id","person_type","code","parent_id","level","level_name","full_name","national_id","economic_code","registration_number","father_name","id_number","birth_date_shamsi","phone","mobile","address","postal_code","email","employee_code","employment_type","position","hire_date_shamsi","end_date_shamsi","bank_name","bank_account","iban","national_id_verified","national_id_verified_at","notes","extra_data","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(1,'employee','1000000000',NULL,1,'گروه اصلی','کارکنان',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,1,'2026-10-01 09:38:22',NULL,'2026-10-01 09:38:22',NULL);
INSERT INTO "persons" ("id","person_type","code","parent_id","level","level_name","full_name","national_id","economic_code","registration_number","father_name","id_number","birth_date_shamsi","phone","mobile","address","postal_code","email","employee_code","employment_type","position","hire_date_shamsi","end_date_shamsi","bank_name","bank_account","iban","national_id_verified","national_id_verified_at","notes","extra_data","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(2,'natural','2000000000',NULL,1,'گروه اصلی','اشخاص حقیقی',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,1,'2026-10-01 09:38:22',NULL,'2026-10-01 09:38:22',NULL);
INSERT INTO "persons" ("id","person_type","code","parent_id","level","level_name","full_name","national_id","economic_code","registration_number","father_name","id_number","birth_date_shamsi","phone","mobile","address","postal_code","email","employee_code","employment_type","position","hire_date_shamsi","end_date_shamsi","bank_name","bank_account","iban","national_id_verified","national_id_verified_at","notes","extra_data","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(3,'legal','3000000000',NULL,1,'گروه اصلی','اشخاص حقوقی',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,1,'2026-10-01 09:38:22',NULL,'2026-10-01 09:38:22',NULL);
INSERT INTO "persons" ("id","person_type","code","parent_id","level","level_name","full_name","national_id","economic_code","registration_number","father_name","id_number","birth_date_shamsi","phone","mobile","address","postal_code","email","employee_code","employment_type","position","hire_date_shamsi","end_date_shamsi","bank_name","bank_account","iban","national_id_verified","national_id_verified_at","notes","extra_data","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(4,'floating','4000000000',NULL,1,'گروه اصلی','تفصیلی شناور',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,1,'2026-10-01 09:38:22',NULL,'2026-10-01 09:38:22',NULL);
INSERT INTO "persons" ("id","person_type","code","parent_id","level","level_name","full_name","national_id","economic_code","registration_number","father_name","id_number","birth_date_shamsi","phone","mobile","address","postal_code","email","employee_code","employment_type","position","hire_date_shamsi","end_date_shamsi","bank_name","bank_account","iban","national_id_verified","national_id_verified_at","notes","extra_data","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(5,'employee','1001000000',1,2,'گروه فرعی','رسمی',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,1,'2026-10-01 09:38:22',NULL,'2026-10-01 09:38:22',NULL);
INSERT INTO "persons" ("id","person_type","code","parent_id","level","level_name","full_name","national_id","economic_code","registration_number","father_name","id_number","birth_date_shamsi","phone","mobile","address","postal_code","email","employee_code","employment_type","position","hire_date_shamsi","end_date_shamsi","bank_name","bank_account","iban","national_id_verified","national_id_verified_at","notes","extra_data","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(6,'employee','1002000000',1,2,'گروه فرعی','پیمانی',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,1,'2026-10-01 09:38:22',NULL,'2026-10-01 09:38:22',NULL);
INSERT INTO "persons" ("id","person_type","code","parent_id","level","level_name","full_name","national_id","economic_code","registration_number","father_name","id_number","birth_date_shamsi","phone","mobile","address","postal_code","email","employee_code","employment_type","position","hire_date_shamsi","end_date_shamsi","bank_name","bank_account","iban","national_id_verified","national_id_verified_at","notes","extra_data","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(7,'employee','1003000000',1,2,'گروه فرعی','قراردادی',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,1,'2026-10-01 09:38:22',NULL,'2026-10-01 09:38:22',NULL);
INSERT INTO "persons" ("id","person_type","code","parent_id","level","level_name","full_name","national_id","economic_code","registration_number","father_name","id_number","birth_date_shamsi","phone","mobile","address","postal_code","email","employee_code","employment_type","position","hire_date_shamsi","end_date_shamsi","bank_name","bank_account","iban","national_id_verified","national_id_verified_at","notes","extra_data","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(8,'employee','1004000000',1,2,'گروه فرعی','روزمزد',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,1,'2026-10-01 09:38:22',NULL,'2026-10-01 09:38:22',NULL);
INSERT INTO "persons" ("id","person_type","code","parent_id","level","level_name","full_name","national_id","economic_code","registration_number","father_name","id_number","birth_date_shamsi","phone","mobile","address","postal_code","email","employee_code","employment_type","position","hire_date_shamsi","end_date_shamsi","bank_name","bank_account","iban","national_id_verified","national_id_verified_at","notes","extra_data","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(9,'employee','1005000000',1,2,'گروه فرعی','سایر',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,1,'2026-10-01 09:38:22',NULL,'2026-10-01 09:38:22',NULL);
INSERT INTO "persons" ("id","person_type","code","parent_id","level","level_name","full_name","national_id","economic_code","registration_number","father_name","id_number","birth_date_shamsi","phone","mobile","address","postal_code","email","employee_code","employment_type","position","hire_date_shamsi","end_date_shamsi","bank_name","bank_account","iban","national_id_verified","national_id_verified_at","notes","extra_data","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(10,'natural','2001000000',2,2,'گروه فرعی','پیمانکاران',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,1,'2026-10-01 09:38:22',NULL,'2026-10-01 09:38:22',NULL);
INSERT INTO "persons" ("id","person_type","code","parent_id","level","level_name","full_name","national_id","economic_code","registration_number","father_name","id_number","birth_date_shamsi","phone","mobile","address","postal_code","email","employee_code","employment_type","position","hire_date_shamsi","end_date_shamsi","bank_name","bank_account","iban","national_id_verified","national_id_verified_at","notes","extra_data","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(11,'natural','2002000000',2,2,'گروه فرعی','مشاوران',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,1,'2026-10-01 09:38:22',NULL,'2026-10-01 09:38:22',NULL);
INSERT INTO "persons" ("id","person_type","code","parent_id","level","level_name","full_name","national_id","economic_code","registration_number","father_name","id_number","birth_date_shamsi","phone","mobile","address","postal_code","email","employee_code","employment_type","position","hire_date_shamsi","end_date_shamsi","bank_name","bank_account","iban","national_id_verified","national_id_verified_at","notes","extra_data","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(12,'natural','2003000000',2,2,'گروه فرعی','فروشندگان',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,1,'2026-10-01 09:38:22',NULL,'2026-10-01 09:38:22',NULL);
INSERT INTO "persons" ("id","person_type","code","parent_id","level","level_name","full_name","national_id","economic_code","registration_number","father_name","id_number","birth_date_shamsi","phone","mobile","address","postal_code","email","employee_code","employment_type","position","hire_date_shamsi","end_date_shamsi","bank_name","bank_account","iban","national_id_verified","national_id_verified_at","notes","extra_data","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(13,'natural','2004000000',2,2,'گروه فرعی','سایر',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,1,'2026-10-01 09:38:22',NULL,'2026-10-01 09:38:22',NULL);
INSERT INTO "persons" ("id","person_type","code","parent_id","level","level_name","full_name","national_id","economic_code","registration_number","father_name","id_number","birth_date_shamsi","phone","mobile","address","postal_code","email","employee_code","employment_type","position","hire_date_shamsi","end_date_shamsi","bank_name","bank_account","iban","national_id_verified","national_id_verified_at","notes","extra_data","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(14,'legal','3001000000',3,2,'گروه فرعی','شرکت‌های خصوصی',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,1,'2026-10-01 09:38:22',NULL,'2026-10-01 09:38:22',NULL);
INSERT INTO "persons" ("id","person_type","code","parent_id","level","level_name","full_name","national_id","economic_code","registration_number","father_name","id_number","birth_date_shamsi","phone","mobile","address","postal_code","email","employee_code","employment_type","position","hire_date_shamsi","end_date_shamsi","bank_name","bank_account","iban","national_id_verified","national_id_verified_at","notes","extra_data","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(15,'legal','3002000000',3,2,'گروه فرعی','سازمان‌های دولتی',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,1,'2026-10-01 09:38:22',NULL,'2026-10-01 09:38:22',NULL);
INSERT INTO "persons" ("id","person_type","code","parent_id","level","level_name","full_name","national_id","economic_code","registration_number","father_name","id_number","birth_date_shamsi","phone","mobile","address","postal_code","email","employee_code","employment_type","position","hire_date_shamsi","end_date_shamsi","bank_name","bank_account","iban","national_id_verified","national_id_verified_at","notes","extra_data","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(16,'legal','3003000000',3,2,'گروه فرعی','شهرداری‌ها',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,1,'2026-10-01 09:38:22',NULL,'2026-10-01 09:38:22',NULL);
INSERT INTO "persons" ("id","person_type","code","parent_id","level","level_name","full_name","national_id","economic_code","registration_number","father_name","id_number","birth_date_shamsi","phone","mobile","address","postal_code","email","employee_code","employment_type","position","hire_date_shamsi","end_date_shamsi","bank_name","bank_account","iban","national_id_verified","national_id_verified_at","notes","extra_data","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(17,'legal','3004000000',3,2,'گروه فرعی','سایر',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,1,'2026-10-01 09:38:22',NULL,'2026-10-01 09:38:22',NULL);
INSERT INTO "persons" ("id","person_type","code","parent_id","level","level_name","full_name","national_id","economic_code","registration_number","father_name","id_number","birth_date_shamsi","phone","mobile","address","postal_code","email","employee_code","employment_type","position","hire_date_shamsi","end_date_shamsi","bank_name","bank_account","iban","national_id_verified","national_id_verified_at","notes","extra_data","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(18,'floating','4001000000',4,2,'گروه فرعی','درآمدها',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,1,'2026-10-01 09:38:22',NULL,'2026-10-01 09:38:22',NULL);
INSERT INTO "persons" ("id","person_type","code","parent_id","level","level_name","full_name","national_id","economic_code","registration_number","father_name","id_number","birth_date_shamsi","phone","mobile","address","postal_code","email","employee_code","employment_type","position","hire_date_shamsi","end_date_shamsi","bank_name","bank_account","iban","national_id_verified","national_id_verified_at","notes","extra_data","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(19,'floating','4002000000',4,2,'گروه فرعی','هزینه‌ها',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,1,'2026-10-01 09:38:22',NULL,'2026-10-01 09:38:22',NULL);
INSERT INTO "persons" ("id","person_type","code","parent_id","level","level_name","full_name","national_id","economic_code","registration_number","father_name","id_number","birth_date_shamsi","phone","mobile","address","postal_code","email","employee_code","employment_type","position","hire_date_shamsi","end_date_shamsi","bank_name","bank_account","iban","national_id_verified","national_id_verified_at","notes","extra_data","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(20,'floating','4003000000',4,2,'گروه فرعی','سایر',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,1,'2026-10-01 09:38:22',NULL,'2026-10-01 09:38:22',NULL);
INSERT INTO "persons" ("id","person_type","code","parent_id","level","level_name","full_name","national_id","economic_code","registration_number","father_name","id_number","birth_date_shamsi","phone","mobile","address","postal_code","email","employee_code","employment_type","position","hire_date_shamsi","end_date_shamsi","bank_name","bank_account","iban","national_id_verified","national_id_verified_at","notes","extra_data","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(21,'employee','1003001000',7,3,NULL,'یک نفر',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,1,'2026-10-01 09:43:38','1405/07/09','2026-10-01 09:43:38','1405/07/09');
INSERT INTO "persons" ("id","person_type","code","parent_id","level","level_name","full_name","national_id","economic_code","registration_number","father_name","id_number","birth_date_shamsi","phone","mobile","address","postal_code","email","employee_code","employment_type","position","hire_date_shamsi","end_date_shamsi","bank_name","bank_account","iban","national_id_verified","national_id_verified_at","notes","extra_data","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(22,'natural','2005000000',2,2,NULL,'کارکنان شهرداری',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,1,'2026-10-02 16:24:31','1405/07/10','2026-10-02 16:24:31','1405/07/10');
INSERT INTO "persons" ("id","person_type","code","parent_id","level","level_name","full_name","national_id","economic_code","registration_number","father_name","id_number","birth_date_shamsi","phone","mobile","address","postal_code","email","employee_code","employment_type","position","hire_date_shamsi","end_date_shamsi","bank_name","bank_account","iban","national_id_verified","national_id_verified_at","notes","extra_data","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(24,'legal','3005000000',3,2,NULL,'پیمانکاران',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,1,'2026-10-02 16:25:57','1405/07/10','2026-10-02 16:25:57','1405/07/10');
INSERT INTO "persons" ("id","person_type","code","parent_id","level","level_name","full_name","national_id","economic_code","registration_number","father_name","id_number","birth_date_shamsi","phone","mobile","address","postal_code","email","employee_code","employment_type","position","hire_date_shamsi","end_date_shamsi","bank_name","bank_account","iban","national_id_verified","national_id_verified_at","notes","extra_data","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(25,'legal','3006000000',3,2,NULL,'مشاوران',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,1,'2026-10-02 16:26:10','1405/07/10','2026-10-02 16:26:10','1405/07/10');
INSERT INTO "persons" ("id","person_type","code","parent_id","level","level_name","full_name","national_id","economic_code","registration_number","father_name","id_number","birth_date_shamsi","phone","mobile","address","postal_code","email","employee_code","employment_type","position","hire_date_shamsi","end_date_shamsi","bank_name","bank_account","iban","national_id_verified","national_id_verified_at","notes","extra_data","is_active","created_at","created_at_shamsi","updated_at","updated_at_shamsi") VALUES(26,'legal','3007000000',3,2,NULL,'فروشندگان',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,1,'2026-10-02 16:26:21','1405/07/10','2026-10-02 16:26:21','1405/07/10');
CREATE TABLE person_organizations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  person_id INTEGER NOT NULL,
  organization_id INTEGER NOT NULL,    -- FK به base_data(section='organization')
  role TEXT,                            -- 'employee', 'manager', 'contractor', ...
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
  source_type TEXT NOT NULL,      -- 'person', 'base_data', 'budget_proposal', ...
  source_id INTEGER NOT NULL,
  target_type TEXT NOT NULL,
  target_id INTEGER NOT NULL,
  relation_type TEXT NOT NULL,    -- 'employee_of', 'contractor_for', 'owner_of', ...
  metadata TEXT,                  -- JSON برای اطلاعات اضافی
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at_shamsi TEXT
);
CREATE TABLE role_permissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role TEXT NOT NULL,
    permission_key TEXT NOT NULL,
    granted BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(role, permission_key)
);
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(1,'admin','base_info.view',1,'2026-10-03 14:00:12');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(2,'admin','base_info.edit',1,'2026-10-03 14:00:12');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(3,'admin','persons.view',1,'2026-10-03 14:00:12');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(4,'admin','persons.add',1,'2026-10-03 14:00:12');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(5,'admin','persons.edit',1,'2026-10-03 14:00:12');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(6,'admin','persons.delete',1,'2026-10-03 14:00:12');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(7,'admin','budget.view',1,'2026-10-03 14:00:12');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(8,'admin','budget.add',1,'2026-10-03 14:00:12');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(9,'admin','budget.submit',1,'2026-10-03 14:00:12');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(10,'admin','budget.approve_manager',1,'2026-10-03 14:00:12');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(11,'admin','budget.approve_finance',1,'2026-10-03 14:00:12');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(12,'admin','budget.approve_final',1,'2026-10-03 14:00:12');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(13,'admin','allocations.view',1,'2026-10-03 14:00:12');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(14,'admin','allocations.add',1,'2026-10-03 14:00:12');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(15,'admin','executions.view',1,'2026-10-03 14:00:12');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(16,'admin','executions.add',1,'2026-10-03 14:00:12');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(17,'admin','reports.view',1,'2026-10-03 14:00:12');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(18,'admin','reports.export',1,'2026-10-03 14:00:12');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(19,'admin','users.view',1,'2026-10-03 14:00:12');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(20,'admin','users.add',1,'2026-10-03 14:00:12');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(21,'admin','users.edit',1,'2026-10-03 14:00:12');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(22,'admin','users.delete',1,'2026-10-03 14:00:12');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(23,'admin','users.permissions',1,'2026-10-03 14:00:12');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(24,'admin','fiscal_years.view',1,'2026-10-03 14:00:12');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(25,'admin','fiscal_years.manage',1,'2026-10-03 14:00:12');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(26,'admin','audit_log.view',1,'2026-10-03 14:00:12');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(27,'admin','municipality_info.view',1,'2026-10-03 14:00:12');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(28,'admin','municipality_info.edit',1,'2026-10-03 14:00:12');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(29,'manager','base_info.view',1,'2026-10-03 14:00:12');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(30,'manager','base_info.edit',1,'2026-10-03 14:00:12');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(31,'manager','persons.view',1,'2026-10-03 14:00:12');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(32,'manager','persons.add',1,'2026-10-03 14:00:12');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(33,'manager','persons.edit',1,'2026-10-03 14:00:12');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(34,'manager','persons.delete',1,'2026-10-03 14:00:12');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(35,'manager','budget.view',1,'2026-10-03 14:00:12');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(36,'manager','budget.add',1,'2026-10-03 14:00:12');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(37,'manager','budget.submit',1,'2026-10-03 14:00:12');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(38,'manager','budget.approve_manager',1,'2026-10-03 14:00:12');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(39,'manager','budget.approve_finance',1,'2026-10-03 14:00:12');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(40,'manager','allocations.view',1,'2026-10-03 14:00:12');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(41,'manager','allocations.add',1,'2026-10-03 14:00:12');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(42,'manager','executions.view',1,'2026-10-03 14:00:12');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(43,'manager','executions.add',1,'2026-10-03 14:00:12');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(44,'manager','reports.view',1,'2026-10-03 14:00:12');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(45,'manager','reports.export',1,'2026-10-03 14:00:12');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(46,'manager','users.view',1,'2026-10-03 14:00:12');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(47,'manager','fiscal_years.view',1,'2026-10-03 14:00:12');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(48,'manager','fiscal_years.manage',1,'2026-10-03 14:00:12');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(49,'manager','audit_log.view',1,'2026-10-03 14:00:12');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(50,'manager','municipality_info.view',1,'2026-10-03 14:00:12');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(51,'expert','base_info.view',1,'2026-10-03 14:00:12');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(52,'expert','persons.view',1,'2026-10-03 14:00:12');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(53,'expert','budget.view',1,'2026-10-03 14:00:12');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(54,'expert','budget.add',1,'2026-10-03 14:00:12');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(55,'expert','budget.submit',1,'2026-10-03 14:00:12');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(56,'expert','executions.view',1,'2026-10-03 14:00:12');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(57,'expert','executions.add',1,'2026-10-03 14:00:12');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(58,'expert','reports.view',1,'2026-10-03 14:00:12');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(59,'expert','fiscal_years.view',1,'2026-10-03 14:00:12');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(60,'expert','municipality_info.view',1,'2026-10-03 14:00:12');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(61,'viewer','base_info.view',1,'2026-10-03 14:00:12');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(62,'viewer','persons.view',1,'2026-10-03 14:00:12');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(63,'viewer','budget.view',1,'2026-10-03 14:00:12');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(64,'viewer','reports.view',1,'2026-10-03 14:00:12');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(65,'viewer','fiscal_years.view',1,'2026-10-03 14:00:12');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(66,'viewer','municipality_info.view',1,'2026-10-03 14:00:12');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(67,'province','reports.view',1,'2026-10-03 14:00:12');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(68,'province','reports.export',1,'2026-10-03 14:00:12');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(69,'ministry','reports.view',1,'2026-10-03 14:00:12');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(70,'ministry','reports.export',1,'2026-10-03 14:00:12');
INSERT INTO "role_permissions" ("id","role","permission_key","granted","created_at") VALUES(71,'manager','municipality_info.edit',1,'2026-10-06 13:48:03');
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
INSERT INTO "user_permissions" ("id","user_id","permission_key","granted","granted_by","granted_at") VALUES(19,4,'users.view',0,2,'2026-10-03 14:11:08');
INSERT INTO "user_permissions" ("id","user_id","permission_key","granted","granted_by","granted_at") VALUES(20,4,'users.add',0,2,'2026-10-03 14:11:08');
INSERT INTO "user_permissions" ("id","user_id","permission_key","granted","granted_by","granted_at") VALUES(21,4,'users.edit',0,2,'2026-10-03 14:11:08');
INSERT INTO "user_permissions" ("id","user_id","permission_key","granted","granted_by","granted_at") VALUES(22,4,'users.delete',0,2,'2026-10-03 14:11:08');
INSERT INTO "user_permissions" ("id","user_id","permission_key","granted","granted_by","granted_at") VALUES(23,4,'users.permissions',0,2,'2026-10-03 14:11:08');
INSERT INTO "user_permissions" ("id","user_id","permission_key","granted","granted_by","granted_at") VALUES(96,6,'reports.view',1,2,'2026-10-03 15:00:45');
INSERT INTO "user_permissions" ("id","user_id","permission_key","granted","granted_by","granted_at") VALUES(97,6,'reports.advanced',1,2,'2026-10-03 15:00:45');
INSERT INTO "user_permissions" ("id","user_id","permission_key","granted","granted_by","granted_at") VALUES(98,6,'reports.tafriq',1,2,'2026-10-03 15:00:45');
INSERT INTO "user_permissions" ("id","user_id","permission_key","granted","granted_by","granted_at") VALUES(99,6,'reports.export',1,2,'2026-10-03 15:00:45');
INSERT INTO "user_permissions" ("id","user_id","permission_key","granted","granted_by","granted_at") VALUES(100,6,'users.view',0,2,'2026-10-03 15:00:45');
INSERT INTO "user_permissions" ("id","user_id","permission_key","granted","granted_by","granted_at") VALUES(101,6,'users.add',0,2,'2026-10-03 15:00:45');
INSERT INTO "user_permissions" ("id","user_id","permission_key","granted","granted_by","granted_at") VALUES(102,6,'users.edit',0,2,'2026-10-03 15:00:45');
INSERT INTO "user_permissions" ("id","user_id","permission_key","granted","granted_by","granted_at") VALUES(103,6,'users.delete',0,2,'2026-10-03 15:00:45');
INSERT INTO "user_permissions" ("id","user_id","permission_key","granted","granted_by","granted_at") VALUES(104,6,'users.permissions',0,2,'2026-10-03 15:00:45');
INSERT INTO "user_permissions" ("id","user_id","permission_key","granted","granted_by","granted_at") VALUES(105,2,'base_info.view',1,2,'2026-10-06 13:41:09');
INSERT INTO "user_permissions" ("id","user_id","permission_key","granted","granted_by","granted_at") VALUES(106,2,'base_info.edit',1,2,'2026-10-06 13:41:09');
DELETE FROM sqlite_sequence;
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('fiscal_years',5);
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('economic_classifications_old',4);
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('organizations_old',5);
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('approval_history_old',22);
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('budget_proposals_old',11);
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('budget_allocations_old',5);
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('budget_executions_old',8);
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('budget_revisions_old',12);
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('audit_log',113);
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('users',6);
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('base_data',139);
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('persons',26);
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('role_permissions',72);
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('user_permissions',106);
CREATE INDEX idx_logs_proposal ON "budget_approval_logs_old"(budget_proposal_id);
CREATE INDEX idx_resolutions_proposal ON "council_resolutions_old"(budget_proposal_id);
CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_date ON audit_log(created_at);
CREATE INDEX idx_base_data_section ON base_data(section, type);
CREATE INDEX idx_base_data_parent ON base_data(parent_id);
CREATE INDEX idx_base_data_fiscal ON base_data(fiscal_year_id);
CREATE INDEX idx_base_data_code ON base_data(code);
CREATE INDEX idx_base_data_created_shamsi ON base_data(created_at_shamsi);
CREATE INDEX idx_base_data_sort ON base_data(section, sort_order);
CREATE INDEX idx_budget_proposals_fiscal ON budget_proposals(fiscal_year_id);
CREATE INDEX idx_budget_proposals_org ON budget_proposals(organization_id);
CREATE INDEX idx_budget_proposals_econ ON budget_proposals(economic_class_id);
CREATE INDEX idx_budget_proposals_status ON budget_proposals(status);
CREATE INDEX idx_budget_allocations_budget ON budget_allocations(approved_budget_id);
CREATE INDEX idx_budget_allocations_org ON budget_allocations(organization_id);
CREATE INDEX idx_budget_executions_allocation ON budget_executions(allocation_id);
CREATE INDEX idx_approval_history_budget ON approval_history(budget_proposal_id);
CREATE INDEX idx_budget_revisions_fiscal ON budget_revisions(fiscal_year_id);
CREATE INDEX idx_budget_revisions_budget ON budget_revisions(budget_proposal_id);
CREATE INDEX idx_budget_approval_logs_proposal ON budget_approval_logs(budget_proposal_id);
CREATE INDEX idx_council_resolutions_proposal ON council_resolutions(budget_proposal_id);
CREATE UNIQUE INDEX idx_base_data_unique_code 
ON base_data(section, COALESCE(fiscal_year_id, 0), COALESCE(type, ''), code);
CREATE INDEX idx_persons_type ON persons(person_type);
CREATE INDEX idx_persons_code ON persons(code);
CREATE INDEX idx_persons_national_id ON persons(national_id);
CREATE INDEX idx_persons_parent ON persons(parent_id);
CREATE INDEX idx_persons_active ON persons(is_active);
CREATE INDEX idx_person_org_person ON person_organizations(person_id);
CREATE INDEX idx_person_org_org ON person_organizations(organization_id);
CREATE INDEX idx_entity_rel_source ON entity_relations(source_type, source_id);
CREATE INDEX idx_entity_rel_target ON entity_relations(target_type, target_id);
CREATE INDEX idx_entity_rel_type ON entity_relations(relation_type);
CREATE INDEX idx_role_permissions_role ON role_permissions(role);
CREATE INDEX idx_user_permissions_user ON user_permissions(user_id);
