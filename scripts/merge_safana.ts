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

    const accountUsers = profiles.find(p => p.email === 'users@suhara.com');
    const accountSafana = profiles.find(p => p.email === 'safana@suhara.com');

    if (!accountUsers || !accountSafana) {
        console.error('Could not find both accounts to merge.');
        return;
    }

    console.log(`Found users@suhara.com (ID: ${accountUsers.id}), Role: ${accountUsers.role}`);
    console.log(`Found safana@suhara.com (ID: ${accountSafana.id}), Role: ${accountSafana.role}`);

    console.log(`Merging into safana@suhara.com...`);

    // 1. Update safana@suhara.com to take Recruiter role if users@suhara.com had it
    if (accountUsers.role === 'Recruiter') {
        await supabase.from('profiles').update({ role: 'Recruiter' }).eq('id', accountSafana.id);
        console.log(`✅ Updated safana@suhara.com role to Recruiter`);
    }

    // 2. Fetch all candidates to transfer workload from accountUsers.id to accountSafana.id
    const { data: candidates, error: cErr } = await supabase.from('candidates').select('*');
    if (cErr) {
        console.error('❌ Failed to fetch candidates:', cErr);
        return;
    }

    let updatedCount = 0;

    for (const cand of candidates || []) {
        let changed = false;
        const cdata = cand.data || {};

        // Deep string replacement function specific to our fields
        const replaceUser = (obj: any): any => {
            if (Array.isArray(obj)) {
                return obj.map(item => replaceUser(item));
            } else if (obj !== null && typeof obj === 'object') {
                const newObj: any = {};
                for (const key in obj) {
                    // userIds: 'userId'
                    if (key === 'userId' && obj[key] === accountUsers.id) {
                        newObj[key] = accountSafana.id;
                        changed = true;
                    }
                    else {
                        newObj[key] = replaceUser(obj[key]);
                    }
                }
                return newObj;
            }
            return obj;
        };

        const newData = replaceUser(cdata);

        // Also update any flat values if they exist
        if (changed) {
            const { error: updateErr } = await supabase
                .from('candidates')
                .update({ data: newData })
                .eq('id', cand.id);

            if (updateErr) {
                console.error(`❌ Failed to update candidate ${cand.id}:`, updateErr);
            } else {
                updatedCount++;
            }
        }
    }

    console.log(`✅ Updated ${updatedCount} candidates to transfer workload from users@suhara.com to safana@suhara.com.`);

    // 3. Delete users@suhara.com
    console.log(`Deleting users@suhara.com via edge function (ID: ${accountUsers.id})...`);
    const { error: delErr } = await supabase.functions.invoke('delete-user', {
        body: { userId: accountUsers.id }
    });

    if (delErr) {
        console.error('❌ Failed to delete users@suhara.com:', delErr);
    } else {
        console.log('✅ users@suhara.com deleted successfully.');
    }

    console.log('🎉 Merge complete!');
}
main();
