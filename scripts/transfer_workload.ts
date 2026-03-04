import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tvupusehfmbsdxhpbung.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2dXB1c2VoZm1ic2R4aHBidW5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1MjI1NTcsImV4cCI6MjA4NjA5ODU1N30.xCzmxUPEK_K97HKjNLA_eq121BupqVhcAznEStQ5rj4';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function main() {
    console.log('🚀 Starting workload transfer from User F to Safana...');

    // 1. Log in as Admin
    console.log('Logging in as Admin...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: 'admin@suhara.com',
        password: '3214'
    });

    if (authError || !authData.session) {
        console.error('❌ Admin login failed:', authError);
        return;
    }
    console.log('✅ Admin logged in successfully.');

    // 2. Find Safana, create her if she doesn't exist
    let safanaId = '';
    const { data: safanaProfile } = await supabase.from('profiles').select('id, name').eq('name', 'Safana').single();

    if (safanaProfile) {
        console.log('✅ Safana already exists:', safanaProfile.id);
        safanaId = safanaProfile.id;
    } else {
        console.log('Creating Safana...');
        const { data, error } = await supabase.functions.invoke('create-user', {
            body: {
                email: 'safana@suhara.com',
                password: '22',
                name: 'Safana',
                role: 'Viewer',
                status: 'Active'
            }
        });
        if (error) {
            console.log('❌ Failed to create Safana:', error.message || error);
            // could be that the account exists in auth mapping but no profile
        } else {
            safanaId = data?.user?.id;
            console.log('✅ Safana created:', safanaId);
        }

        // ensure profile lookup
        if (!safanaId) {
            const { data: refetchp } = await supabase.from('profiles').select('id, name').eq('name', 'Safana').single();
            if (refetchp) safanaId = refetchp.id;
        }
    }

    // 3. Find User F
    const { data: userFProfile } = await supabase.from('profiles').select('id, name').eq('name', 'User F').single();
    if (!userFProfile) {
        console.log('⚠️ User F profile not found, proceeding with candidate names replacements only');
    } else {
        console.log('✅ Found User F:', userFProfile.id);
    }

    // 4. Fetch all candidates
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
                    // Replacements based on fields: actor, author, createdBy, resolvedBy, uploadedBy, user
                    if (['actor', 'author', 'createdBy', 'resolvedBy', 'uploadedBy', 'user'].includes(key) && obj[key] === 'User F') {
                        newObj[key] = 'Safana';
                        changed = true;
                    }
                    // userIds: 'userId'
                    else if (key === 'userId' && userFProfile && obj[key] === userFProfile.id && safanaId) {
                        newObj[key] = safanaId;
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

    console.log(`✅ Updated ${updatedCount} candidates to transfer workload.`);

    // 5. Delete User F
    if (userFProfile) {
        console.log(`Deleting User F via edge function (ID: ${userFProfile.id})...`);
        const { error: delErr } = await supabase.functions.invoke('delete-user', {
            body: { userId: userFProfile.id }
        });

        // We probably also need to pass the JWT of admin in headers, but edge functions client does this automatically.
        if (delErr) {
            console.error('❌ Failed to delete User F:', delErr);
        } else {
            console.log('✅ User F deleted successfully.');
        }
    } else {
        console.log('⚠️ User F not found in DB profile, skipping deletion.');
    }

    console.log('🎉 Transfer and cleanup complete!');
}

main();
