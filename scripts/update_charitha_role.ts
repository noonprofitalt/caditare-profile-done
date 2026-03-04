import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tvupusehfmbsdxhpbung.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2dXB1c2VoZm1ic2R4aHBidW5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1MjI1NTcsImV4cCI6MjA4NjA5ODU1N30.xCzmxUPEK_K97HKjNLA_eq121BupqVhcAznEStQ5rj4';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function main() {
    await supabase.auth.signInWithPassword({ email: 'admin@suhara.com', password: '3214' });

    const { data: profile } = await supabase.from('profiles').select('*').eq('email', 'userc@suhara.com').single();

    if (!profile) {
        console.log('❌ userc@suhara.com not found');
        return;
    }

    console.log(`Found: ${profile.id} | ${profile.full_name} | ${profile.role}`);

    const { error } = await supabase.from('profiles').update({
        full_name: 'Charitha',
        role: 'HR',
        status: 'Active'
    }).eq('id', profile.id);

    if (error) {
        console.error('❌ Update failed:', error);
    } else {
        console.log('✅ Charitha updated to HR role.');
    }
}
main();
