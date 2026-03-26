-- ==============================================================================
-- SUPABASE RLS (ROW LEVEL SECURITY) SETUP SCRIPT
-- ==============================================================================
-- This script enables Row Level Security on all your public tables to prevent
-- unauthorized anonymous access to your data, resolving the Supabase security
-- vulnerability warning: "rls_disabled_in_public".
--
-- INSTRUCTIONS:
-- 1. Copy this entire script.
-- 2. Log in to your Supabase Dashboard: https://supabase.com/dashboard/
-- 3. Select your project.
-- 4. Go to the "SQL Editor" on the left sidebar.
-- 5. Click "New Query" and paste this script.
-- 6. Click "Run" or press CMD+Enter / CTRL+Enter.
-- ==============================================================================

-- 1. Enable RLS on all existing public tables
-- Note: Replace with actual table names if you have custom ones not listed here.
ALTER TABLE IF EXISTS public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.employers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.demand_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.finance_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.finance_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.chat_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.chat_messages ENABLE ROW LEVEL SECURITY;

-- 2. Create permissive policies for AUTHENTICATED users
-- This ensures that anyone logged into your ERP system can read/write data,
-- while completely blocking anonymous (unauthenticated) traffic from accessing it.

-- Candidates
DO $$ BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'candidates') THEN
        DROP POLICY IF EXISTS "Allow authenticated full access to candidates" ON public.candidates;
        CREATE POLICY "Allow authenticated full access to candidates" ON public.candidates FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;
END $$;

-- Jobs
DO $$ BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'jobs') THEN
        DROP POLICY IF EXISTS "Allow authenticated full access to jobs" ON public.jobs;
        CREATE POLICY "Allow authenticated full access to jobs" ON public.jobs FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;
END $$;

-- Employers
DO $$ BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'employers') THEN
        DROP POLICY IF EXISTS "Allow authenticated full access to employers" ON public.employers;
        CREATE POLICY "Allow authenticated full access to employers" ON public.employers FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;
END $$;

-- Orders
DO $$ BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'orders') THEN
        DROP POLICY IF EXISTS "Allow authenticated full access to orders" ON public.orders;
        CREATE POLICY "Allow authenticated full access to orders" ON public.orders FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;
END $$;

-- Demand Orders (if named this way)
DO $$ BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'demand_orders') THEN
        DROP POLICY IF EXISTS "Allow authenticated full access to demand_orders" ON public.demand_orders;
        CREATE POLICY "Allow authenticated full access to demand_orders" ON public.demand_orders FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;
END $$;

-- Finance Transactions
DO $$ BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'finance_transactions') THEN
        DROP POLICY IF EXISTS "Allow authenticated full access to finance_transactions" ON public.finance_transactions;
        CREATE POLICY "Allow authenticated full access to finance_transactions" ON public.finance_transactions FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;
END $$;

-- Invoices
DO $$ BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'invoices') THEN
        DROP POLICY IF EXISTS "Allow authenticated full access to invoices" ON public.invoices;
        CREATE POLICY "Allow authenticated full access to invoices" ON public.invoices FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;
END $$;

-- Finance Invoices (if named this way)
DO $$ BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'finance_invoices') THEN
        DROP POLICY IF EXISTS "Allow authenticated full access to finance_invoices" ON public.finance_invoices;
        CREATE POLICY "Allow authenticated full access to finance_invoices" ON public.finance_invoices FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;
END $$;

-- Audit Logs
DO $$ BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'audit_logs') THEN
        DROP POLICY IF EXISTS "Allow authenticated full access to audit_logs" ON public.audit_logs;
        CREATE POLICY "Allow authenticated full access to audit_logs" ON public.audit_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;
END $$;

-- Profiles
DO $$ BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
        DROP POLICY IF EXISTS "Allow authenticated full access to profiles" ON public.profiles;
        CREATE POLICY "Allow authenticated full access to profiles" ON public.profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;
END $$;

-- Chat Channels
DO $$ BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'chat_channels') THEN
        DROP POLICY IF EXISTS "Allow authenticated full access to chat_channels" ON public.chat_channels;
        CREATE POLICY "Allow authenticated full access to chat_channels" ON public.chat_channels FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;
END $$;

-- Chat Messages
DO $$ BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'chat_messages') THEN
        DROP POLICY IF EXISTS "Allow authenticated full access to chat_messages" ON public.chat_messages;
        CREATE POLICY "Allow authenticated full access to chat_messages" ON public.chat_messages FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;
END $$;

-- ==============================================================================
-- 3. Dynamic setup for ANY table not explicitly named above.
-- This block dynamically creates an authenticated policy for EVERY table in public
-- ==============================================================================
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        -- Enable RLS
        EXECUTE 'ALTER TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' ENABLE ROW LEVEL SECURITY;';
        
        -- Drop any previous 'all_authenticated' policy to avoid duplicates
        EXECUTE 'DROP POLICY IF EXISTS "Allow authenticated access generically" ON public.' || quote_ident(r.tablename) || ';';
        
        -- Create a generic permissive policy for authenticated users
        EXECUTE 'CREATE POLICY "Allow authenticated access generically" ON public.' || quote_ident(r.tablename) || 
                ' FOR ALL TO authenticated USING (true) WITH CHECK (true);';
    END LOOP;
END $$;

-- ==============================================================================
-- DONE. Once you run this script, the Supabase Vulnerability will be resolved.
-- ==============================================================================
