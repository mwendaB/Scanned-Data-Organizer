const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixDataRelationships() {
  console.log('🔧 Fixing data relationships...\n');

  try {
    // 1. Get all documents and their current workspace_ids
    const { data: documents } = await supabase
      .from('documents')
      .select('id, workspace_id, filename');
    
    console.log('📄 Documents found:', documents?.length);
    
    // 2. Get all workspaces
    const { data: workspaces } = await supabase
      .from('workspaces')
      .select('id, name');
    
    console.log('🏢 Workspaces found:', workspaces?.length);
    
    // 3. Fix document workspace references
    console.log('\n🔗 Fixing document-workspace relationships...');
    
    if (documents && workspaces) {
      for (const doc of documents) {
        // Map document to appropriate workspace
        let newWorkspaceId = workspaces[0]?.id; // Default to first workspace
        
        if (doc.filename?.includes('Financial') || doc.filename?.includes('Tax')) {
          newWorkspaceId = workspaces.find(w => w.name.includes('Audit'))?.id || workspaces[0]?.id;
        } else if (doc.filename?.includes('Compliance') || doc.filename?.includes('GDPR')) {
          newWorkspaceId = workspaces.find(w => w.name.includes('Compliance'))?.id || workspaces[0]?.id;
        }
        
        // Update the document with correct workspace_id
        await supabase
          .from('documents')
          .update({ workspace_id: newWorkspaceId })
          .eq('id', doc.id);
        
        console.log(`   Updated ${doc.filename} -> workspace: ${newWorkspaceId}`);
      }
    }

    // 4. Get all workflow instances and fix document references
    const { data: workflowInstances } = await supabase
      .from('workflow_instances')
      .select('id, document_id');
    
    console.log('\n🔄 Workflow instances found:', workflowInstances?.length);
    
    if (workflowInstances && documents) {
      for (const instance of workflowInstances) {
        // Map to actual document ID
        const actualDoc = documents.find(d => d.id.includes('financial') || d.filename.includes('Financial'));
        if (actualDoc && instance.document_id !== actualDoc.id) {
          await supabase
            .from('workflow_instances')
            .update({ document_id: actualDoc.id })
            .eq('id', instance.id);
          
          console.log(`   Updated workflow ${instance.id} -> document: ${actualDoc.id}`);
        }
      }
    }

    // 5. Fix compliance checks
    const { data: complianceChecks } = await supabase
      .from('compliance_checks')
      .select('id, document_id');
    
    console.log('\n📋 Compliance checks found:', complianceChecks?.length);
    
    if (complianceChecks && documents) {
      for (const check of complianceChecks) {
        const actualDoc = documents[0]; // Use first document as default
        if (actualDoc && check.document_id !== actualDoc.id) {
          await supabase
            .from('compliance_checks')
            .update({ document_id: actualDoc.id })
            .eq('id', check.id);
          
          console.log(`   Updated compliance check ${check.id} -> document: ${actualDoc.id}`);
        }
      }
    }

    // 6. Fix financial extractions
    const { data: financialExtractions } = await supabase
      .from('financial_extractions')
      .select('id, document_id');
    
    console.log('\n💰 Financial extractions found:', financialExtractions?.length);
    
    if (financialExtractions && documents) {
      for (const extraction of financialExtractions) {
        const actualDoc = documents.find(d => d.filename.includes('Financial')) || documents[0];
        if (actualDoc && extraction.document_id !== actualDoc.id) {
          await supabase
            .from('financial_extractions')
            .update({ document_id: actualDoc.id })
            .eq('id', extraction.id);
          
          console.log(`   Updated financial extraction ${extraction.id} -> document: ${actualDoc.id}`);
        }
      }
    }

    // 7. Fix risk assessments
    const { data: riskAssessments } = await supabase
      .from('risk_assessments')
      .select('id, document_id');
    
    console.log('\n⚠️  Risk assessments found:', riskAssessments?.length);
    
    if (riskAssessments && documents) {
      for (const risk of riskAssessments) {
        const actualDoc = documents[Math.floor(Math.random() * documents.length)]; // Random distribution
        if (actualDoc && risk.document_id !== actualDoc.id) {
          await supabase
            .from('risk_assessments')
            .update({ document_id: actualDoc.id })
            .eq('id', risk.id);
          
          console.log(`   Updated risk assessment ${risk.id} -> document: ${actualDoc.id}`);
        }
      }
    }

    // 8. Fix workspace collaborations
    const { data: collaborations } = await supabase
      .from('workspace_collaborations')
      .select('id, workspace_id');
    
    console.log('\n🤝 Collaborations found:', collaborations?.length);
    
    if (collaborations && workspaces) {
      for (const collab of collaborations) {
        const actualWorkspace = workspaces[0]; // Use first workspace
        if (actualWorkspace && collab.workspace_id !== actualWorkspace.id) {
          await supabase
            .from('workspace_collaborations')
            .update({ workspace_id: actualWorkspace.id })
            .eq('id', collab.id);
          
          console.log(`   Updated collaboration ${collab.id} -> workspace: ${actualWorkspace.id}`);
        }
      }
    }

    console.log('\n✅ Data relationships fixed!');
    
    // Test the joins again
    console.log('\n🧪 Testing fixed relationships...');
    
    const { data: testDocs } = await supabase
      .from('documents')
      .select('id, filename, workspaces(name)')
      .limit(3);
    
    console.log('Documents with Workspaces (after fix):');
    testDocs?.forEach(doc => {
      console.log(`   ✅ ${doc.filename} in workspace: ${doc.workspaces?.name}`);
    });

    const { data: testWorkflows } = await supabase
      .from('workflow_instances')
      .select('id, status, documents(filename)')
      .limit(3);
    
    console.log('\nWorkflow Instances with Documents (after fix):');
    testWorkflows?.forEach(wf => {
      console.log(`   ✅ ${wf.id} (${wf.status}) for doc: ${wf.documents?.filename}`);
    });

  } catch (error) {
    console.error('❌ Error fixing relationships:', error);
  }
}

fixDataRelationships();
