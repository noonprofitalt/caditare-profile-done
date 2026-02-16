
import { query, closePool } from '../database';

async function migrate() {
    console.log('🔄 Starting migration: Add System Channels...');

    try {
        // 1. Add entity columns if they don't exist
        await query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_channels' AND column_name = 'entity_type') THEN
          ALTER TABLE chat_channels ADD COLUMN entity_type VARCHAR(50);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_channels' AND column_name = 'entity_id') THEN
          ALTER TABLE chat_channels ADD COLUMN entity_id UUID; -- Assuming entity IDs are UUIDs (candidates, users etc usually are)
        END IF;
      END $$;
    `);
        console.log('✅ Added entity_type and entity_id columns');

        // 2. Update CHECK constraint for type
        // We need to drop the old one and add a new one. 
        // Note: The constraint name might be auto-generated, so we try to find it or drop by known name if explicit. 
        // In schema.sql it was inline: CHECK (type IN ('public', 'private'))
        // Postgres usually names it check_channels_type_check or similar.

        await query(`
      DO $$
      DECLARE
        constraint_name text;
      BEGIN
        SELECT conname INTO constraint_name
        FROM pg_constraint
        WHERE conrelid = 'chat_channels'::regclass AND contype = 'c' AND pg_get_constraintdef(oid) LIKE '%type%';
        
        IF constraint_name IS NOT NULL THEN
          EXECUTE 'ALTER TABLE chat_channels DROP CONSTRAINT ' || constraint_name;
        END IF;
      END $$;
    `);

        await query(`
      ALTER TABLE chat_channels 
      ADD CONSTRAINT chat_channels_type_check 
      CHECK (type IN ('public', 'private', 'dm', 'system'));
    `);
        console.log('✅ Updated type check constraint');

        // 3. Create index for fast lookups
        await query(`
      CREATE INDEX IF NOT EXISTS idx_channels_entity ON chat_channels(entity_type, entity_id);
    `);
        console.log('✅ Created index on entity columns');

        console.log('🎉 Migration completed successfully!');
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        await closePool();
    }
}

migrate();
