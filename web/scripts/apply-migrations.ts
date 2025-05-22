import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('Missing required environment variables');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function applyMigrations() {
  try {
    console.log('Starting to apply migrations...');
    
    // Read migration files
    const migrationsDir = path.join(process.cwd(), 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    console.log(`Found ${migrationFiles.length} migration(s) to apply`);

    // Apply each migration
    for (const file of migrationFiles) {
      console.log(`Applying migration: ${file}`);
      const migration = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      
      // Split the SQL into individual statements and execute them one by one
      const statements = migration.split(';').filter(statement => statement.trim().length > 0);
      
      for (const statement of statements) {
        if (statement.trim() === '') continue;
        
        const { error } = await supabase.rpc('pgmigrate', {
          sql: statement + ';'  // Add back the semicolon that was removed by split
        });

        if (error) {
          throw new Error(`Error executing statement in ${file}: ${error.message}\nStatement: ${statement}`);
        }
      }
      
      console.log(`✅ Applied migration: ${file}`);
    }

    console.log('All migrations applied successfully!');
  } catch (error) {
    console.error('Error applying migrations:', error);
    process.exit(1);
  }
}

applyMigrations();
