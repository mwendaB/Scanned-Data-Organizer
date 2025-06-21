const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function addDataForUser(userId = 'demo-user-2024') {
  console.log('🚀 Adding comprehensive data for user:', userId);
  console.log('   This data will show up in the dashboard for this user!\n');

  try {
    const workspaceId = 'main-workspace';

    // 1. Create Documents with proper UUIDs
    console.log('1. 📄 Creating Documents...');
    const documents = [
      {
        id: uuidv4(),
        uploaded_by: userId,
        filename: 'Financial_Report_Q1_2024.pdf',
        file_path: '/uploads/financial_report_q1_2024.pdf',
        file_size: 2048576,
        mime_type: 'application/pdf',
        ocr_text: 'Q1 2024 Financial Report\n\nRevenue: $1,250,000\nExpenses: $980,000\nNet Income: $270,000\n\nKey Performance Indicators:\n- Revenue Growth: 15%\n- Operating Margin: 21.6%\n- Cash Flow: $320,000\n- Customer Acquisition Cost: $125\n- Customer Lifetime Value: $2,500',
        metadata: { pages: 12, language: 'en', confidence: 0.94 },
        tags: ['financial', 'quarterly', 'revenue', 'Q1-2024', 'performance'],
        workspace_id: workspaceId,
        status: 'processed'
      },
      {
        id: uuidv4(),
        uploaded_by: userId,
        filename: 'Compliance_Audit_Report_2024.pdf',
        file_path: '/uploads/compliance_audit_2024.pdf',
        file_size: 1536000,
        mime_type: 'application/pdf',
        ocr_text: 'Annual Compliance Audit Report 2024\n\nSOX Compliance: PASSED (Score: 95%)\nGDPR Compliance: PASSED (Score: 88%)\nISO 27001: IN PROGRESS (Score: 72%)\n\nKey Findings:\n- Financial controls operating effectively\n- Data protection measures compliant\n- Access control improvements needed\n- Employee training up to date',
        metadata: { pages: 25, language: 'en', confidence: 0.92 },
        tags: ['compliance', 'SOX', 'GDPR', 'audit', '2024', 'security'],
        workspace_id: workspaceId,
        status: 'processed'
      },
      {
        id: uuidv4(),
        uploaded_by: userId,
        filename: 'Risk_Assessment_Matrix_2024.pdf',
        file_path: '/uploads/risk_assessment_2024.pdf',
        file_size: 1200000,
        mime_type: 'application/pdf',
        ocr_text: 'Enterprise Risk Assessment Matrix 2024\n\nHigh Risk Areas:\n- Cybersecurity (Impact: 9, Likelihood: 7)\n- Regulatory Changes (Impact: 8, Likelihood: 6)\n- Market Volatility (Impact: 7, Likelihood: 8)\n\nMedium Risk Areas:\n- Supply Chain (Impact: 6, Likelihood: 5)\n- Staff Retention (Impact: 5, Likelihood: 6)\n\nMitigation Strategies:\n- Enhanced cybersecurity training\n- Regulatory monitoring system\n- Diversified supplier base',
        metadata: { pages: 18, language: 'en', confidence: 0.89 },
        tags: ['risk', 'assessment', 'security', 'strategy', '2024'],
        workspace_id: workspaceId,
        status: 'processed'
      },
      {
        id: uuidv4(),
        uploaded_by: userId,
        filename: 'Board_Minutes_March_2024.pdf',
        file_path: '/uploads/board_minutes_march_2024.pdf',
        file_size: 850000,
        mime_type: 'application/pdf',
        ocr_text: 'Board of Directors Meeting Minutes\nMarch 15, 2024\n\nAttendees: J. Smith (CEO), S. Johnson (CFO), M. Brown (COO), A. Davis (CTO)\n\nAgenda & Decisions:\n1. Q1 Financial Review - Approved\n2. Compliance Initiative - $500K budget allocated\n3. Digital Transformation - Phase 2 authorized\n4. Risk Management Framework - Adopted new methodology\n5. Sustainability Goals - 2025 targets set',
        metadata: { pages: 8, language: 'en', confidence: 0.96 },
        tags: ['governance', 'board', 'minutes', 'March-2024', 'decisions'],
        workspace_id: workspaceId,
        status: 'processed'
      },
      {
        id: uuidv4(),
        uploaded_by: userId,
        filename: 'Employee_Policy_Update_2024.pdf',
        file_path: '/uploads/employee_policy_2024.pdf',
        file_size: 2100000,
        mime_type: 'application/pdf',
        ocr_text: 'Employee Policy Manual - 2024 Update\n\nNew Policies:\n- Remote Work Guidelines\n- Cybersecurity Best Practices\n- Diversity & Inclusion Framework\n- Mental Health Support\n- Professional Development\n\nUpdated Sections:\n- Code of Conduct\n- Performance Reviews\n- Compensation Structure\n- Benefits Package\n- Time Off Policy',
        metadata: { pages: 45, language: 'en', confidence: 0.91 },
        tags: ['HR', 'policies', 'employees', '2024', 'guidelines'],
        workspace_id: workspaceId,
        status: 'processed'
      }
    ];

    const { error: docsError } = await supabase
      .from('documents')
      .upsert(documents);

    if (docsError) {
      console.error('❌ Documents error:', docsError);
      return false;
    } else {
      console.log('✅ Created', documents.length, 'documents');
    }

    // 2. Create Parsed Data for each document
    console.log('\n2. 🔍 Creating Parsed Data...');
    const parsedDataEntries = [];
    documents.forEach((doc) => {
      // Add financial data for financial documents
      if (doc.tags.includes('financial')) {
        parsedDataEntries.push(
          {
            id: uuidv4(),
            document_id: doc.id,
            field_name: 'revenue',
            field_value: '$1,250,000',
            confidence: 0.94,
            field_type: 'currency',
            page_number: 1,
            coordinates: { x: 100, y: 200, width: 150, height: 20 }
          },
          {
            id: uuidv4(),
            document_id: doc.id,
            field_name: 'expenses',
            field_value: '$980,000',
            confidence: 0.92,
            field_type: 'currency',
            page_number: 1,
            coordinates: { x: 100, y: 240, width: 150, height: 20 }
          },
          {
            id: uuidv4(),
            document_id: doc.id,
            field_name: 'net_income',
            field_value: '$270,000',
            confidence: 0.95,
            field_type: 'currency',
            page_number: 1,
            coordinates: { x: 100, y: 280, width: 150, height: 20 }
          }
        );
      }

      // Add compliance scores for compliance documents
      if (doc.tags.includes('compliance')) {
        parsedDataEntries.push(
          {
            id: uuidv4(),
            document_id: doc.id,
            field_name: 'sox_score',
            field_value: '95%',
            confidence: 0.96,
            field_type: 'percentage',
            page_number: 2,
            coordinates: { x: 200, y: 150, width: 80, height: 18 }
          },
          {
            id: uuidv4(),
            document_id: doc.id,
            field_name: 'gdpr_score',
            field_value: '88%',
            confidence: 0.93,
            field_type: 'percentage',
            page_number: 2,
            coordinates: { x: 200, y: 180, width: 80, height: 18 }
          }
        );
      }

      // Add basic metadata for all documents
      parsedDataEntries.push(
        {
          id: uuidv4(),
          document_id: doc.id,
          field_name: 'document_type',
          field_value: doc.tags[0] || 'general',
          confidence: 0.98,
          field_type: 'text',
          page_number: 1,
          coordinates: { x: 50, y: 50, width: 200, height: 25 }
        },
        {
          id: uuidv4(),
          document_id: doc.id,
          field_name: 'status',
          field_value: 'processed',
          confidence: 1.0,
          field_type: 'text',
          page_number: 1,
          coordinates: { x: 300, y: 50, width: 100, height: 20 }
        }
      );
    });

    const { error: parsedError } = await supabase
      .from('parsed_data')
      .upsert(parsedDataEntries);

    if (parsedError) {
      console.error('❌ Parsed data error:', parsedError);
    } else {
      console.log('✅ Created', parsedDataEntries.length, 'parsed data entries');
    }

    // 3. Create Workspace
    console.log('\n3. 🏢 Creating Workspace...');
    const workspace = {
      id: workspaceId,
      name: 'Main Audit Workspace',
      description: 'Primary workspace for audit and compliance activities',
      created_by: userId,
      settings: {
        auto_backup: true,
        default_retention: '7_years',
        compliance_alerts: true,
        notification_preferences: ['email', 'dashboard']
      }
    };

    const { error: workspaceError } = await supabase
      .from('workspaces')
      .upsert([workspace]);

    if (workspaceError) {
      console.error('❌ Workspace error:', workspaceError);
    } else {
      console.log('✅ Created/updated workspace');
    }

    // 4. Create Collaborations (with correct field names)
    console.log('\n4. 👥 Creating Workspace Collaborations...');
    const collaborations = [
      {
        id: uuidv4(),
        workspace_id: workspaceId,
        user_id: userId,
        role: 'ADMIN',
        permissions: ['read', 'write', 'delete', 'admin']
      },
      {
        id: uuidv4(),
        workspace_id: workspaceId,
        user_id: 'reviewer@company.com',
        role: 'REVIEWER',
        permissions: ['read', 'comment', 'workflow']
      },
      {
        id: uuidv4(),
        workspace_id: workspaceId,
        user_id: 'auditor@company.com',
        role: 'AUDITOR',
        permissions: ['read', 'audit', 'compliance']
      }
    ];

    const { error: collabError } = await supabase
      .from('workspace_collaborations')
      .upsert(collaborations);

    if (collabError) {
      console.error('❌ Collaboration error:', collabError);
    } else {
      console.log('✅ Created', collaborations.length, 'collaborations');
    }

    // 5. Create Risk Assessments
    console.log('\n5. ⚠️ Creating Risk Assessments...');
    const riskAssessments = [];
    documents.forEach((doc) => {
      const riskLevels = ['LOW', 'MEDIUM', 'HIGH'];
      const riskCategories = ['FINANCIAL', 'OPERATIONAL', 'COMPLIANCE', 'SECURITY', 'STRATEGIC'];
      
      riskAssessments.push({
        id: uuidv4(),
        document_id: doc.id,
        risk_category: riskCategories[Math.floor(Math.random() * riskCategories.length)],
        risk_level: riskLevels[Math.floor(Math.random() * riskLevels.length)],
        risk_description: `Risk assessment for ${doc.filename} - Identified potential compliance and operational risks that require monitoring and mitigation.`,
        impact_score: Math.floor(Math.random() * 5) + 5, // 5-10
        likelihood_score: Math.floor(Math.random() * 5) + 3, // 3-8
        mitigation_measures: [
          'Regular compliance review',
          'Enhanced monitoring procedures',
          'Staff training and awareness',
          'Process documentation update'
        ],
        assessed_by: 'risk@company.com'
      });
    });

    const { error: riskError } = await supabase
      .from('risk_assessments')
      .upsert(riskAssessments);

    if (riskError) {
      console.error('❌ Risk assessments error:', riskError);
    } else {
      console.log('✅ Created', riskAssessments.length, 'risk assessments');
    }

    // 6. Create Review Comments
    console.log('\n6. 📝 Creating Review Comments...');
    const reviewComments = [];
    documents.slice(0, 3).forEach((doc) => {
      reviewComments.push({
        id: uuidv4(),
        document_id: doc.id,
        comment_text: `Comprehensive review completed for ${doc.filename}. All key metrics and compliance requirements have been verified. Document meets current standards and regulations.`,
        comment_type: 'REVIEW',
        created_by: 'reviewer@company.com'
      });
    });

    const { error: commentsError } = await supabase
      .from('review_comments')
      .upsert(reviewComments);

    if (commentsError) {
      console.error('❌ Review comments error:', commentsError);
    } else {
      console.log('✅ Created', reviewComments.length, 'review comments');
    }

    // 7. Create Audit Trail entries
    console.log('\n7. 📜 Creating Audit Trail...');
    const auditEntries = [];
    documents.forEach((doc) => {
      auditEntries.push({
        id: uuidv4(),
        user_id: userId,
        action: 'DOCUMENT_UPLOAD',
        resource_type: 'DOCUMENT',
        resource_id: doc.id,
        details: {
          filename: doc.filename,
          file_size: doc.file_size,
          tags: doc.tags,
          workspace: workspaceId
        },
        ip_address: '192.168.1.100',
        user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      });
    });

    const { error: auditError } = await supabase
      .from('audit_trail')
      .upsert(auditEntries);

    if (auditError) {
      console.error('❌ Audit trail error:', auditError);
    } else {
      console.log('✅ Created', auditEntries.length, 'audit entries');
    }

    console.log('\n🎉 SUCCESS! All tables populated with data for user:', userId);
    console.log('\n📊 Summary of created data:');
    console.log('   📄 Documents:', documents.length);
    console.log('   🔍 Parsed Data Entries:', parsedDataEntries.length);
    console.log('   🏢 Workspace: 1');
    console.log('   👥 Collaborations:', collaborations.length);
    console.log('   ⚠️  Risk Assessments:', riskAssessments.length);
    console.log('   📝 Review Comments:', reviewComments.length);
    console.log('   📜 Audit Entries:', auditEntries.length);

    console.log('\n🎯 This data will now appear in the dashboard for user:', userId);
    console.log('   ✅ Analytics tab will show real charts and data');
    console.log('   ✅ Risk Management will show assessments');
    console.log('   ✅ Workflow will show document processes');
    console.log('   ✅ Compliance will show audit information');

    return true;

  } catch (error) {
    console.error('❌ Error adding data:', error);
    return false;
  }
}

// Usage
const userId = process.argv[2] || 'demo-user-2024';
addDataForUser(userId).then((success) => {
  if (success) {
    console.log('\n✅ Data population completed successfully!');
    console.log('🚀 The dashboard should now show live data for this user');
  } else {
    console.log('\n❌ Data population failed');
  }
  process.exit(0);
});
