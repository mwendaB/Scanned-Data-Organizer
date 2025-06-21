const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addForeignKeys() {
  console.log('🔧 Adding missing foreign key relationships...\n');

  try {
    // Add foreign key from documents.workspace_id to workspaces.id
    console.log('📄 Adding documents -> workspaces foreign key...');
    const { error: fk1Error } = await supabase.rpc('execute_sql', {
      sql: `
        ALTER TABLE documents 
        ADD CONSTRAINT fk_documents_workspace 
        FOREIGN KEY (workspace_id) REFERENCES workspaces(id);
      `
    });
    
    if (fk1Error && !fk1Error.message.includes('already exists')) {
      console.error('FK1 Error:', fk1Error);
    } else {
      console.log('   ✅ Documents -> Workspaces foreign key added');
    }

    // Add foreign key from workflow_instances.document_id to documents.id
    console.log('🔄 Adding workflow_instances -> documents foreign key...');
    const { error: fk2Error } = await supabase.rpc('execute_sql', {
      sql: `
        ALTER TABLE workflow_instances 
        ADD CONSTRAINT fk_workflow_instances_document 
        FOREIGN KEY (document_id) REFERENCES documents(id);
      `
    });
    
    if (fk2Error && !fk2Error.message.includes('already exists')) {
      console.error('FK2 Error:', fk2Error);
    } else {
      console.log('   ✅ Workflow Instances -> Documents foreign key added');
    }

    // Add foreign key from workflow_instances.workflow_id to workflows.id
    console.log('🔄 Adding workflow_instances -> workflows foreign key...');
    const { error: fk3Error } = await supabase.rpc('execute_sql', {
      sql: `
        ALTER TABLE workflow_instances 
        ADD CONSTRAINT fk_workflow_instances_workflow 
        FOREIGN KEY (workflow_id) REFERENCES workflows(id);
      `
    });
    
    if (fk3Error && !fk3Error.message.includes('already exists')) {
      console.error('FK3 Error:', fk3Error);
    } else {
      console.log('   ✅ Workflow Instances -> Workflows foreign key added');
    }

    console.log('\n✅ Foreign keys setup complete!');

  } catch (error) {
    console.error('❌ Error adding foreign keys:', error);
  }
}

addForeignKeys();
