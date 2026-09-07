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