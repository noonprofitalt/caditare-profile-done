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

    // 1. Fetch current profiles
    const result = await supabase.from('profiles').select('*');
    let profiles = result.data;
    const error = result.error;
    if (error || !profiles) {
        console.error('Error fetching profiles', error);
        return;
    }

    const accountSafanaCom = profiles.find(p => p.email === 'safana@suhara.com');
    let accountUsersCom = profiles.find(p => p.email === 'users@suhara.com');

    // 2. Re-create users@suhara.com if it doesn't exist
    if (!accountUsersCom) {
        console.log(`Re-creating users@suhara.com...`);
        const { data, error: createError } = await supabase.functions.invoke('create-user', {
            body: { email: 'users@suhara.com', password: '22', name: 'Safana', role: 'Recruiter', status: 'Active' }
        });
        if (createError) {
            let errMsg = createError.message;
            if (createError.context && typeof createError.context.json === 'function') {
                try {
                    const errBody = await createError.context.json();
                    if (errBody && errBody.error) errMsg = errBody.error;
                } catch (e) { /* ignore */ }
            }
            console.error('❌ Failed to create users@suhara.com:', errMsg);
            return;
        }
        console.log('✅ users@suhara.com created.');

        // Refetch to get the ID
        const { data: refreshedProfiles } = await supabase.from('profiles').select('*');
        if (refreshedProfiles) profiles = refreshedProfiles;
        accountUsersCom = profiles.find(p => p.email === 'users@suhara.com');
    }

    if (!accountUsersCom) {
        console.error('Could not find or create users@suhara.com. Aborting.');
        return;
    }

    // We want to transfer FROM safana@suhara.com TO users@suhara.com
    if (accountSafanaCom) {
        console.log(`Transferring workload FROM safana@suhara.com (ID: ${accountSafanaCom.id}) TO users@suhara.com (ID: ${accountUsersCom.id})...`);
        const { data: candidates, error: cErr } = await supabase.from('candidates').select('*');
        if (cErr) {
            console.error('❌ Failed to fetch candidates:', cErr);
            return;
        }

        let updatedCount = 0;
        for (const cand of candidates || []) {
            let changed = false;
            const cdata = cand.data || {};

            const replaceUser = (obj: any): any => {
                if (Array.isArray(obj)) {
                    return obj.map(item => replaceUser(item));
                } else if (obj !== null && typeof obj === 'object') {
                    const newObj: any = {};
                    for (const key in obj) {
                        if (key === 'userId' && obj[key] === accountSafanaCom!.id) {
                            newObj[key] = accountUsersCom!.id;
                            changed = true;
                        }
                        // Also make sure 'actor', 'author', etc name is "Safana" (might already be "Safana", but just to be sure)
                        else if (['actor', 'author', 'createdBy', 'resolvedBy', 'uploadedBy', 'user'].includes(key)) {
                            if (obj[key] === 'Safana') {
                                newObj[key] = 'Safana'; // already correct
                            } else {
                                newObj[key] = replaceUser(obj[key]);
                            }
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
        console.log(`✅ Updated ${updatedCount} candidates to transfer workload to users@suhara.com.`);

        // Delete safana@suhara.com
        console.log(`Deleting safana@suhara.com via edge function (ID: ${accountSafanaCom.id})...`);
        const { error: delErr } = await supabase.functions.invoke('delete-user', {
            body: { userId: accountSafanaCom.id }
        });

        if (delErr) {
            console.error('❌ Failed to delete safana@suhara.com:', delErr);
        } else {
            console.log('✅ safana@suhara.com deleted successfully.');
        }
    } else {
        console.log('⚠️ Original safana@suhara.com not found, skipped workload transfer.');
    }

    console.log('🎉 Fix complete! (Target user: users@suhara.com)');
}

main();
