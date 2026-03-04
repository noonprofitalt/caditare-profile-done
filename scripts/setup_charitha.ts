import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tvupusehfmbsdxhpbung.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2dXB1c2VoZm1ic2R4aHBidW5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1MjI1NTcsImV4cCI6MjA4NjA5ODU1N30.xCzmxUPEK_K97HKjNLA_eq121BupqVhcAznEStQ5rj4';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function main() {
    console.log('🚀 Setting up Charitha (HR & Operations Manager)...\n');

    // 1. Login as Admin
    console.log('Logging in as Admin...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: 'admin@suhara.com',
        password: '3214'
    });

    if (authError || !authData.session) {
        console.error('❌ Admin login failed:', authError);
        return;
    }
    console.log('✅ Admin logged in.\n');

    // 2. Check if userc@suhara.com already exists 
    const { data: profiles } = await supabase.from('profiles').select('*');
    if (!profiles) return;
    const existing = profiles.find(p => p.email === 'userc@suhara.com');

    if (existing) {
        console.log(`Found existing userc@suhara.com (ID: ${existing.id}, Name: ${existing.name || existing.full_name || 'User C'})`);

        // Update the profile to Charitha with Manager role
        const { error: updateErr } = await supabase
            .from('profiles')
            .update({
                full_name: 'Charitha',
                role: 'Manager',
                status: 'Active'
            })
            .eq('id', existing.id);

        if (updateErr) {
            console.error('❌ Failed to update profile:', updateErr);
        } else {
            console.log('✅ Profile updated: Name → Charitha, Role → Manager');
        }

        // Update the password via edge function won't work (no admin.updateUserById via edge fn)
        // So we'll note that the password needs an admin update
        console.log('\n⚠️  Note: Password change for existing auth user requires service role.');
        console.log('   The user can reset via forgot password, or we can update via Supabase dashboard.');
    } else {
        console.log('userc@suhara.com not found in profiles. Creating fresh...');

        // Create via edge function
        const { data, error: createError } = await supabase.functions.invoke('create-user', {
            body: {
                email: 'userc@suhara.com',
                password: '#HrSuhara2024',
                name: 'Charitha',
                role: 'Manager',
                status: 'Active'
            }
        });

        if (createError) {
            let errMsg = createError.message;
            if (createError.context && typeof createError.context.json === 'function') {
                try {
                    const errBody = await createError.context.json();
                    if (errBody?.error) errMsg = errBody.error;
                } catch (e) { /* ignore */ }
            }
            console.error('❌ Failed to create user:', errMsg);
            return;
        }

        if (data?.error) {
            console.error('❌ Edge function error:', data.error);
            return;
        }

        console.log('✅ Charitha created successfully!');
        console.log(`   ID: ${data?.user?.id || 'created'}`);
    }

    // 3. Transfer any candidate workload from "User C" to "Charitha"
    console.log('\nTransferring workload from "User C" to "Charitha"...');
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
                    if (['actor', 'author', 'createdBy', 'resolvedBy', 'uploadedBy', 'user'].includes(key) && obj[key] === 'User C') {
                        newObj[key] = 'Charitha';
                        changed = true;
                    } else {
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

    console.log(`✅ Updated ${updatedCount} candidates (User C → Charitha).`);

    console.log('\n🎉 Setup complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  Name:     Charitha');
    console.log('  Email:    userc@suhara.com');
    console.log('  Password: #HrSuhara2024');
    console.log('  Role:     Manager (HR & Operations)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main();
