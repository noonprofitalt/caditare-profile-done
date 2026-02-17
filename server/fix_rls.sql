-- RLS FIX SCRIPT
-- RUN THIS IN SUPABASE SQL EDITOR

-- 1. Create the table if it doesn't exist (Safety check)
CREATE TABLE IF NOT EXISTS public.candidates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  stage TEXT NOT NULL,
  stage_status TEXT NOT NULL,
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Enable insert for all users" ON public.candidates;
DROP POLICY IF EXISTS "Enable select for all users" ON public.candidates;
DROP POLICY IF EXISTS "Enable update for all users" ON public.candidates;

-- 4. Create new permissive policies for the app
-- Allow anyone (including the Quick Add form) to insert candidates
CREATE POLICY "Enable insert for all users" 
ON public.candidates 
FOR INSERT 
WITH CHECK (true);

-- Allow anyone to view candidates
CREATE POLICY "Enable select for all users" 
ON public.candidates 
FOR SELECT 
USING (true);

-- Allow updates
CREATE POLICY "Enable update for all users" 
ON public.candidates 
FOR UPDATE 
USING (true);

-- 5. Confirm success
SELECT 'RLS Policies Updated Successfully' as status;
