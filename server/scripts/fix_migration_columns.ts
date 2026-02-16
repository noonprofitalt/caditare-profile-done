
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// specific path to .env file since we are in server/scripts
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/caditare_erp',
    ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('render.com') ? { rejectUnauthorized: false } : undefined
});

const query = async (text: string, params?: any[]) => {
    return pool.query(text, params);
};

const closePool = async () => {
    await pool.end();
};

async function migrate() {
    console.log('🔄 Starting migration fix: Rename entity columns to context...');

    try {
        // Check if entity_type exists and rename it
        await query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_channels' AND column_name = 'entity_type') THEN
          ALTER TABLE chat_channels RENAME COLUMN entity_type TO context_type;
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_channels' AND column_name = 'entity_id') THEN
          ALTER TABLE chat_channels RENAME COLUMN entity_id TO context_id;
        END IF;
      END $$;
    `);

        // Ensure columns exist if they weren't renamed (e.g. if previous migration failed/was skipped)
        await query(`
      DO $$
      BEGIN
         IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_channels' AND column_name = 'context_type') THEN
           ALTER TABLE chat_channels ADD COLUMN context_type VARCHAR(50);
         END IF;

         IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_channels' AND column_name = 'context_id') THEN
           ALTER TABLE chat_channels ADD COLUMN context_id UUID;
         END IF;
      END $$;
    `);

        // Re-create index on new column names
        await query(`
      DROP INDEX IF EXISTS idx_channels_entity;
      CREATE INDEX IF NOT EXISTS idx_channels_context ON chat_channels(context_type, context_id);
    `);

        console.log('✅ Renamed/Ensured context_type and context_id columns');
        console.log('🎉 Migration fix completed!');
    } catch (error) {
        console.error('❌ Migration fix failed:', error);
        process.exit(1);
    } finally {
        await closePool();
    }
}

migrate();
