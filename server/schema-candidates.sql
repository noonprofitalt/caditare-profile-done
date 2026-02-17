-- Create CANDIDATES table
CREATE TABLE IF NOT EXISTS public.candidates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  stage TEXT NOT NULL,
  stage_status TEXT NOT NULL,
  data JSONB, -- Stores the full candidate JSON object
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;

-- Policies
-- 1. Allow public insert (for testing/demo purposes, or restrictive based on auth)
-- For this "Quick Add" scenario without auth, we might need public insert.
-- WARNING: This allows anyone to insert. Adjust for production.
CREATE POLICY "Enable insert for all users" ON public.candidates FOR INSERT WITH CHECK (true);

-- 2. Allow public select (or restrict to auth users)
CREATE POLICY "Enable select for all users" ON public.candidates FOR SELECT USING (true);

-- 3. Allow public update
CREATE POLICY "Enable update for all users" ON public.candidates FOR UPDATE USING (true);
