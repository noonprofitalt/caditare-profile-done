import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tvupusehfmbsdxhpbung.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2dXB1c2VoZm1ic2R4aHBidW5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1MjI1NTcsImV4cCI6MjA4NjA5ODU1N30.xCzmxUPEK_K97HKjNLA_eq121BupqVhcAznEStQ5rj4';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function main() {
    console.log('🚀 Setting up Ishu (Recruiter)...\n');

    // 1. Update Profile (useri@suhara.com)
    console.log('Checking for existing useri@suhara.com...');
    const { data: profiles, error: pError } = await supabase.from('profiles').select('*').eq('email', 'useri@suhara.com').single();

    if (pError) {
        console.error('❌ Failed to find useri@suhara.com. Make sure the user exists first.');
        return;
    }

    if (profiles) {
        console.log(`Found existing useri@suhara.com (ID: ${profiles.id}, Current Name: ${profiles.full_name || 'User I'})`);

        // Update the profile to Ishu with Recruiter role
        const { error: updateErr } = await supabase
            .from('profiles')
            .update({
                full_name: 'Ishu',
                role: 'Recruiter',
                status: 'Active'
            })
            .eq('id', profiles.id);

        if (updateErr) {
            console.error('❌ Failed to update profile:', updateErr);
            return;
        } else {
            console.log('✅ Profile updated: Name → Ishu, Role → Recruiter');
        }
    }

    // 2. Transfer any candidate workload from "User I" to "Ishu"
    console.log('\nTransferring workload from "User I" to "Ishu"...');
    // We fetch all candidates to sweep the JSON data
    const { data: candidates, error: cErr } = await supabase.from('candidates').select('*');
    if (cErr) {
        console.error('❌ Failed to fetch candidates:', cErr);
        return;
    }

    let updatedCount = 0;
    for (const cand of candidates || []) {
        let changed = false;

        // Let's also check denormalized top-level columns just in case
        const updates: any = {};
        if (cand.coordinatorName === 'User I') {
            updates.coordinatorName = 'Ishu';
            changed = true;
        }
        if (cand.dhOfficer === 'User I') {
            updates.dhOfficer = 'Ishu';
            changed = true;
        }

        const cdata = cand.data || {};

        // Recursively replace 'User I' with 'Ishu' in JSON data fields
        const replaceUser = (obj: any): any => {
            if (Array.isArray(obj)) {
                return obj.map(item => replaceUser(item));
            } else if (obj !== null && typeof obj === 'object') {
                const newObj: any = {};
                for (const key in obj) {
                    if (['actor', 'author', 'createdBy', 'resolvedBy', 'uploadedBy', 'user', 'coordinatorName', 'dhOfficer'].includes(key) && obj[key] === 'User I') {
                        newObj[key] = 'Ishu';
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
            updates.data = newData;
            const { error: updateErr } = await supabase
                .from('candidates')
                .update(updates)
                .eq('id', cand.id);

            if (updateErr) {
                console.error(`❌ Failed to update candidate ${cand.id}:`, updateErr.message);
            } else {
                updatedCount++;
            }
        }
    }

    console.log(`✅ Updated ${updatedCount} candidates (User I → Ishu).`);

    // 3. Let's also sweep employers activity logs just in case
    console.log('\nChecking employers for workload transfer...');
    const { data: employers, error: eErr } = await supabase.from('employers').select('*');
    if (!eErr && employers) {
        let empUpdatedCount = 0;
        for (const emp of employers) {
            let empChanged = false;

            if (emp.activityLog && Array.isArray(emp.activityLog)) {
                const newLog = emp.activityLog.map((log: any) => {
                    if (log.actor === 'User I') {
                        empChanged = true;
                        return { ...log, actor: 'Ishu' };
                    }
                    return log;
                });

                if (empChanged) {
                    const { error: empUpdErr } = await supabase
                        .from('employers')
                        .update({ activityLog: newLog })
                        .eq('id', emp.id);

                    if (!empUpdErr) empUpdatedCount++;
                }
            }
        }
        console.log(`✅ Updated ${empUpdatedCount} employers (User I → Ishu).`);
    }

    console.log('\n🎉 Setup complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  Name:     Ishu');
    console.log('  Email:    useri@suhara.com');
    console.log('  Password: 22 (Unchanged from test defaults)');
    console.log('  Role:     Recruiter');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main();
