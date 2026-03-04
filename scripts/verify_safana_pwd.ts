import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    'https://tvupusehfmbsdxhpbung.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2dXB1c2VoZm1ic2R4aHBidW5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1MjI1NTcsImV4cCI6MjA4NjA5ODU1N30.xCzmxUPEK_K97HKjNLA_eq121BupqVhcAznEStQ5rj4'
);

async function main() {
    console.log('Testing Safana login with new password...');
    const { data, error } = await supabase.auth.signInWithPassword({
        email: 'users@suhara.com',
        password: '199968S'
    });

    if (error) {
        console.error('❌ LOGIN FAILED:', error.message);
    } else {
        console.log('✅ Login succeeded!');
        console.log('   User:', data.user?.email);
        console.log('   Session:', data.session ? 'Valid' : 'MISSING');
    }
}
main();
