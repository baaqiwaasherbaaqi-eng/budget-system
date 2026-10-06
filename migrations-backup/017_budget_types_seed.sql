-- ============================================
-- Migration 017: Seed نوع اعتبار و نوع مصرف
-- ============================================

-- پاک‌سازی (اگه قبلاً چیزی هست)
DELETE FROM base_data WHERE section='budget_type';

-- ============================================
-- نوع اعتبار (credit)
-- ============================================

INSERT INTO base_data (section, type, code, digit_count, level, level_name, title, parent_id, sort_order, created_at_shamsi)
VALUES ('budget_type', 'credit', '001', 3, 0, 'نوع', 'اعتبارات هزینه‌ای', NULL, 1, '1405/06/31');

INSERT INTO base_data (section, type, code, digit_count, level, level_name, title, parent_id, sort_order, created_at_shamsi)
VALUES ('budget_type', 'credit', '002', 3, 0, 'نوع', 'اعتبارات تملک دارایی سرمایه‌ای', NULL, 2, '1405/06/31');

INSERT INTO base_data (section, type, code, digit_count, level, level_name, title, parent_id, sort_order, created_at_shamsi)
VALUES ('budget_type', 'credit', '003', 3, 0, 'نوع', 'اعتبارات تملک دارایی مالی', NULL, 3, '1405/06/31');

-- ============================================
-- نوع مصرف (usage)
-- ============================================

INSERT INTO base_data (section, type, code, digit_count, level, level_name, title, parent_id, sort_order, created_at_shamsi)
VALUES ('budget_type', 'usage', '001', 3, 0, 'نوع', 'مصرف عمومی', NULL, 1, '1405/06/31');

INSERT INTO base_data (section, type, code, digit_count, level, level_name, title, parent_id, sort_order, created_at_shamsi)
VALUES ('budget_type', 'usage', '002', 3, 0, 'نوع', 'مصرف اختصاصی', NULL, 2, '1405/06/31');