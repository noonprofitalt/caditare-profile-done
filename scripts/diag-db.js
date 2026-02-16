import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/caditare_erp',
});

async function test() {
    try {
        console.log('Testing connection to:', process.env.DATABASE_URL || 'postgresql://localhost:5432/caditare_erp');
        const client = await pool.connect();
        console.log('✅ Connected to database');

        const tables = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name LIKE 'chat_%';
        `);

        console.log('Found chat tables:', tables.rows.map(r => r.table_name));

        if (tables.rows.length === 0) {
            console.log('⚠️ No chat tables found. Schema might not be initialized.');
        } else {
            const channels = await client.query('SELECT COUNT(*) FROM chat_channels');
            console.log('Channel count:', channels.rows[0].count);
        }

        client.release();
    } catch (err) {
        console.error('❌ Connection failed:');
        console.error('Name:', err.name);
        console.error('Message:', err.message);
        console.error('Code:', err.code);
        console.error('Stack:', err.stack);
    } finally {
        await pool.end();
    }
}

test();
