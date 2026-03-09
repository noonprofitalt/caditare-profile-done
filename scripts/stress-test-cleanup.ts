import { supabase } from '../services/supabase.ts';

async function cleanup() {
    console.log('Cleaning up stress test dummy candidates...');

    // We generated candidate codes starting with GW-ST
    const { data, error } = await supabase
        .from('candidates')
        .delete()
        .like('candidate_code', 'GW-ST%');

    if (error) {
        console.error('Error deleting dummy candidates:', error);
    } else {
        console.log('Successfully removed all dummy candidates!');
    }
}

cleanup();
