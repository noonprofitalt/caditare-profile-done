
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
    console.log('--- Verifying Admin Status ---');
    console.log('Connecting to:', supabaseUrl);

    // 1. Login
    console.log('Logging in as admin@suhara.com...');
    const { data: { user }, error: loginError } = await supabase.auth.signInWithPassword({
        email: 'admin@suhara.com',
        password: '3214'
    });

    if (loginError || !user) {
        console.error('❌ Login failed:', loginError);
        return;
    }
    console.log('✅ Logged in. User ID:', user.id);

    // 2. Check Own Profile
    console.log('Fetching own profile...');
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (profileError) {
        console.error('❌ Failed to fetch own profile:', profileError);
        console.log('Possible causes: RLS blocking "select own", or row does not exist.');
    } else {
        console.log('✅ Own profile found:', profile);
    }

    // 3. Check All Profiles (Test RLS for Admin)
    console.log('Fetching all profiles...');
    const { data: allProfiles, error: listError } = await supabase
        .from('profiles')
        .select('*')
        .limit(5);

    if (listError) {
        console.error('❌ Failed to fetch list:', listError);
    } else {
        console.log(`✅ Fetched ${allProfiles?.length} profiles.`);
        if (allProfiles?.length === 0) {
            console.log('⚠️ List is empty. RLS might be hiding everything.');
        } else {
            console.table(allProfiles?.map(p => ({ email: p.email, role: p.role })));
        }
    }
}

main();
