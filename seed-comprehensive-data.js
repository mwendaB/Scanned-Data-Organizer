const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function seedComprehensiveData() {
  console.log('🌱 Starting comprehensive data seeding...');

  try {
    // 1. Clear existing data for fresh start
    console.log('🧹 Clearing existing data...');
    const tablesToClear = [
      'audit_trail', 'financial_extractions', 'risk_assessments', 
      'review_comments', 'workflow_steps', 'workflow_instances',
      'compliance_checks', 'parsed_data', 'workspace_collaborations',
      'documents', 'workflows', 'workspaces', 'compliance_frameworks'
    ];

    for (const table of tablesToClear) {
      await supabase.from(table).delete().neq('id', '');
    }

    // 2. Insert Compliance Frameworks
    const frameworks = [
      {
        id: 'sox-2024',
        name: 'Sarbanes-Oxley Act 2024',
        description: 'Updated SOX compliance requirements for 2024',
        requirements: {
          audit_trail: 'required',
          data_retention: '7_years',
          digital_signature: 'required',
          internal_controls: 'section_302_404'
        },
        created_at: new Date('2024-01-01').toISOString()
      },
      {
        id: 'gdpr-2024',
        name: 'GDPR Compliance 2024',
        description: 'General Data Protection Regulation compliance framework',
        requirements: {
          data_protection: 'required',
          privacy_by_design: 'required',
          consent_management: 'explicit',
          breach_notification: '72_hours'
        },
        created_at: new Date('2024-01-01').toISOString()
      },
      {
        id: 'pcaob-2024',
        name: 'PCAOB Standards 2024',
        description: 'Public Company Accounting Oversight Board standards',
        requirements: {
          audit_documentation: 'as_2301',
          risk_assessment: 'as_2110',
          materiality: 'as_2105',
          independence: 'required'
        },
        created_at: new Date('2024-01-01').toISOString()
      },
      {
        id: 'iso27001-2024',
        name: 'ISO 27001:2022',
        description: 'Information Security Management System',
        requirements: {
          security_controls: '93_controls',
          risk_management: 'iso_31000',
          incident_response: 'required',
          business_continuity: 'required'
        },
        created_at: new Date('2024-01-01').toISOString()
      },
      {
        id: 'hipaa-2024',
        name: 'HIPAA Security Rule',
        description: 'Health Insurance Portability and Accountability Act',
        requirements: {
          phi_protection: 'required',
          access_controls: 'minimum_necessary',
          audit_logs: 'required',
          encryption: 'required'
        },
        created_at: new Date('2024-01-01').toISOString()
      }
    ];

    console.log('📋 Inserting compliance frameworks...');
    await supabase.from('compliance_frameworks').insert(frameworks);

    // 3. Insert Workspaces
    const workspaces = [
      {
        id: 'workspace-audit-dept',
        name: 'Audit Department',
        description: 'Internal audit team workspace for financial reviews',
        created_by: 'audit-manager@company.com',
        settings: {
          auto_backup: true,
          default_retention: '7_years',
          compliance_frameworks: ['sox-2024', 'pcaob-2024'],
          notifications: true
        },
        created_at: new Date('2024-01-15').toISOString()
      },
      {
        id: 'workspace-compliance',
        name: 'Compliance Office',
        description: 'Central compliance monitoring and reporting',
        created_by: 'compliance-officer@company.com',
        settings: {
          auto_backup: true,
          default_retention: '10_years',
          compliance_frameworks: ['gdpr-2024', 'hipaa-2024', 'iso27001-2024'],
          notifications: true
        },
        created_at: new Date('2024-01-20').toISOString()
      },
      {
        id: 'workspace-finance',
        name: 'Finance Team',
        description: 'Financial reporting and analysis workspace',
        created_by: 'cfo@company.com',
        settings: {
          auto_backup: true,
          default_retention: '7_years',
          compliance_frameworks: ['sox-2024'],
          notifications: false
        },
        created_at: new Date('2024-02-01').toISOString()
      },
      {
        id: 'workspace-security',
        name: 'Information Security',
        description: 'Security assessment and monitoring workspace',
        created_by: 'ciso@company.com',
        settings: {
          auto_backup: true,
          default_retention: '5_years',
          compliance_frameworks: ['iso27001-2024', 'gdpr-2024'],
          notifications: true
        },
        created_at: new Date('2024-02-05').toISOString()
      }
    ];

    console.log('🏢 Inserting workspaces...');
    await supabase.from('workspaces').insert(workspaces);

    // 4. Insert Documents
    const documents = [
      {
        id: 'doc-financial-q1-2024',
        filename: 'Q1_2024_Financial_Statement.pdf',
        file_path: '/uploads/financial/q1_2024_financial_statement.pdf',
        file_size: 2847362,
        mime_type: 'application/pdf',
        uploaded_by: 'finance-analyst@company.com',
        workspace_id: 'workspace-finance',
        tags: ['financial', 'quarterly', 'sox', 'revenue'],
        status: 'processed',
        ocr_confidence: 96.7,
        created_at: new Date('2024-03-15').toISOString()
      },
      {
        id: 'doc-compliance-report-2024',
        filename: 'Annual_Compliance_Report_2024.pdf',
        file_path: '/uploads/compliance/annual_compliance_report_2024.pdf',
        file_size: 1923847,
        mime_type: 'application/pdf',
        uploaded_by: 'compliance-officer@company.com',
        workspace_id: 'workspace-compliance',
        tags: ['compliance', 'annual', 'gdpr', 'sox', 'report'],
        status: 'processed',
        ocr_confidence: 94.2,
        created_at: new Date('2024-03-20').toISOString()
      },
      {
        id: 'doc-audit-findings-q1',
        filename: 'Internal_Audit_Findings_Q1_2024.docx',
        file_path: '/uploads/audit/internal_audit_findings_q1_2024.docx',
        file_size: 856421,
        mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        uploaded_by: 'senior-auditor@company.com',
        workspace_id: 'workspace-audit-dept',
        tags: ['audit', 'findings', 'internal', 'q1', 'recommendations'],
        status: 'processed',
        ocr_confidence: 91.8,
        created_at: new Date('2024-04-01').toISOString()
      },
      {
        id: 'doc-security-assessment',
        filename: 'ISO27001_Security_Assessment_2024.pdf',
        file_path: '/uploads/security/iso27001_security_assessment_2024.pdf',
        file_size: 3145728,
        mime_type: 'application/pdf',
        uploaded_by: 'security-analyst@company.com',
        workspace_id: 'workspace-security',
        tags: ['security', 'iso27001', 'assessment', 'controls'],
        status: 'processed',
        ocr_confidence: 98.1,
        created_at: new Date('2024-04-05').toISOString()
      },
      {
        id: 'doc-vendor-contract',
        filename: 'Vendor_Service_Agreement_2024.pdf',
        file_path: '/uploads/contracts/vendor_service_agreement_2024.pdf',
        file_size: 742635,
        mime_type: 'application/pdf',
        uploaded_by: 'procurement@company.com',
        workspace_id: 'workspace-compliance',
        tags: ['contract', 'vendor', 'gdpr', 'privacy'],
        status: 'processing',
        ocr_confidence: 89.4,
        created_at: new Date('2024-04-10').toISOString()
      },
      {
        id: 'doc-board-minutes',
        filename: 'Board_Meeting_Minutes_Q1_2024.pdf',
        file_path: '/uploads/governance/board_meeting_minutes_q1_2024.pdf',
        file_size: 645832,
        mime_type: 'application/pdf',
        uploaded_by: 'corporate-secretary@company.com',
        workspace_id: 'workspace-audit-dept',
        tags: ['governance', 'board', 'minutes', 'sox'],
        status: 'processed',
        ocr_confidence: 93.6,
        created_at: new Date('2024-04-12').toISOString()
      }
    ];

    console.log('📄 Inserting documents...');
    await supabase.from('documents').insert(documents);

    // 5. Insert Parsed Data
    const parsedData = [
      // Financial Statement Data
      {
        id: 'parsed-revenue-q1',
        document_id: 'doc-financial-q1-2024',
        field_name: 'total_revenue',
        field_value: '$2,847,500',
        confidence: 98.5,
        field_type: 'currency',
        page_number: 1,
        position: { x: 120, y: 450, width: 180, height: 25 },
        extracted_at: new Date('2024-03-15T10:30:00').toISOString()
      },
      {
        id: 'parsed-expenses-q1',
        document_id: 'doc-financial-q1-2024',
        field_name: 'total_expenses',
        field_value: '$1,923,200',
        confidence: 97.8,
        field_type: 'currency',
        page_number: 1,
        position: { x: 120, y: 485, width: 180, height: 25 },
        extracted_at: new Date('2024-03-15T10:30:00').toISOString()
      },
      {
        id: 'parsed-net-income-q1',
        document_id: 'doc-financial-q1-2024',
        field_name: 'net_income',
        field_value: '$924,300',
        confidence: 98.9,
        field_type: 'currency',
        page_number: 2,
        position: { x: 120, y: 520, width: 180, height: 25 },
        extracted_at: new Date('2024-03-15T10:30:00').toISOString()
      },
      // Compliance Report Data
      {
        id: 'parsed-compliance-score',
        document_id: 'doc-compliance-report-2024',
        field_name: 'overall_compliance_score',
        field_value: '94.7%',
        confidence: 96.2,
        field_type: 'percentage',
        page_number: 3,
        position: { x: 200, y: 150, width: 100, height: 20 },
        extracted_at: new Date('2024-03-20T14:15:00').toISOString()
      },
      {
        id: 'parsed-policy-count',
        document_id: 'doc-compliance-report-2024',
        field_name: 'policies_reviewed',
        field_value: '147',
        confidence: 95.1,
        field_type: 'number',
        page_number: 5,
        position: { x: 150, y: 300, width: 80, height: 20 },
        extracted_at: new Date('2024-03-20T14:15:00').toISOString()
      },
      // Audit Findings Data
      {
        id: 'parsed-findings-count',
        document_id: 'doc-audit-findings-q1',
        field_name: 'total_findings',
        field_value: '12',
        confidence: 94.8,
        field_type: 'number',
        page_number: 1,
        position: { x: 100, y: 200, width: 50, height: 18 },
        extracted_at: new Date('2024-04-01T09:45:00').toISOString()
      },
      {
        id: 'parsed-high-risk-findings',
        document_id: 'doc-audit-findings-q1',
        field_name: 'high_risk_findings',
        field_value: '3',
        confidence: 92.3,
        field_type: 'number',
        page_number: 2,
        position: { x: 100, y: 250, width: 30, height: 18 },
        extracted_at: new Date('2024-04-01T09:45:00').toISOString()
      },
      // Security Assessment Data
      {
        id: 'parsed-security-score',
        document_id: 'doc-security-assessment',
        field_name: 'security_maturity_score',
        field_value: '87.3%',
        confidence: 97.5,
        field_type: 'percentage',
        page_number: 4,
        position: { x: 180, y: 180, width: 120, height: 22 },
        extracted_at: new Date('2024-04-05T11:20:00').toISOString()
      }
    ];

    console.log('🔍 Inserting parsed data...');
    await supabase.from('parsed_data').insert(parsedData);

    // 6. Insert Workflows
    const workflows = [
      {
        id: 'workflow-financial-review',
        name: 'Financial Statement Review',
        description: 'Comprehensive review process for quarterly financial statements',
        workspace_id: 'workspace-audit-dept',
        created_by: 'audit-manager@company.com',
        steps: [
          { step: 1, name: 'Initial Review', role: 'senior_auditor', estimated_hours: 8 },
          { step: 2, name: 'Substantive Testing', role: 'audit_analyst', estimated_hours: 16 },
          { step: 3, name: 'Manager Review', role: 'audit_manager', estimated_hours: 4 },
          { step: 4, name: 'Partner Review', role: 'audit_partner', estimated_hours: 2 }
        ],
        is_active: true,
        created_at: new Date('2024-02-01').toISOString()
      },
      {
        id: 'workflow-compliance-check',
        name: 'Compliance Assessment Workflow',
        description: 'Standard workflow for compliance document review and assessment',
        workspace_id: 'workspace-compliance',
        created_by: 'compliance-officer@company.com',
        steps: [
          { step: 1, name: 'Document Classification', role: 'compliance_analyst', estimated_hours: 2 },
          { step: 2, name: 'Framework Mapping', role: 'compliance_analyst', estimated_hours: 4 },
          { step: 3, name: 'Gap Analysis', role: 'senior_compliance', estimated_hours: 6 },
          { step: 4, name: 'Risk Assessment', role: 'risk_manager', estimated_hours: 3 },
          { step: 5, name: 'Final Review', role: 'compliance_officer', estimated_hours: 2 }
        ],
        is_active: true,
        created_at: new Date('2024-02-05').toISOString()
      },
      {
        id: 'workflow-security-review',
        name: 'Security Document Review',
        description: 'Security assessment and control review workflow',
        workspace_id: 'workspace-security',
        created_by: 'ciso@company.com',
        steps: [
          { step: 1, name: 'Technical Review', role: 'security_analyst', estimated_hours: 6 },
          { step: 2, name: 'Control Testing', role: 'security_engineer', estimated_hours: 8 },
          { step: 3, name: 'Risk Evaluation', role: 'risk_analyst', estimated_hours: 4 },
          { step: 4, name: 'CISO Approval', role: 'ciso', estimated_hours: 1 }
        ],
        is_active: true,
        created_at: new Date('2024-02-10').toISOString()
      }
    ];

    console.log('🔄 Inserting workflows...');
    await supabase.from('workflows').insert(workflows);

    // 7. Insert Workflow Instances
    const workflowInstances = [
      {
        id: 'instance-financial-q1',
        workflow_id: 'workflow-financial-review',
        document_id: 'doc-financial-q1-2024',
        initiated_by: 'finance-analyst@company.com',
        current_step: 3,
        status: 'IN_PROGRESS',
        workflow_data: {
          priority: 'HIGH',
          deadline: '2024-04-30',
          materiality_threshold: 50000,
          assigned_team: ['senior-auditor@company.com', 'audit-analyst@company.com']
        },
        started_at: new Date('2024-03-16').toISOString(),
        created_at: new Date('2024-03-16').toISOString()
      },
      {
        id: 'instance-compliance-annual',
        workflow_id: 'workflow-compliance-check',
        document_id: 'doc-compliance-report-2024',
        initiated_by: 'compliance-officer@company.com',
        current_step: 5,
        status: 'COMPLETED',
        workflow_data: {
          priority: 'MEDIUM',
          deadline: '2024-04-15',
          frameworks: ['gdpr-2024', 'sox-2024'],
          assigned_team: ['compliance-analyst@company.com', 'senior-compliance@company.com']
        },
        started_at: new Date('2024-03-21').toISOString(),
        completed_at: new Date('2024-04-14').toISOString(),
        created_at: new Date('2024-03-21').toISOString()
      },
      {
        id: 'instance-audit-findings',
        workflow_id: 'workflow-financial-review',
        document_id: 'doc-audit-findings-q1',
        initiated_by: 'audit-manager@company.com',
        current_step: 4,
        status: 'IN_PROGRESS',
        workflow_data: {
          priority: 'HIGH',
          deadline: '2024-04-20',
          findings_severity: 'MEDIUM',
          assigned_team: ['senior-auditor@company.com']
        },
        started_at: new Date('2024-04-02').toISOString(),
        created_at: new Date('2024-04-02').toISOString()
      },
      {
        id: 'instance-security-assessment',
        workflow_id: 'workflow-security-review',
        document_id: 'doc-security-assessment',
        initiated_by: 'security-analyst@company.com',
        current_step: 2,
        status: 'IN_PROGRESS',
        workflow_data: {
          priority: 'HIGH',
          deadline: '2024-04-25',
          assessment_type: 'ISO27001',
          assigned_team: ['security-analyst@company.com', 'security-engineer@company.com']
        },
        started_at: new Date('2024-04-06').toISOString(),
        created_at: new Date('2024-04-06').toISOString()
      },
      {
        id: 'instance-vendor-contract',
        workflow_id: 'workflow-compliance-check',
        document_id: 'doc-vendor-contract',
        initiated_by: 'procurement@company.com',
        current_step: 1,
        status: 'PENDING',
        workflow_data: {
          priority: 'LOW',
          deadline: '2024-05-01',
          contract_value: 250000,
          assigned_team: ['compliance-analyst@company.com']
        },
        started_at: new Date('2024-04-11').toISOString(),
        created_at: new Date('2024-04-11').toISOString()
      }
    ];

    console.log('📋 Inserting workflow instances...');
    await supabase.from('workflow_instances').insert(workflowInstances);

    // 8. Insert Workflow Steps
    const workflowSteps = [
      // Financial Q1 workflow steps
      {
        id: 'step-financial-q1-1',
        workflow_instance_id: 'instance-financial-q1',
        step_number: 1,
        step_name: 'Initial Review',
        assigned_to: 'senior-auditor@company.com',
        assigned_role: 'senior_auditor',
        status: 'COMPLETED',
        started_at: new Date('2024-03-16T09:00:00').toISOString(),
        completed_at: new Date('2024-03-18T17:00:00').toISOString(),
        notes: 'Initial review completed. Revenue recognition appears appropriate.',
        created_at: new Date('2024-03-16').toISOString()
      },
      {
        id: 'step-financial-q1-2',
        workflow_instance_id: 'instance-financial-q1',
        step_number: 2,
        step_name: 'Substantive Testing',
        assigned_to: 'audit-analyst@company.com',
        assigned_role: 'audit_analyst',
        status: 'COMPLETED',
        started_at: new Date('2024-03-19T08:00:00').toISOString(),
        completed_at: new Date('2024-03-25T16:30:00').toISOString(),
        notes: 'Substantive testing completed. Minor adjustments required for depreciation.',
        created_at: new Date('2024-03-19').toISOString()
      },
      {
        id: 'step-financial-q1-3',
        workflow_instance_id: 'instance-financial-q1',
        step_number: 3,
        step_name: 'Manager Review',
        assigned_to: 'audit-manager@company.com',
        assigned_role: 'audit_manager',
        status: 'IN_PROGRESS',
        started_at: new Date('2024-03-26T09:00:00').toISOString(),
        notes: 'Manager review in progress. Reviewing substantive testing results.',
        created_at: new Date('2024-03-26').toISOString()
      },
      // Compliance workflow steps
      {
        id: 'step-compliance-1',
        workflow_instance_id: 'instance-compliance-annual',
        step_number: 1,
        step_name: 'Document Classification',
        assigned_to: 'compliance-analyst@company.com',
        assigned_role: 'compliance_analyst',
        status: 'COMPLETED',
        started_at: new Date('2024-03-21T10:00:00').toISOString(),
        completed_at: new Date('2024-03-21T16:00:00').toISOString(),
        notes: 'Document classified as annual compliance report covering GDPR and SOX.',
        created_at: new Date('2024-03-21').toISOString()
      },
      {
        id: 'step-compliance-5',
        workflow_instance_id: 'instance-compliance-annual',
        step_number: 5,
        step_name: 'Final Review',
        assigned_to: 'compliance-officer@company.com',
        assigned_role: 'compliance_officer',
        status: 'COMPLETED',
        started_at: new Date('2024-04-12T09:00:00').toISOString(),
        completed_at: new Date('2024-04-14T15:00:00').toISOString(),
        notes: 'Final review completed. Compliance assessment approved with high score.',
        created_at: new Date('2024-04-12').toISOString()
      },
      // Security assessment steps
      {
        id: 'step-security-1',
        workflow_instance_id: 'instance-security-assessment',
        step_number: 1,
        step_name: 'Technical Review',
        assigned_to: 'security-analyst@company.com',
        assigned_role: 'security_analyst',
        status: 'COMPLETED',
        started_at: new Date('2024-04-06T08:00:00').toISOString(),
        completed_at: new Date('2024-04-08T17:00:00').toISOString(),
        notes: 'Technical review completed. ISO 27001 controls assessment shows good maturity.',
        created_at: new Date('2024-04-06').toISOString()
      },
      {
        id: 'step-security-2',
        workflow_instance_id: 'instance-security-assessment',
        step_number: 2,
        step_name: 'Control Testing',
        assigned_to: 'security-engineer@company.com',
        assigned_role: 'security_engineer',
        status: 'IN_PROGRESS',
        started_at: new Date('2024-04-09T09:00:00').toISOString(),
        notes: 'Control testing in progress. Penetration testing scheduled for next week.',
        created_at: new Date('2024-04-09').toISOString()
      }
    ];

    console.log('👥 Inserting workflow steps...');
    await supabase.from('workflow_steps').insert(workflowSteps);

    // 9. Insert Compliance Checks
    const complianceChecks = [
      {
        id: 'check-sox-financial-q1',
        document_id: 'doc-financial-q1-2024',
        framework_id: 'sox-2024',
        check_name: 'SOX Financial Statement Compliance',
        status: 'PASSED',
        score: 96.8,
        details: {
          section_302: 'PASSED',
          section_404: 'PASSED',
          internal_controls: 'EFFECTIVE',
          management_assessment: 'COMPLIANT'
        },
        checked_by: 'audit-manager@company.com',
        checked_at: new Date('2024-03-25T14:30:00').toISOString(),
        created_at: new Date('2024-03-25').toISOString()
      },
      {
        id: 'check-gdpr-compliance-report',
        document_id: 'doc-compliance-report-2024',
        framework_id: 'gdpr-2024',
        check_name: 'GDPR Annual Compliance Review',
        status: 'PASSED',
        score: 94.7,
        details: {
          data_protection_impact: 'COMPLETED',
          privacy_by_design: 'IMPLEMENTED',
          consent_management: 'COMPLIANT',
          breach_procedures: 'ESTABLISHED'
        },
        checked_by: 'compliance-officer@company.com',
        checked_at: new Date('2024-04-14T11:15:00').toISOString(),
        created_at: new Date('2024-04-14').toISOString()
      },
      {
        id: 'check-iso27001-security',
        document_id: 'doc-security-assessment',
        framework_id: 'iso27001-2024',
        check_name: 'ISO 27001 Security Controls Assessment',
        status: 'IN_PROGRESS',
        score: 87.3,
        details: {
          information_security_policies: 'COMPLIANT',
          access_control: 'COMPLIANT',
          cryptography: 'NEEDS_IMPROVEMENT',
          physical_security: 'COMPLIANT'
        },
        checked_by: 'security-analyst@company.com',
        checked_at: new Date('2024-04-08T16:45:00').toISOString(),
        created_at: new Date('2024-04-08').toISOString()
      },
      {
        id: 'check-pcaob-audit-findings',
        document_id: 'doc-audit-findings-q1',
        framework_id: 'pcaob-2024',
        check_name: 'PCAOB Audit Documentation Standards',
        status: 'NEEDS_REVIEW',
        score: 78.5,
        details: {
          audit_documentation: 'NEEDS_IMPROVEMENT',
          risk_assessment: 'ADEQUATE',
          materiality: 'COMPLIANT',
          independence: 'COMPLIANT'
        },
        checked_by: 'senior-auditor@company.com',
        checked_at: new Date('2024-04-03T13:20:00').toISOString(),
        created_at: new Date('2024-04-03').toISOString()
      },
      {
        id: 'check-gdpr-vendor-contract',
        document_id: 'doc-vendor-contract',
        framework_id: 'gdpr-2024',
        check_name: 'GDPR Vendor Contract Review',
        status: 'PENDING',
        score: null,
        details: {
          data_processing_agreement: 'PENDING_REVIEW',
          privacy_clauses: 'PENDING_REVIEW',
          breach_notification: 'PENDING_REVIEW',
          data_transfer: 'PENDING_REVIEW'
        },
        checked_by: null,
        checked_at: null,
        created_at: new Date('2024-04-11').toISOString()
      }
    ];

    console.log('✅ Inserting compliance checks...');
    await supabase.from('compliance_checks').insert(complianceChecks);

    // 10. Insert Risk Assessments
    const riskAssessments = [
      {
        id: 'risk-financial-revenue',
        document_id: 'doc-financial-q1-2024',
        risk_category: 'FINANCIAL',
        risk_level: 'MEDIUM',
        risk_description: 'Revenue concentration risk - 65% revenue from top 3 clients',
        impact_score: 7.5,
        likelihood_score: 6.0,
        mitigation_plan: 'Diversify customer base, develop new market segments',
        assessed_by: 'risk-manager@company.com',
        assessed_at: new Date('2024-03-20T10:15:00').toISOString(),
        created_at: new Date('2024-03-20').toISOString()
      },
      {
        id: 'risk-compliance-gaps',
        document_id: 'doc-compliance-report-2024',
        risk_category: 'COMPLIANCE',
        risk_level: 'LOW',
        risk_description: 'Minor gaps in data retention policy documentation',
        impact_score: 3.5,
        likelihood_score: 4.0,
        mitigation_plan: 'Update documentation templates, schedule quarterly reviews',
        assessed_by: 'compliance-officer@company.com',
        assessed_at: new Date('2024-04-10T14:30:00').toISOString(),
        created_at: new Date('2024-04-10').toISOString()
      },
      {
        id: 'risk-audit-findings-high',
        document_id: 'doc-audit-findings-q1',
        risk_category: 'OPERATIONAL',
        risk_level: 'HIGH',
        risk_description: 'Internal control deficiencies in expense approval process',
        impact_score: 8.5,
        likelihood_score: 7.5,
        mitigation_plan: 'Implement automated approval workflows, enhance segregation of duties',
        assessed_by: 'audit-manager@company.com',
        assessed_at: new Date('2024-04-02T11:45:00').toISOString(),
        created_at: new Date('2024-04-02').toISOString()
      },
      {
        id: 'risk-security-cyber',
        document_id: 'doc-security-assessment',
        risk_category: 'SECURITY',
        risk_level: 'MEDIUM',
        risk_description: 'Outdated encryption protocols in legacy systems',
        impact_score: 8.0,
        likelihood_score: 5.5,
        mitigation_plan: 'Upgrade encryption standards, implement key rotation policies',
        assessed_by: 'ciso@company.com',
        assessed_at: new Date('2024-04-07T09:30:00').toISOString(),
        created_at: new Date('2024-04-07').toISOString()
      },
      {
        id: 'risk-vendor-dependency',
        document_id: 'doc-vendor-contract',
        risk_category: 'OPERATIONAL',
        risk_level: 'MEDIUM',
        risk_description: 'Single point of failure for critical cloud services',
        impact_score: 7.0,
        likelihood_score: 4.5,
        mitigation_plan: 'Identify backup vendors, establish business continuity procedures',
        assessed_by: 'risk-manager@company.com',
        assessed_at: new Date('2024-04-11T15:20:00').toISOString(),
        created_at: new Date('2024-04-11').toISOString()
      },
      {
        id: 'risk-board-governance',
        document_id: 'doc-board-minutes',
        risk_category: 'GOVERNANCE',
        risk_level: 'LOW',
        risk_description: 'Board meeting attendance below target for Q1',
        impact_score: 4.0,
        likelihood_score: 3.5,
        mitigation_plan: 'Improve meeting scheduling, implement virtual attendance options',
        assessed_by: 'governance-officer@company.com',
        assessed_at: new Date('2024-04-13T12:00:00').toISOString(),
        created_at: new Date('2024-04-13').toISOString()
      }
    ];

    console.log('⚠️ Inserting risk assessments...');
    await supabase.from('risk_assessments').insert(riskAssessments);

    // 11. Insert Financial Extractions
    const financialExtractions = [
      {
        id: 'extract-revenue-q1',
        document_id: 'doc-financial-q1-2024',
        extraction_type: 'REVENUE',
        amount: 2847500,
        currency: 'USD',
        period: 'Q1-2024',
        line_item: 'Total Revenue',
        confidence: 98.5,
        extracted_at: new Date('2024-03-15T10:30:00').toISOString(),
        created_at: new Date('2024-03-15').toISOString()
      },
      {
        id: 'extract-expenses-q1',
        document_id: 'doc-financial-q1-2024',
        extraction_type: 'EXPENSE',
        amount: 1923200,
        currency: 'USD',
        period: 'Q1-2024',
        line_item: 'Total Operating Expenses',
        confidence: 97.8,
        extracted_at: new Date('2024-03-15T10:32:00').toISOString(),
        created_at: new Date('2024-03-15').toISOString()
      },
      {
        id: 'extract-net-income-q1',
        document_id: 'doc-financial-q1-2024',
        extraction_type: 'PROFIT',
        amount: 924300,
        currency: 'USD',
        period: 'Q1-2024',
        line_item: 'Net Income',
        confidence: 98.9,
        extracted_at: new Date('2024-03-15T10:35:00').toISOString(),
        created_at: new Date('2024-03-15').toISOString()
      },
      {
        id: 'extract-assets-q1',
        document_id: 'doc-financial-q1-2024',
        extraction_type: 'ASSET',
        amount: 15742000,
        currency: 'USD',
        period: 'Q1-2024',
        line_item: 'Total Assets',
        confidence: 96.7,
        extracted_at: new Date('2024-03-15T10:38:00').toISOString(),
        created_at: new Date('2024-03-15').toISOString()
      },
      {
        id: 'extract-liabilities-q1',
        document_id: 'doc-financial-q1-2024',
        extraction_type: 'LIABILITY',
        amount: 8456000,
        currency: 'USD',
        period: 'Q1-2024',
        line_item: 'Total Liabilities',
        confidence: 95.3,
        extracted_at: new Date('2024-03-15T10:40:00').toISOString(),
        created_at: new Date('2024-03-15').toISOString()
      },
      {
        id: 'extract-compliance-cost',
        document_id: 'doc-compliance-report-2024',
        extraction_type: 'EXPENSE',
        amount: 347500,
        currency: 'USD',
        period: '2024',
        line_item: 'Annual Compliance Costs',
        confidence: 94.2,
        extracted_at: new Date('2024-03-20T14:20:00').toISOString(),
        created_at: new Date('2024-03-20').toISOString()
      },
      {
        id: 'extract-vendor-contract-value',
        document_id: 'doc-vendor-contract',
        extraction_type: 'REVENUE',
        amount: 250000,
        currency: 'USD',
        period: '2024-2025',
        line_item: 'Annual Contract Value',
        confidence: 89.4,
        extracted_at: new Date('2024-04-10T16:15:00').toISOString(),
        created_at: new Date('2024-04-10').toISOString()
      }
    ];

    console.log('💰 Inserting financial extractions...');
    await supabase.from('financial_extractions').insert(financialExtractions);

    // 12. Insert Review Comments
    const reviewComments = [
      {
        id: 'comment-revenue-q1-1',
        document_id: 'doc-financial-q1-2024',
        comment_text: 'Revenue recognition appears appropriate based on ASC 606 guidelines. Growth of 12% QoQ is positive.',
        comment_type: 'APPROVAL',
        reviewer: 'audit-manager@company.com',
        reviewer_role: 'AUDIT_MANAGER',
        created_at: new Date('2024-03-25T15:30:00').toISOString()
      },
      {
        id: 'comment-revenue-q1-2',
        document_id: 'doc-financial-q1-2024',
        comment_text: 'Please verify the depreciation calculation for new equipment purchases in Q1.',
        comment_type: 'QUESTION',
        reviewer: 'senior-auditor@company.com',
        reviewer_role: 'SENIOR_AUDITOR',
        created_at: new Date('2024-03-22T11:15:00').toISOString()
      },
      {
        id: 'comment-compliance-annual-1',
        document_id: 'doc-compliance-report-2024',
        comment_text: 'Excellent comprehensive coverage of all applicable frameworks. Compliance score of 94.7% exceeds target.',
        comment_type: 'APPROVAL',
        reviewer: 'compliance-officer@company.com',
        reviewer_role: 'COMPLIANCE_OFFICER',
        created_at: new Date('2024-04-14T16:45:00').toISOString()
      },
      {
        id: 'comment-audit-findings-1',
        document_id: 'doc-audit-findings-q1',
        comment_text: 'High-risk finding regarding expense approval process requires immediate attention and remediation plan.',
        comment_type: 'CONCERN',
        reviewer: 'audit-partner@company.com',
        reviewer_role: 'AUDIT_PARTNER',
        created_at: new Date('2024-04-04T09:20:00').toISOString()
      },
      {
        id: 'comment-security-assessment-1',
        document_id: 'doc-security-assessment',
        comment_text: 'Security maturity score shows good progress. Recommend prioritizing encryption upgrade project.',
        comment_type: 'RECOMMENDATION',
        reviewer: 'ciso@company.com',
        reviewer_role: 'CISO',
        created_at: new Date('2024-04-08T14:10:00').toISOString()
      },
      {
        id: 'comment-vendor-contract-1',
        document_id: 'doc-vendor-contract',
        comment_text: 'GDPR data processing clauses need review before contract execution. Schedule legal review.',
        comment_type: 'QUESTION',
        reviewer: 'legal-counsel@company.com',
        reviewer_role: 'LEGAL_COUNSEL',
        created_at: new Date('2024-04-11T10:30:00').toISOString()
      },
      {
        id: 'comment-board-minutes-1',
        document_id: 'doc-board-minutes',
        comment_text: 'Board decisions on compliance budget allocation are well documented and appropriate.',
        comment_type: 'APPROVAL',
        reviewer: 'corporate-secretary@company.com',
        reviewer_role: 'CORPORATE_SECRETARY',
        created_at: new Date('2024-04-13T13:45:00').toISOString()
      }
    ];

    console.log('💬 Inserting review comments...');
    await supabase.from('review_comments').insert(reviewComments);

    // 13. Insert Workspace Collaborations
    const workspaceCollaborations = [
      // Audit Department
      {
        id: 'collab-audit-1',
        workspace_id: 'workspace-audit-dept',
        user_id: 'audit-manager@company.com',
        role: 'ADMIN',
        permissions: ['read', 'write', 'delete', 'manage_users', 'workflow_manage'],
        joined_at: new Date('2024-01-15').toISOString(),
        created_at: new Date('2024-01-15').toISOString()
      },
      {
        id: 'collab-audit-2',
        workspace_id: 'workspace-audit-dept',
        user_id: 'senior-auditor@company.com',
        role: 'SENIOR_REVIEWER',
        permissions: ['read', 'write', 'comment', 'workflow_participate'],
        joined_at: new Date('2024-01-16').toISOString(),
        created_at: new Date('2024-01-16').toISOString()
      },
      {
        id: 'collab-audit-3',
        workspace_id: 'workspace-audit-dept',
        user_id: 'audit-analyst@company.com',
        role: 'REVIEWER',
        permissions: ['read', 'comment', 'workflow_participate'],
        joined_at: new Date('2024-01-20').toISOString(),
        created_at: new Date('2024-01-20').toISOString()
      },
      // Compliance Office
      {
        id: 'collab-compliance-1',
        workspace_id: 'workspace-compliance',
        user_id: 'compliance-officer@company.com',
        role: 'ADMIN',
        permissions: ['read', 'write', 'delete', 'manage_users', 'workflow_manage'],
        joined_at: new Date('2024-01-20').toISOString(),
        created_at: new Date('2024-01-20').toISOString()
      },
      {
        id: 'collab-compliance-2',
        workspace_id: 'workspace-compliance',
        user_id: 'compliance-analyst@company.com',
        role: 'REVIEWER',
        permissions: ['read', 'write', 'comment', 'workflow_participate'],
        joined_at: new Date('2024-01-22').toISOString(),
        created_at: new Date('2024-01-22').toISOString()
      },
      {
        id: 'collab-compliance-3',
        workspace_id: 'workspace-compliance',
        user_id: 'legal-counsel@company.com',
        role: 'SENIOR_REVIEWER',
        permissions: ['read', 'comment', 'workflow_participate'],
        joined_at: new Date('2024-02-01').toISOString(),
        created_at: new Date('2024-02-01').toISOString()
      },
      // Finance Team
      {
        id: 'collab-finance-1',
        workspace_id: 'workspace-finance',
        user_id: 'cfo@company.com',
        role: 'ADMIN',
        permissions: ['read', 'write', 'delete', 'manage_users'],
        joined_at: new Date('2024-02-01').toISOString(),
        created_at: new Date('2024-02-01').toISOString()
      },
      {
        id: 'collab-finance-2',
        workspace_id: 'workspace-finance',
        user_id: 'finance-analyst@company.com',
        role: 'CONTRIBUTOR',
        permissions: ['read', 'write', 'comment'],
        joined_at: new Date('2024-02-02').toISOString(),
        created_at: new Date('2024-02-02').toISOString()
      },
      // Security Team
      {
        id: 'collab-security-1',
        workspace_id: 'workspace-security',
        user_id: 'ciso@company.com',
        role: 'ADMIN',
        permissions: ['read', 'write', 'delete', 'manage_users', 'workflow_manage'],
        joined_at: new Date('2024-02-05').toISOString(),
        created_at: new Date('2024-02-05').toISOString()
      },
      {
        id: 'collab-security-2',
        workspace_id: 'workspace-security',
        user_id: 'security-analyst@company.com',
        role: 'CONTRIBUTOR',
        permissions: ['read', 'write', 'comment', 'workflow_participate'],
        joined_at: new Date('2024-02-06').toISOString(),
        created_at: new Date('2024-02-06').toISOString()
      },
      {
        id: 'collab-security-3',
        workspace_id: 'workspace-security',
        user_id: 'security-engineer@company.com',
        role: 'CONTRIBUTOR',
        permissions: ['read', 'write', 'comment', 'workflow_participate'],
        joined_at: new Date('2024-02-10').toISOString(),
        created_at: new Date('2024-02-10').toISOString()
      }
    ];

    console.log('🤝 Inserting workspace collaborations...');
    await supabase.from('workspace_collaborations').insert(workspaceCollaborations);

    // 14. Insert Audit Trail
    const auditTrail = [
      {
        id: 'audit-doc-upload-1',
        user_id: 'finance-analyst@company.com',
        action: 'DOCUMENT_UPLOAD',
        resource_type: 'DOCUMENT',
        resource_id: 'doc-financial-q1-2024',
        details: {
          filename: 'Q1_2024_Financial_Statement.pdf',
          file_size: 2847362,
          workspace: 'workspace-finance'
        },
        ip_address: '192.168.1.100',
        user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        created_at: new Date('2024-03-15T08:45:00').toISOString()
      },
      {
        id: 'audit-workflow-start-1',
        user_id: 'finance-analyst@company.com',
        action: 'WORKFLOW_START',
        resource_type: 'WORKFLOW_INSTANCE',
        resource_id: 'instance-financial-q1',
        details: {
          workflow_name: 'Financial Statement Review',
          document: 'Q1_2024_Financial_Statement.pdf',
          priority: 'HIGH'
        },
        ip_address: '192.168.1.100',
        user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        created_at: new Date('2024-03-16T09:00:00').toISOString()
      },
      {
        id: 'audit-compliance-check-1',
        user_id: 'audit-manager@company.com',
        action: 'COMPLIANCE_CHECK',
        resource_type: 'COMPLIANCE_CHECK',
        resource_id: 'check-sox-financial-q1',
        details: {
          framework: 'SOX 2024',
          result: 'PASSED',
          score: 96.8
        },
        ip_address: '192.168.1.101',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        created_at: new Date('2024-03-25T14:30:00').toISOString()
      },
      {
        id: 'audit-risk-assessment-1',
        user_id: 'risk-manager@company.com',
        action: 'RISK_ASSESSMENT',
        resource_type: 'RISK_ASSESSMENT',
        resource_id: 'risk-financial-revenue',
        details: {
          risk_category: 'FINANCIAL',
          risk_level: 'MEDIUM',
          impact_score: 7.5
        },
        ip_address: '192.168.1.102',
        user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        created_at: new Date('2024-03-20T10:15:00').toISOString()
      },
      {
        id: 'audit-doc-upload-2',
        user_id: 'compliance-officer@company.com',
        action: 'DOCUMENT_UPLOAD',
        resource_type: 'DOCUMENT',
        resource_id: 'doc-compliance-report-2024',
        details: {
          filename: 'Annual_Compliance_Report_2024.pdf',
          file_size: 1923847,
          workspace: 'workspace-compliance'
        },
        ip_address: '192.168.1.103',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        created_at: new Date('2024-03-20T13:20:00').toISOString()
      },
      {
        id: 'audit-workflow-complete-1',
        user_id: 'compliance-officer@company.com',
        action: 'WORKFLOW_COMPLETE',
        resource_type: 'WORKFLOW_INSTANCE',
        resource_id: 'instance-compliance-annual',
        details: {
          workflow_name: 'Compliance Assessment Workflow',
          duration_hours: 168,
          final_status: 'COMPLETED'
        },
        ip_address: '192.168.1.103',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        created_at: new Date('2024-04-14T15:00:00').toISOString()
      },
      {
        id: 'audit-comment-add-1',
        user_id: 'senior-auditor@company.com',
        action: 'COMMENT_ADD',
        resource_type: 'REVIEW_COMMENT',
        resource_id: 'comment-revenue-q1-2',
        details: {
          document: 'Q1_2024_Financial_Statement.pdf',
          comment_type: 'QUESTION',
          content_preview: 'Please verify the depreciation calculation...'
        },
        ip_address: '192.168.1.104',
        user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        created_at: new Date('2024-03-22T11:15:00').toISOString()
      },
      {
        id: 'audit-doc-upload-3',
        user_id: 'senior-auditor@company.com',
        action: 'DOCUMENT_UPLOAD',
        resource_type: 'DOCUMENT',
        resource_id: 'doc-audit-findings-q1',
        details: {
          filename: 'Internal_Audit_Findings_Q1_2024.docx',
          file_size: 856421,
          workspace: 'workspace-audit-dept'
        },
        ip_address: '192.168.1.104',
        user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        created_at: new Date('2024-04-01T08:30:00').toISOString()
      },
      {
        id: 'audit-security-upload-1',
        user_id: 'security-analyst@company.com',
        action: 'DOCUMENT_UPLOAD',
        resource_type: 'DOCUMENT',
        resource_id: 'doc-security-assessment',
        details: {
          filename: 'ISO27001_Security_Assessment_2024.pdf',
          file_size: 3145728,
          workspace: 'workspace-security'
        },
        ip_address: '192.168.1.105',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        created_at: new Date('2024-04-05T10:00:00').toISOString()
      },
      {
        id: 'audit-workspace-join-1',
        user_id: 'legal-counsel@company.com',
        action: 'WORKSPACE_JOIN',
        resource_type: 'WORKSPACE',
        resource_id: 'workspace-compliance',
        details: {
          workspace_name: 'Compliance Office',
          role: 'SENIOR_REVIEWER',
          invited_by: 'compliance-officer@company.com'
        },
        ip_address: '192.168.1.106',
        user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        created_at: new Date('2024-02-01T14:20:00').toISOString()
      }
    ];

    console.log('🔍 Inserting audit trail...');
    await supabase.from('audit_trail').insert(auditTrail);

    console.log('✅ Comprehensive data seeding completed successfully!');
    console.log('\n📊 Summary of seeded data:');
    console.log(`- ${frameworks.length} compliance frameworks`);
    console.log(`- ${workspaces.length} workspaces`);
    console.log(`- ${documents.length} documents`);
    console.log(`- ${parsedData.length} parsed data entries`);
    console.log(`- ${workflows.length} workflows`);
    console.log(`- ${workflowInstances.length} workflow instances`);
    console.log(`- ${workflowSteps.length} workflow steps`);
    console.log(`- ${complianceChecks.length} compliance checks`);
    console.log(`- ${riskAssessments.length} risk assessments`);
    console.log(`- ${financialExtractions.length} financial extractions`);
    console.log(`- ${reviewComments.length} review comments`);
    console.log(`- ${workspaceCollaborations.length} workspace collaborations`);
    console.log(`- ${auditTrail.length} audit trail entries`);

  } catch (error) {
    console.error('❌ Error seeding data:', error);
    throw error;
  }
}

// Run the seeding function
seedComprehensiveData()
  .then(() => {
    console.log('🎉 Database seeding completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Seeding failed:', error);
    process.exit(1);
  });
