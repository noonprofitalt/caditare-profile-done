-- Finance Module Schema

-- TABLE: finance_transactions
CREATE TABLE IF NOT EXISTS finance_transactions (
    id TEXT PRIMARY KEY,
    candidate_id UUID REFERENCES candidates(id),
    employer_id UUID REFERENCES employers(id),
    type TEXT NOT NULL, -- 'Revenue', 'Expense'
    category TEXT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'Completed',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    description TEXT,
    reference_id TEXT, -- Optional link to Invoice ID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLE: invoices
CREATE TABLE IF NOT EXISTS invoices (
    id TEXT PRIMARY KEY,
    employer_id UUID REFERENCES employers(id),
    candidate_id UUID REFERENCES candidates(id),
    amount DECIMAL(10, 2) NOT NULL,
    issued_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    due_date TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL DEFAULT 'Draft', -- 'Draft', 'Sent', 'Paid', 'Overdue', 'Cancelled'
    billing_address TEXT,
    items JSONB DEFAULT '[]'::jsonb, -- Array of { description, amount }
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS POLICIES (Enable for all authenticated users for now)
ALTER TABLE finance_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for authenticated users" ON finance_transactions
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all access for authenticated users" ON invoices
    FOR ALL USING (true) WITH CHECK (true);

-- REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE finance_transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE invoices;
