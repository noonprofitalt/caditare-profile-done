import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tvupusehfmbsdxhpbung.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2dXB1c2VoZm1ic2R4aHBidW5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1MjI1NTcsImV4cCI6MjA4NjA5ODU1N30.xCzmxUPEK_K97HKjNLA_eq121BupqVhcAznEStQ5rj4';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function main() {
    console.log('=== DEEP DIAGNOSIS FOR SAFANA (users@suhara.com) ===\n');

    // 1. Test login
    console.log('1. Testing login...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: 'users@suhara.com',
        password: '22'
    });

    if (authError) {
        console.error('   ❌ LOGIN FAILED:', authError.message);
        console.error('   Status:', authError.status);
        console.log('\n   This is the root cause - she CANNOT authenticate.');
    } else {
        console.log('   ✅ Login succeeded.');
        console.log('   User ID:', authData.user?.id);
        console.log('   Session:', authData.session ? 'Valid' : 'MISSING');
    }

    // 2. Test profile fetch
    console.log('\n2. Testing profile fetch...');
    const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', 'users@suhara.com')
        .single();

    if (profileErr) {
        console.error('   ❌ PROFILE FETCH FAILED:', profileErr.message, profileErr.code);
    } else {
        console.log('   ✅ Profile found:', profile?.full_name, '|', profile?.role, '|', profile?.status);
    }

    // 3. Test candidates access
    console.log('\n3. Testing candidates table access...');
    const { data: candidates, error: candErr } = await supabase
        .from('candidates')
        .select('id, name')
        .limit(3);

    if (candErr) {
        console.error('   ❌ CANDIDATES FETCH FAILED:', candErr.message, candErr.code);
    } else {
        console.log('   ✅ Can read candidates. Count:', candidates?.length);
    }

    // 4. Test storage/upload access
    console.log('\n4. Testing storage access...');
    const testContent = new Blob(['test'], { type: 'text/plain' });
    const { data: uploadData, error: uploadErr } = await supabase.storage
        .from('documents')
        .upload('_test/safana_test.txt', testContent, { upsert: true });

    if (uploadErr) {
        console.error('   ❌ STORAGE UPLOAD FAILED:', uploadErr.message);
    } else {
        console.log('   ✅ Upload succeeded:', uploadData?.path);
        // Cleanup
        await supabase.storage.from('documents').remove(['_test/safana_test.txt']);
        console.log('   🧹 Test file cleaned up.');
    }

    // 5. Test candidates update access
    console.log('\n5. Testing candidates update...');
    if (candidates && candidates.length > 0) {
        const testCand = candidates[0];
        const { error: updateErr } = await supabase
            .from('candidates')
            .update({ notes: testCand.notes })
            .eq('id', testCand.id);

        if (updateErr) {
            console.error('   ❌ UPDATE FAILED:', updateErr.message, updateErr.code);
        } else {
            console.log('   ✅ Can update candidates.');
        }
    }

    console.log('\n=== DIAGNOSIS COMPLETE ===');
}
main();
