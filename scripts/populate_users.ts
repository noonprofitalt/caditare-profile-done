
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const usersToCreate = [
    { name: 'User A', email: 'userA@suhara.com' },
    { name: 'User B', email: 'userB@suhara.com' },
    { name: 'User C', email: 'userC@suhara.com' },
    { name: 'User D', email: 'userD@suhara.com' },
    { name: 'User E', email: 'userE@suhara.com' },
    { name: 'User F', email: 'userF@suhara.com' },
    { name: 'User G', email: 'userG@suhara.com' },
    { name: 'User H', email: 'userH@suhara.com' },
    { name: 'User I', email: 'userI@suhara.com' },
    { name: 'User J', email: 'userJ@suhara.com' },
    { name: 'User K', email: 'userK@suhara.com' },
    { name: 'User L', email: 'userL@suhara.com' },
    { name: 'User M', email: 'userM@suhara.com' },
    { name: 'User N', email: 'userN@suhara.com' },
];

async function main() {
    console.log('🚀 Starting user population...');

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

    // 2. Create Users
    for (const user of usersToCreate) {
        process.stdout.write(`Creating ${user.name} (${user.email})... `);

        try {
            const { data, error } = await supabase.functions.invoke('create-user', {
                body: {
                    email: user.email,
                    password: '22',
                    name: user.name,
                    role: 'Viewer',
                    status: 'Active'
                }
            });

            if (error) {
                // Supabase functions error structure can vary
                const msg = error instanceof Error ? error.message : JSON.stringify(error);

                if (msg.includes('already registered') || msg.includes('already exists') || (error.context && error.context.status === 400)) {
                    console.log(`⚠️ Exists/Failed`);
                } else {
                    console.log(`❌ Failed: ${msg}`);
                }
            } else {
                console.log(`✅ Success (ID: ${data?.user?.id || 'Created'})`);
            }

        } catch (err) {
            console.log(`❌ Error: ${err}`);
        }

        // Small delay to prevent rate limits
        await new Promise(r => setTimeout(r, 250));
    }

    console.log('\n🎉 Population complete!');
}

main();
