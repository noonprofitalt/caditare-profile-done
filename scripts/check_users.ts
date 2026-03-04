import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tvupusehfmbsdxhpbung.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2dXB1c2VoZm1ic2R4aHBidW5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1MjI1NTcsImV4cCI6MjA4NjA5ODU1N30.xCzmxUPEK_K97HKjNLA_eq121BupqVhcAznEStQ5rj4';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function main() {
    console.log('Logging in as Admin...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: 'admin@suhara.com',
        password: '3214'
    });

    if (authError || !authData.session) {
        console.error('❌ Admin login failed:', authError);
        return;
    }
    console.log('✅ Admin logged in.');

    const { data: profiles, error } = await supabase.from('profiles').select('*');
    if (error) {
        console.error('Error fetching profiles', error);
        return;
    }

    console.log('Profiles currently in DB:');
    profiles.forEach(p => console.log(`- ${p.id} | ${p.name} | ${p.email}`));

    const userF = profiles.find(p => p.name === 'User F' || p.email === 'userF@suhara.com' || p.email === 'userf@suhara.com');
    if (userF) {
        console.log(`Found User F id: ${userF.id}. Deleting...`);
        const { error: delErr } = await supabase.functions.invoke('delete-user', {
            body: { userId: userF.id }
        });
        if (delErr) {
            console.error('Failed to delete User F:', delErr);
        } else {
            console.log('✅ User F deleted via edge function.');
        }
    } else {
        console.log('User F not found in profiles.');
    }
}
main();
