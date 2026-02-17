import { createClient } from '@supabase/supabase-js';
import { generateQuickAddCandidate, generatePartialCandidate, generateCompleteCandidate } from './generateTestData';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// Manual loading of .env.local because tsx doesn't handle import.meta.env automatically for Node scripts
const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars: Record<string, string> = {};

envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        envVars[key.trim()] = value.trim();
    }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseAnonKey = envVars.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase environment variables in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function populate() {
    console.log('🌱 Starting Supabase test data population...\n');

    // 1. Log in as Admin
    console.log('Authenticating as Admin (admin@suhara.com)...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: 'admin@suhara.com',
        password: '3214'
    });

    if (authError || !authData.session) {
        console.error('❌ Authentication failed:', authError?.message);
        console.log('⚠️ Attempting anonymously (likely to fail due to RLS)...');
    } else {
        console.log('✅ Authenticated successfully as:', authData.user.email);
    }

    const candidates = [
        ...Array(5).fill(0).map((_, i) => generateQuickAddCandidate(101 + i)),
        ...Array(5).fill(0).map((_, i) => generatePartialCandidate(106 + i)),
        ...Array(5).fill(0).map((_, i) => generateCompleteCandidate(111 + i))
    ].map((c, i) => ({
        ...c,
        id: crypto.randomUUID(),
        candidateCode: c.candidateCode || `GW-2026-${1000 + i}`,
        stage: c.stage || 'Registered',
        stageStatus: c.stageStatus || 'Pending'
    }));

    console.log(`Generated ${candidates.length} candidates. Inserting into Supabase...`);

    for (const candidate of candidates) {
        process.stdout.write(`Inserting ${candidate.name}... `);

        const row = {
            id: candidate.id,
            candidate_code: candidate.candidateCode,
            name: candidate.name,
            email: candidate.email || null,
            phone: candidate.phone,
            stage: candidate.stage,
            stage_status: candidate.stageStatus,
            data: candidate, // Store full object in JSONB
            updated_at: new Date().toISOString()
        };

        const { error } = await supabase
            .from('candidates')
            .upsert(row);

        if (error) {
            console.log('❌ Error');
            console.error(error);
        } else {
            console.log('✅ Success');
        }
    }

    console.log('\n✨ Population complete!');
}

populate().catch(err => {
    console.error('❌ Population failed:', err);
});
