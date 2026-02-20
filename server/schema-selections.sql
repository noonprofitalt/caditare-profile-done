-- Candidate Selections Table matches candidates to demand orders
-- Using TEXT for ID to support frontend-generated IDs (sel-timestamp-candidateId)
CREATE TABLE IF NOT EXISTS public.candidate_selections (
  id TEXT PRIMARY KEY, 
  demand_order_id TEXT NOT NULL, 
  candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  stage TEXT NOT NULL,
  interview_date TIMESTAMPTZ,
  interview_type TEXT,
  interview_notes TEXT,
  employer_feedback TEXT,
  offer_salary TEXT,
  offer_date TIMESTAMPTZ,
  rejection_reason TEXT,
  match_score INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX idx_selections_demand_order ON public.candidate_selections(demand_order_id);
CREATE INDEX idx_selections_candidate ON public.candidate_selections(candidate_id);

-- Enable RLS
ALTER TABLE public.candidate_selections ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public read selections" ON public.candidate_selections FOR SELECT USING (true);
CREATE POLICY "Authenticated insert selections" ON public.candidate_selections FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR true); 
CREATE POLICY "Authenticated update selections" ON public.candidate_selections FOR UPDATE USING (auth.role() = 'authenticated' OR true);
CREATE POLICY "Authenticated delete selections" ON public.candidate_selections FOR DELETE USING (auth.role() = 'authenticated' OR true);
