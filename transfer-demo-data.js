const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function transferDataToUser(newUserId) {
  console.log('🔄 Transferring demo data to user:', newUserId);

  try {
    // Transfer documents
    console.log('1. 📄 Transferring documents...');
    const { data: updatedDocs, error: docsError } = await supabase
      .from('documents')
      .update({ uploaded_by: newUserId })
      .eq('uploaded_by', 'demo-user-2024')
      .select('id, filename');

    if (docsError) {
      console.error('❌ Documents error:', docsError);
    } else {
      console.log('✅ Transferred', updatedDocs?.length || 0, 'documents');
    }

    // Transfer workspace
    console.log('\n2. 🏢 Transferring workspace...');
    const { error: workspaceError } = await supabase
      .from('workspaces')
      .update({ created_by: newUserId })
      .eq('created_by', 'demo-user-2024');

    if (workspaceError) {
      console.error('❌ Workspace error:', workspaceError);
    } else {
      console.log('✅ Transferred workspace ownership');
    }

    // Transfer audit trail
    console.log('\n3. 📜 Transferring audit trail...');
    const { error: auditError } = await supabase
      .from('audit_trail')
      .update({ user_id: newUserId })
      .eq('user_id', 'demo-user-2024');

    if (auditError) {
      console.error('❌ Audit trail error:', auditError);
    } else {
      console.log('✅ Transferred audit entries');
    }

    // Update collaborations
    console.log('\n4. 👥 Updating collaborations...');
    const { error: collabError } = await supabase
      .from('workspace_collaborations')
      .update({ user_id: newUserId })
      .eq('user_id', 'demo-user-2024');

    if (collabError) {
      console.error('❌ Collaboration error:', collabError);
    } else {
      console.log('✅ Updated collaboration user ID');
    }

    console.log('\n🎉 Data transfer completed!');
    console.log('   User', newUserId, 'now owns all the demo data');
    console.log('   Dashboard should show live data for this user');

    // Verify the transfer
    console.log('\n🧪 Verifying transfer...');
    const { data: verifyDocs } = await supabase
      .from('documents')
      .select('id, filename')
      .eq('uploaded_by', newUserId);

    console.log('✅ Verification:', verifyDocs?.length || 0, 'documents found for user');

    return true;

  } catch (error) {
    console.error('❌ Error transferring data:', error);
    return false;
  }
}

// Usage
const newUserId = process.argv[2];
if (!newUserId) {
  console.log(`
🎯 USAGE: node transfer-demo-data.js "your-user-id"

This script transfers all demo data to a specific user so they can see
live analytics in the dashboard.

📝 Steps to use:
1. Sign up in the app to get your real user ID
2. Check browser dev tools or database to find your user ID  
3. Run: node transfer-demo-data.js "your-actual-user-id"
4. Refresh the dashboard to see live data

🔍 The user ID is usually a UUID like: a1b2c3d4-5678-90ab-cdef-1234567890ab
`);
  process.exit(0);
}

transferDataToUser(newUserId).then((success) => {
  if (success) {
    console.log('\n✅ Transfer completed successfully!');
  } else {
    console.log('\n❌ Transfer failed');
  }
  process.exit(0);
});
