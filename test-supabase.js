#!/usr/bin/env node

// Supabase Connection Test Script
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

async function testSupabaseConnection() {
  console.log('🔧 Testing Supabase Connection...\n');

  // Check environment variables
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.error('❌ Missing environment variables:');
    console.error(`   NEXT_PUBLIC_SUPABASE_URL: ${url ? '✅ Set' : '❌ Missing'}`);
    console.error(`   NEXT_PUBLIC_SUPABASE_ANON_KEY: ${key ? '✅ Set' : '❌ Missing'}`);
    process.exit(1);
  }

  console.log('✅ Environment variables found');
  console.log(`   Project URL: ${url}`);
  console.log(`   Anon Key: ${key.substring(0, 20)}...`);

  // Test connection
  try {
    const supabase = createClient(url, key);
    
    // Test a simple query
    const { data, error } = await supabase.from('_health').select('*').limit(1);
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "table not found" which is expected
      console.error('❌ Connection error:', error.message);
      process.exit(1);
    }

    console.log('✅ Successfully connected to Supabase');

    // Test auth endpoint
    const { data: authData, error: authError } = await supabase.auth.getSession();
    if (authError) {
      console.error('❌ Auth error:', authError.message);
    } else {
      console.log('✅ Auth service is accessible');
    }

    console.log('\n🎉 Supabase connection test passed!');
    console.log('\nNext steps:');
    console.log('1. Make sure your Supabase project is set up');
    console.log('2. Run the database migration in your Supabase SQL editor');
    console.log('3. Configure authentication URLs in your Supabase dashboard:');
    console.log('   - Site URL: http://localhost:3000');
    console.log('   - Redirect URLs: http://localhost:3000/auth/callback');
    console.log('4. Start the development server: npm run dev');

  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    process.exit(1);
  }
}

testSupabaseConnection();
