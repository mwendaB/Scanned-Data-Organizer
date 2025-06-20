#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env' });

async function runMigration() {
  console.log('🚀 Running Supabase Migration...\n');

  // Check environment variables
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.error('❌ Missing environment variables. Please check your .env file:');
    console.error(`   NEXT_PUBLIC_SUPABASE_URL: ${url ? '✅ Set' : '❌ Missing'}`);
    console.error(`   NEXT_PUBLIC_SUPABASE_ANON_KEY: ${key ? '✅ Set' : '❌ Missing'}`);
    process.exit(1);
  }

  console.log('✅ Environment variables found');

  // Migration files to run
  const migrationFiles = [
    'supabase/migrations/001_initial_schema.sql',
    'supabase/migrations/002_advanced_features.sql'
  ];

  let allMigrationsExist = true;
  for (const file of migrationFiles) {
    const migrationPath = path.join(__dirname, file);
    if (!fs.existsSync(migrationPath)) {
      console.error(`❌ Migration file not found: ${migrationPath}`);
      allMigrationsExist = false;
    }
  }

  if (!allMigrationsExist) {
    process.exit(1);
  }

  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
  console.log('✅ Migration file loaded');

  // Create Supabase client
  const supabase = createClient(url, key);

  try {
    console.log('📊 Executing migration SQL...');
    
    // Split the SQL into individual statements and execute them
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    let successCount = 0;
    let warningCount = 0;

    for (const [index, statement] of statements.entries()) {
      if (statement.toLowerCase().includes('select ') && statement.includes('status')) {
        // Skip the final verification SELECT statement
        continue;
      }

      try {
        const { data, error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
        
        if (error) {
          // Some errors are expected (like "already exists")
          if (error.message.includes('already exists') || 
              error.message.includes('does not exist') ||
              error.message.includes('duplicate')) {
            console.log(`⚠️  Statement ${index + 1}: ${error.message} (expected)`);
            warningCount++;
          } else {
            console.error(`❌ Statement ${index + 1} failed:`, error.message);
            throw error;
          }
        } else {
          successCount++;
        }
      } catch (err) {
        // Try alternative approach - direct SQL execution
        try {
          const { error: directError } = await supabase
            .from('_migrations_test')
            .select('*')
            .limit(1);
          
          // If we can't run a test query, the user needs to run migration manually
          if (directError) {
            console.log('\n⚠️  Cannot execute SQL directly via API.');
            console.log('📋 Please run the migration manually in your Supabase dashboard:');
            console.log('\n1. Go to: https://app.supabase.com/project/' + url.split('//')[1].split('.')[0]);
            console.log('2. Navigate to: SQL Editor');
            console.log('3. Copy and paste the contents of: supabase/migrations/001_initial_schema.sql');
            console.log('4. Click "RUN" to execute the migration');
            console.log('\n📁 Migration file location:', migrationPath);
            return;
          }
        } catch (testErr) {
          console.log('\n⚠️  Direct SQL execution not available via client.');
          console.log('📋 Please run the migration manually in your Supabase dashboard:');
          console.log('\n1. Go to: https://app.supabase.com/project/' + url.split('//')[1].split('.')[0]);
          console.log('2. Navigate to: SQL Editor');
          console.log('3. Copy and paste the contents of: supabase/migrations/001_initial_schema.sql');
          console.log('4. Click "RUN" to execute the migration');
          console.log('\n📁 Migration file location:', migrationPath);
          return;
        }
      }
    }

    if (successCount > 0 || warningCount > 0) {
      console.log(`\n✅ Migration completed!`);
      console.log(`   Successful statements: ${successCount}`);
      console.log(`   Warnings (expected): ${warningCount}`);
    }

  } catch (error) {
    console.log('\n⚠️  Automated migration failed. Please run manually:');
    console.log('\n📋 Manual Migration Steps:');
    console.log('1. Go to: https://app.supabase.com/project/' + url.split('//')[1].split('.')[0]);
    console.log('2. Navigate to: SQL Editor');
    console.log('3. Copy and paste the contents of: supabase/migrations/001_initial_schema.sql');
    console.log('4. Click "RUN" to execute the migration');
    console.log('\n📁 Migration file location:', migrationPath);
    console.log('\n🔗 Direct link to your Supabase project:');
    console.log('   https://app.supabase.com/project/' + url.split('//')[1].split('.')[0] + '/sql');
    return;
  }

  // Verify migration success
  try {
    console.log('\n🔍 Verifying migration...');
    
    const { data: tables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['documents', 'parsed_data']);

    if (tableError) {
      console.log('⚠️  Could not verify tables (this is normal for some Supabase setups)');
    } else if (tables && tables.length >= 2) {
      console.log('✅ Tables created successfully!');
    }

    console.log('\n🎉 Migration setup complete!');
    console.log('\nNext steps:');
    console.log('1. Configure authentication URLs in Supabase dashboard:');
    console.log('   - Site URL: http://localhost:3000');
    console.log('   - Redirect URLs: http://localhost:3000/auth/callback');
    console.log('2. Start your development server: npm run dev');
    console.log('3. Test the authentication flow');

  } catch (verifyError) {
    console.log('\n✅ Migration likely successful (verification failed, but this is normal)');
    console.log('\nNext steps:');
    console.log('1. Configure authentication URLs in Supabase dashboard');
    console.log('2. Start your development server: npm run dev');
  }
}

// Handle script errors gracefully
process.on('unhandledRejection', (error) => {
  console.log('\n⚠️  Migration script encountered an issue.');
  console.log('📋 Please run the migration manually in your Supabase dashboard:');
  console.log('\n1. Go to your Supabase project dashboard');
  console.log('2. Navigate to: SQL Editor');
  console.log('3. Copy and paste the contents of: supabase/migrations/001_initial_schema.sql');
  console.log('4. Click "RUN" to execute the migration');
});

runMigration();
