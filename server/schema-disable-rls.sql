-- DISABLE RLS for Frictionless Access

ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidates DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_selections DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.employers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.demand_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs DISABLE ROW LEVEL SECURITY;

-- Optional: Drop existing policies if they interfere (though DISABLE RLS should be enough)
-- DROP POLICY IF EXISTS "policy_name" ON table_name;
