const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function populateAllTables() {
  console.log('🚀 Populating ALL tables with comprehensive data...\n');

  try {
    // First, clear existing test data and create new data for a demo user
    const demoUserId = 'demo-user-2024';
    const workspaceId = 'main-workspace';

    console.log('1. 📄 Creating Documents...');
    const documents = [
      {
        id: 'doc-demo-1',
        uploaded_by: demoUserId,
        filename: 'Financial_Report_Q1_2024.pdf',
        file_path: '/uploads/financial_report_q1_2024.pdf',
        file_size: 2048576,
        mime_type: 'application/pdf',
        ocr_text: 'Q1 2024 Financial Report\n\nRevenue: $1,250,000\nExpenses: $980,000\nNet Income: $270,000\n\nKey highlights:\n- 15% growth in revenue compared to Q4 2023\n- Operating margin improved to 21.6%\n- Cash flow from operations: $320,000',
        tags: ['financial', 'quarterly', 'revenue', 'Q1-2024'],
        workspace_id: workspaceId,
        created_at: new Date().toISOString()
      },
      {
        id: 'doc-demo-2',
        uploaded_by: demoUserId,
        filename: 'Compliance_Audit_2024.pdf',
        file_path: '/uploads/compliance_audit_2024.pdf',
        file_size: 1536000,
        mime_type: 'application/pdf',
        ocr_text: 'Annual Compliance Audit Report 2024\n\nSOX Compliance: PASSED\nGDPR Compliance: PASSED\nISO 27001: IN PROGRESS\n\nFindings:\n- All financial controls are operating effectively\n- Data protection measures meet requirements\n- Minor recommendations for improvement in access controls',
        tags: ['compliance', 'SOX', 'GDPR', 'audit', '2024'],
        workspace_id: workspaceId,
        created_at: new Date(Date.now() - 86400000).toISOString() // 1 day ago
      },
      {
        id: 'doc-demo-3',
        uploaded_by: demoUserId,
        filename: 'Tax_Returns_Corporate_2023.pdf',
        file_path: '/uploads/tax_returns_2023.pdf',
        file_size: 3072000,
        mime_type: 'application/pdf',
        ocr_text: 'Corporate Tax Return 2023\n\nGross Income: $4,800,000\nDeductions: $3,950,000\nTaxable Income: $850,000\nTax Liability: $178,500\n\nSchedules included:\n- Schedule C: Business Income\n- Schedule D: Capital Gains\n- Form 4562: Depreciation',
        tags: ['tax', 'returns', '2023', 'corporate', 'IRS'],
        workspace_id: workspaceId,
        created_at: new Date(Date.now() - 172800000).toISOString() // 2 days ago
      },
      {
        id: 'doc-demo-4',
        uploaded_by: demoUserId,
        filename: 'Board_Minutes_March_2024.pdf',
        file_path: '/uploads/board_minutes_march_2024.pdf',
        file_size: 1024000,
        mime_type: 'application/pdf',
        ocr_text: 'Board of Directors Meeting Minutes\nMarch 15, 2024\n\nAttendees: John Smith (CEO), Sarah Johnson (CFO), Mike Brown (COO)\n\nAgenda Items:\n1. Q1 Financial Review\n2. Compliance Update\n3. Risk Assessment\n4. Strategic Planning\n\nDecisions:\n- Approved Q1 budget allocation\n- Authorized compliance audit\n- Implemented new risk management framework',
        tags: ['board', 'minutes', 'governance', 'March-2024'],
        workspace_id: workspaceId,
        created_at: new Date(Date.now() - 259200000).toISOString() // 3 days ago
      },
      {
        id: 'doc-demo-5',
        uploaded_by: demoUserId,
        filename: 'Employee_Handbook_2024.pdf',
        file_path: '/uploads/employee_handbook_2024.pdf',
        file_size: 2560000,
        mime_type: 'application/pdf',
        ocr_text: 'Employee Handbook 2024\n\nCode of Conduct\nAnti-Harassment Policy\nData Protection Guidelines\nSafety Procedures\n\nUpdated policies:\n- Remote work guidelines\n- Cybersecurity training requirements\n- Diversity and inclusion initiatives\n- Performance review process',
        tags: ['HR', 'handbook', 'policies', '2024'],
        workspace_id: workspaceId,
        created_at: new Date(Date.now() - 345600000).toISOString() // 4 days ago
      }
    ];

    // Insert documents
    const { error: docsError } = await supabase
      .from('documents')
      .upsert(documents);

    if (docsError) {
      console.error('Documents error:', docsError);
    } else {
      console.log('✅ Created', documents.length, 'documents');
    }

    console.log('\n2. 🔍 Creating Parsed Data...');
    const parsedDataEntries = [];
    documents.forEach((doc, docIndex) => {
      // Create multiple parsed data entries per document
      const fields = [
        { field_name: 'document_type', field_value: doc.tags[0] || 'general', field_type: 'text' },
        { field_name: 'amount', field_value: `$${(Math.random() * 1000000).toFixed(2)}`, field_type: 'currency' },
        { field_name: 'date', field_value: doc.created_at.split('T')[0], field_type: 'date' },
        { field_name: 'status', field_value: 'processed', field_type: 'text' }
      ];

      fields.forEach((field, fieldIndex) => {
        parsedDataEntries.push({
          id: `parsed-${docIndex}-${fieldIndex}`,
          document_id: doc.id,
          field_name: field.field_name,
          field_value: field.field_value,
          confidence: 0.85 + Math.random() * 0.15,
          field_type: field.field_type,
          page_number: 1,
          coordinates: null,
          created_at: doc.created_at
        });
      });
    });

    const { error: parsedError } = await supabase
      .from('parsed_data')
      .upsert(parsedDataEntries);

    if (parsedError) {
      console.error('Parsed data error:', parsedError);
    } else {
      console.log('✅ Created', parsedDataEntries.length, 'parsed data entries');
    }

    console.log('\n3. 🏢 Creating Workspace...');
    const workspace = {
      id: workspaceId,
      name: 'Main Audit Workspace',
      description: 'Primary workspace for audit and compliance activities',
      created_by: demoUserId,
      settings: {
        auto_backup: true,
        default_retention: '7_years',
        compliance_alerts: true
      },
      created_at: new Date().toISOString()
    };

    const { error: workspaceError } = await supabase
      .from('workspaces')
      .upsert([workspace]);

    if (workspaceError) {
      console.error('Workspace error:', workspaceError);
    } else {
      console.log('✅ Created workspace');
    }

    console.log('\n4. 👥 Creating Workspace Collaborations...');
    const collaborations = [
      {
        id: 'collab-1',
        workspace_id: workspaceId,
        user_id: demoUserId,
        role: 'ADMIN',
        permissions: ['read', 'write', 'delete', 'admin'],
        joined_at: new Date().toISOString()
      },
      {
        id: 'collab-2',
        workspace_id: workspaceId,
        user_id: 'reviewer@company.com',
        role: 'REVIEWER',
        permissions: ['read', 'comment', 'workflow'],
        joined_at: new Date().toISOString()
      },
      {
        id: 'collab-3',
        workspace_id: workspaceId,
        user_id: 'auditor@company.com',
        role: 'AUDITOR',
        permissions: ['read', 'audit', 'compliance'],
        joined_at: new Date().toISOString()
      }
    ];

    const { error: collabError } = await supabase
      .from('workspace_collaborations')
      .upsert(collaborations);

    if (collabError) {
      console.error('Collaboration error:', collabError);
    } else {
      console.log('✅ Created', collaborations.length, 'collaborations');
    }

    console.log('\n5. ⚖️ Creating Compliance Frameworks...');
    const frameworks = [
      {
        id: 'framework-sox-new',
        name: 'SOX',
        description: 'Sarbanes-Oxley Act Compliance',
        requirements: {
          audit_trail: 'required',
          data_retention: '7_years',
          digital_signature: 'required',
          access_controls: 'mandatory'
        },
        created_at: new Date().toISOString()
      },
      {
        id: 'framework-gdpr-new',
        name: 'GDPR',
        description: 'General Data Protection Regulation',
        requirements: {
          data_encryption: 'required',
          consent_tracking: 'mandatory',
          data_deletion: 'on_request',
          breach_notification: '72_hours'
        },
        created_at: new Date().toISOString()
      }
    ];

    const { error: frameworksError } = await supabase
      .from('compliance_frameworks')
      .upsert(frameworks);

    if (frameworksError) {
      console.error('Frameworks error:', frameworksError);
    } else {
      console.log('✅ Created', frameworks.length, 'compliance frameworks');
    }

    console.log('\n6. ✅ Creating Compliance Checks...');
    const complianceChecks = [];
    documents.forEach((doc, index) => {
      frameworks.forEach((framework, fIndex) => {
        complianceChecks.push({
          id: `check-${index}-${fIndex}`,
          document_id: doc.id,
          framework_id: framework.id,
          check_name: `${framework.name} Compliance Check`,
          status: Math.random() > 0.3 ? 'PASSED' : 'FAILED',
          score: Math.floor(Math.random() * 40) + 60,
          issues_found: Math.floor(Math.random() * 3),
          recommendations: ['Improve data retention policy', 'Update access controls'],
          checked_at: new Date().toISOString(),
          checked_by: 'auditor@company.com'
        });
      });
    });

    const { error: checksError } = await supabase
      .from('compliance_checks')
      .upsert(complianceChecks);

    if (checksError) {
      console.error('Compliance checks error:', checksError);
    } else {
      console.log('✅ Created', complianceChecks.length, 'compliance checks');
    }

    console.log('\n7. 🔄 Creating Workflows...');
    const workflows = [
      {
        id: 'workflow-audit-new',
        name: 'Document Audit Review',
        description: 'Standard audit review process for uploaded documents',
        workspace_id: workspaceId,
        created_by: demoUserId,
        steps: [
          { step: 1, name: 'Initial Review', role: 'REVIEWER' },
          { step: 2, name: 'Compliance Check', role: 'AUDITOR' },
          { step: 3, name: 'Final Approval', role: 'ADMIN' }
        ],
        created_at: new Date().toISOString()
      }
    ];

    const { error: workflowsError } = await supabase
      .from('workflows')
      .upsert(workflows);

    if (workflowsError) {
      console.error('Workflows error:', workflowsError);
    } else {
      console.log('✅ Created', workflows.length, 'workflows');
    }

    console.log('\n8. 📋 Creating Workflow Instances...');
    const workflowInstances = [];
    documents.slice(0, 3).forEach((doc, index) => {
      workflowInstances.push({
        id: `instance-new-${index}`,
        workflow_id: 'workflow-audit-new',
        document_id: doc.id,
        initiated_by: demoUserId,
        current_step: Math.floor(Math.random() * 3) + 1,
        status: ['IN_PROGRESS', 'COMPLETED', 'PENDING'][Math.floor(Math.random() * 3)],
        workflow_data: {
          priority: 'medium',
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        },
        created_at: doc.created_at
      });
    });

    const { error: instancesError } = await supabase
      .from('workflow_instances')
      .upsert(workflowInstances);

    if (instancesError) {
      console.error('Workflow instances error:', instancesError);
    } else {
      console.log('✅ Created', workflowInstances.length, 'workflow instances');
    }

    console.log('\n9. 📝 Creating Review Comments...');
    const reviewComments = [];
    documents.slice(0, 3).forEach((doc, index) => {
      reviewComments.push({
        id: `comment-new-${index}`,
        document_id: doc.id,
        comment_text: `Review completed for ${doc.filename}. All financial figures have been verified and comply with current standards.`,
        comment_type: 'REVIEW',
        created_by: 'reviewer@company.com',
        created_at: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString()
      });
    });

    const { error: commentsError } = await supabase
      .from('review_comments')
      .upsert(reviewComments);

    if (commentsError) {
      console.error('Review comments error:', commentsError);
    } else {
      console.log('✅ Created', reviewComments.length, 'review comments');
    }

    console.log('\n10. ⚠️ Creating Risk Assessments...');
    const riskAssessments = [];
    documents.forEach((doc, index) => {
      const riskLevels = ['LOW', 'MEDIUM', 'HIGH'];
      const riskCategories = ['FINANCIAL', 'OPERATIONAL', 'COMPLIANCE', 'SECURITY'];
      
      riskAssessments.push({
        id: `risk-new-${index}`,
        document_id: doc.id,
        risk_category: riskCategories[index % riskCategories.length],
        risk_level: riskLevels[Math.floor(Math.random() * riskLevels.length)],
        risk_description: `Risk assessment for ${doc.filename} - potential compliance and operational risks identified`,
        impact_score: Math.floor(Math.random() * 10) + 1,
        likelihood_score: Math.floor(Math.random() * 10) + 1,
        mitigation_measures: ['Regular review', 'Enhanced monitoring', 'Staff training'],
        assessed_by: 'risk@company.com',
        assessed_at: new Date().toISOString()
      });
    });

    const { error: riskError } = await supabase
      .from('risk_assessments')
      .upsert(riskAssessments);

    if (riskError) {
      console.error('Risk assessments error:', riskError);
    } else {
      console.log('✅ Created', riskAssessments.length, 'risk assessments');
    }

    console.log('\n11. 💰 Creating Financial Extractions...');
    const financialExtractions = [];
    documents.forEach((doc, index) => {
      if (doc.tags.includes('financial') || doc.tags.includes('tax')) {
        financialExtractions.push({
          id: `fin-new-${index}`,
          document_id: doc.id,
          extraction_type: 'REVENUE',
          amount: Math.floor(Math.random() * 1000000) + 100000,
          currency: 'USD',
          period: '2024-Q1',
          line_item: 'Total Revenue',
          confidence: 0.9 + Math.random() * 0.1,
          extracted_at: new Date().toISOString()
        });
      }
    });

    const { error: finError } = await supabase
      .from('financial_extractions')
      .upsert(financialExtractions);

    if (finError) {
      console.error('Financial extractions error:', finError);
    } else {
      console.log('✅ Created', financialExtractions.length, 'financial extractions');
    }

    console.log('\n12. 📜 Creating Audit Trail...');
    const auditEntries = [];
    documents.forEach((doc, index) => {
      auditEntries.push({
        id: `audit-new-${index}`,
        user_id: demoUserId,
        action: 'DOCUMENT_UPLOAD',
        resource_type: 'DOCUMENT',
        resource_id: doc.id,
        details: {
          filename: doc.filename,
          size: doc.file_size,
          tags: doc.tags
        },
        ip_address: '192.168.1.100',
        user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        created_at: doc.created_at
      });
    });

    const { error: auditError } = await supabase
      .from('audit_trail')
      .upsert(auditEntries);

    if (auditError) {
      console.error('Audit trail error:', auditError);
    } else {
      console.log('✅ Created', auditEntries.length, 'audit entries');
    }

    console.log('\n🎉 ALL TABLES POPULATED SUCCESSFULLY!');
    console.log('\n📊 Summary:');
    console.log('- Documents: Ready for analytics');
    console.log('- Parsed Data: Ready for data analysis');
    console.log('- Workspaces: Ready for collaboration');
    console.log('- Compliance: Ready for compliance tracking');
    console.log('- Workflows: Ready for workflow management');
    console.log('- Risk: Ready for risk management');
    console.log('- Audit: Ready for audit trails');
    console.log('\n🎯 The demo user ID is:', demoUserId);
    console.log('🎯 Use this in update-test-data.js if needed');

  } catch (error) {
    console.error('❌ Error populating tables:', error);
  }
}

populateAllTables().then(() => {
  console.log('\n✅ Database population complete!');
  process.exit(0);
});
