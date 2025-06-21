const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Use service role key for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Need this to create users
);

async function createTestUser() {
  console.log('🔧 Creating test user for demonstration...\n');

  try {
    const testEmail = 'test@example.com';
    const testPassword = 'test123456';

    // Create user with auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true // Auto-confirm for testing
    });

    if (authError) {
      if (authError.message.includes('already exists')) {
        console.log('✅ Test user already exists:', testEmail);
        
        // Get the existing user
        const { data: users } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = users.users.find(u => u.email === testEmail);
        
        if (existingUser) {
          console.log('📧 User ID:', existingUser.id);
          
          // Update our test documents to use this real user ID
          const { error: updateError } = await supabaseAdmin
            .from('documents')
            .update({ uploaded_by: existingUser.id })
            .eq('uploaded_by', 'test-user-123');

          if (updateError) {
            console.log('⚠️  Could not update test documents:', updateError.message);
          } else {
            console.log('✅ Updated test documents to use real user ID');
          }
        }
        
        return existingUser;
      } else {
        throw authError;
      }
    }

    console.log('✅ Created test user:', testEmail);
    console.log('📧 User ID:', authData.user.id);

    // Update our test documents to use the real user ID
    const { error: updateError } = await supabaseAdmin
      .from('documents')
      .update({ uploaded_by: authData.user.id })
      .eq('uploaded_by', 'test-user-123');

    if (updateError) {
      console.log('⚠️  Could not update test documents:', updateError.message);
    } else {
      console.log('✅ Updated test documents to use real user ID');
    }

    console.log('\n🎯 You can now log in with:');
    console.log('Email:', testEmail);
    console.log('Password:', testPassword);

    return authData.user;

  } catch (error) {
    console.error('❌ Error creating test user:', error.message);
  }
}

createTestUser().then(() => {
  console.log('\n✨ Test user setup completed');
  process.exit(0);
});
