const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function updateTestDataForUser(newUserId) {
  console.log('🔄 Updating test data for user:', newUserId);

  try {
    // Update documents to use the new user ID
    const { data, error } = await supabase
      .from('documents')
      .update({ uploaded_by: newUserId })
      .eq('uploaded_by', 'test-user-123')
      .select();

    if (error) {
      console.error('❌ Error updating documents:', error);
      return false;
    }

    console.log('✅ Updated', data?.length || 0, 'documents to use user ID:', newUserId);

    // Update workspace collaborations if they exist
    const { error: collabError } = await supabase
      .from('workspace_collaborations')
      .update({ user_id: newUserId })
      .eq('user_id', 'test-user-123');

    if (collabError && !collabError.message.includes('does not exist')) {
      console.log('⚠️  Could not update workspace collaborations:', collabError.message);
    } else {
      console.log('✅ Updated workspace collaborations');
    }

    return true;
  } catch (error) {
    console.error('❌ Error:', error);
    return false;
  }
}

// Usage examples
async function demonstrateUsage() {
  console.log(`
📋 USAGE INSTRUCTIONS:

To update test data for a specific user after they sign up:

1. User signs up and gets a real auth user ID (like: a1b2c3d4-...)
2. Run this command:
   node update-test-data.js "a1b2c3d4-5678-90ab-cdef-1234567890ab"

OR programmatically:
   updateTestDataForUser("real-user-id-here")

This will:
- Update all test documents to belong to the real user
- Update workspace collaborations 
- Allow the real user to see all the seed data in their dashboard

🎯 After updating, the user will see live analytics data!
`);

  // If a user ID is provided as command line argument, use it
  const userId = process.argv[2];
  if (userId && userId.length > 10) {
    console.log('🔧 Updating test data for provided user ID...');
    const success = await updateTestDataForUser(userId);
    if (success) {
      console.log('✅ Test data updated successfully!');
    }
  }
}

module.exports = { updateTestDataForUser };

// Run if called directly
if (require.main === module) {
  demonstrateUsage().then(() => {
    console.log('\n🎯 Complete!');
    process.exit(0);
  });
}
