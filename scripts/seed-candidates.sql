-- SQL Seed Script for 5 Test Candidates
-- Run this in your Supabase SQL Editor

INSERT INTO public.candidates (id, candidate_code, name, email, phone, stage, stage_status, data)
VALUES 
(
  '00000000-0000-4000-a000-100000000001', 
  'GW-2026-1001', 
  'Chamara Wickramasinghe', 
  'chamara.w@example.com', 
  '0771234567', 
  'Registered', 
  'Pending', 
  '{"id": "00000000-0000-4000-a000-100000000001", "name": "Chamara Wickramasinghe", "candidateCode": "GW-2026-1001", "phone": "0771234567", "stage": "Registered", "stageStatus": "Pending"}'::jsonb
),
(
  '00000000-0000-4000-a000-100000000002', 
  'GW-2026-1002', 
  'Dilini Rajapaksa', 
  'dilini.r@example.com', 
  '0777654321', 
  'Registered', 
  'Pending', 
  '{"id": "00000000-0000-4000-a000-100000000002", "name": "Dilini Rajapaksa", "candidateCode": "GW-2026-1002", "phone": "0777654321", "stage": "Registered", "stageStatus": "Pending"}'::jsonb
),
(
  '00000000-0000-4000-a000-100000000003', 
  'GW-2026-1003', 
  'Nuwan Bandara', 
  'nuwan.b@example.com', 
  '0712345678', 
  'Verified', 
  'In Progress', 
  '{"id": "00000000-0000-4000-a000-100000000003", "name": "Nuwan Bandara", "candidateCode": "GW-2026-1003", "phone": "0712345678", "stage": "Verified", "stageStatus": "In Progress"}'::jsonb
),
(
  '00000000-0000-4000-a000-100000000004', 
  'GW-2026-1004', 
  'Nimali Kumara', 
  'nimali.k@example.com', 
  '0756789123', 
  'Applied', 
  'Pending', 
  '{"id": "00000000-0000-4000-a000-100000000004", "name": "Nimali Kumara", "candidateCode": "GW-2026-1004", "phone": "0756789123", "stage": "Applied", "stageStatus": "Pending"}'::jsonb
),
(
  '00000000-0000-4000-a000-100000000005', 
  'GW-2026-1005', 
  'Sunil Perera', 
  'sunil.p@example.com', 
  '0789012345', 
  'Registered', 
  'Pending', 
  '{"id": "00000000-0000-4000-a000-100000000005", "name": "Sunil Perera", "candidateCode": "GW-2026-1005", "phone": "0789012345", "stage": "Registered", "stageStatus": "Pending"}'::jsonb
);
