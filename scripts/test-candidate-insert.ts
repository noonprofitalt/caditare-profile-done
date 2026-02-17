import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Manual loading of .env.local
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

async function testSupabase() {
    console.log('🧪 Testing Supabase Connection & Permissions...\n');

    // 1. Test Select
    console.log('1. Testing SELECT from candidates table...');
    const selectResult = await supabase.from('candidates').select('*').limit(1);

    if (selectResult.error) {
        console.error('❌ SELECT Failed:', selectResult.error.message);
    } else {
        console.log('✅ SELECT Success. Rows found:', selectResult.data.length);
    }

    // 2. Test Insert
    console.log('\n2. Testing INSERT into candidates table...');
    const testCandidate = {
        id: crypto.randomUUID(),
        candidate_code: `TEST-${Date.now()}`,
        name: 'Test Candidate',
        stage: 'Registered',
        stage_status: 'Pending',
        data: { test: true },
        updated_at: new Date().toISOString()
    };

    const insertResult = await supabase
        .from('candidates')
        .insert(testCandidate)
        .select()
        .single();

    if (insertResult.error) {
        console.error('❌ INSERT Failed:', insertResult.error.message);
        console.error('   Code:', insertResult.error.code);
        console.error('   Details:', insertResult.error.details);
        console.error('   Hint:', insertResult.error.hint);
    } else {
        console.log('✅ INSERT Success. Created candidate:', insertResult.data.id);

        // Cleanup if success
        console.log('\n3. Cleaning up test candidate...');
        const deleteResult = await supabase
            .from('candidates')
            .delete()
            .eq('id', insertResult.data.id);

        if (deleteResult.error) {
            console.error('❌ DELETE Failed:', deleteResult.error.message);
        } else {
            console.log('✅ DELETE Success');
        }
    }
}

testSupabase().catch(console.error);
