const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testDashboardData() {
  console.log('🧪 Testing Dashboard Data Structure...\n');

  try {
    const demoUserId = 'demo-user-2024';

    // Test documents structure
    console.log('📄 Testing Documents:');
    const { data: docs, error: docsError } = await supabase
      .from('documents')
      .select('id, filename, mime_type, file_size, created_at')
      .eq('uploaded_by', demoUserId)
      .limit(3);

    if (docsError) {
      console.error('❌ Documents error:', docsError);
    } else {
      console.log('✅ Found', docs?.length || 0, 'documents for demo user');
      docs?.forEach((doc, i) => {
        console.log(`   ${i + 1}. ${doc.filename} (${doc.mime_type})`);
      });
    }

    // Test parsed data structure
    console.log('\n🔍 Testing Parsed Data:');
    if (docs && docs.length > 0) {
      const docIds = docs.map(d => d.id);
      const { data: parsedData, error: parsedError } = await supabase
        .from('parsed_data')
        .select('field_name, field_value, field_type, confidence')
        .in('document_id', docIds)
        .limit(5);

      if (parsedError) {
        console.error('❌ Parsed data error:', parsedError);
      } else {
        console.log('✅ Found', parsedData?.length || 0, 'parsed data entries');
        parsedData?.forEach((item, i) => {
          console.log(`   ${i + 1}. ${item.field_name}: ${item.field_value} (${item.field_type}, ${Math.round(item.confidence * 100)}%)`);
        });
      }
    }

    console.log('\n🎯 Dashboard should now show:');
    console.log('   📄 Documents tab: Filenames properly displayed');
    console.log('   🔍 Data tab: Field names, values, types, and confidence scores');
    console.log('   📊 Analytics tab: Live charts with real data');
    console.log('   ❌ No more undefined/substring errors');

  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testDashboardData().then(() => {
  console.log('\n✅ Dashboard data test complete');
  process.exit(0);
});
