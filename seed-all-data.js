const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function seedAllData() {
  console.log('🌱 Starting comprehensive data seeding...\n')

  try {
    // Create a test user (in a real app, this would be handled by auth)
    const testUserId = 'test-user-123'
    
    // 1. SEED WORKSPACES
    console.log('📁 Seeding Workspaces...')
    const { data: workspaces, error: workspaceError } = await supabase
      .from('workspaces')
      .insert([
        {
          id: 'workspace-1',
          name: 'Audit Department',
          description: 'Main audit and compliance workspace',
          created_by: testUserId,
          settings: {
            default_retention: '7_years',
            auto_backup: true,
            compliance_frameworks: ['SOX', 'PCAOB', 'GDPR']
          }
        },
        {
          id: 'workspace-2',
          name: 'Financial Review',
          description: 'Financial document review workspace',
          created_by: testUserId,
          settings: {
            default_retention: '10_years',
            auto_backup: true,
            compliance_frameworks: ['SOX', 'GAAP']
          }
        }
      ])
      .select()

    if (workspaceError) {
      console.warn('Workspaces may already exist:', workspaceError.message)
    } else {
      console.log('✅ Workspaces created:', workspaces?.length || 0)
    }

    // 2. SEED DOCUMENTS
    console.log('\n📄 Seeding Documents...')
    const documents = [
      {
        id: 'doc-1',
        filename: 'Financial_Statement_Q1_2024.pdf',
        file_path: '/uploads/financial_statement_q1_2024.pdf',
        file_size: 2048576,
        mime_type: 'application/pdf',
        uploaded_by: testUserId,
        workspace_id: 'workspace-1',
        ocr_text: 'FINANCIAL STATEMENT Q1 2024\n\nRevenue: $1,250,000\nExpenses: $850,000\nNet Income: $400,000\n\nCash Flow Analysis:\nOperating Activities: $320,000\nInvesting Activities: ($50,000)\nFinancing Activities: ($75,000)',
        metadata: {
          pages: 15,
          confidence: 0.94,
          language: 'en'
        },
        tags: ['financial', 'quarterly', 'revenue', 'Q1-2024'],
        status: 'processed'
      },
      {
        id: 'doc-2',
        filename: 'Compliance_Report_2024.pdf',
        file_path: '/uploads/compliance_report_2024.pdf',
        file_size: 1536000,
        mime_type: 'application/pdf',
        uploaded_by: testUserId,
        workspace_id: 'workspace-1',
        ocr_text: 'COMPLIANCE REPORT 2024\n\nSOX Compliance Status: 95% Complete\nGDPR Compliance: Fully Implemented\nData Retention Policies: Updated\nAudit Trail: Complete\n\nOutstanding Items:\n- Digital signature implementation\n- Third-party vendor assessments',
        metadata: {
          pages: 32,
          confidence: 0.91,
          language: 'en'
        },
        tags: ['compliance', 'SOX', 'GDPR', 'audit', '2024'],
        status: 'processed'
      },
      {
        id: 'doc-3',
        filename: 'Bank_Reconciliation_March_2024.xlsx',
        file_path: '/uploads/bank_reconciliation_march_2024.xlsx',
        file_size: 524288,
        mime_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        uploaded_by: testUserId,
        workspace_id: 'workspace-2',
        ocr_text: 'BANK RECONCILIATION - MARCH 2024\n\nBank Balance: $125,750.00\nBook Balance: $123,890.00\nOutstanding Checks: $2,860.00\nDeposits in Transit: $1,000.00\n\nReconciled Balance: $125,750.00',
        metadata: {
          sheets: 3,
          confidence: 0.98,
          language: 'en'
        },
        tags: ['banking', 'reconciliation', 'March-2024', 'financial'],
        status: 'processed'
      },
      {
        id: 'doc-4',
        filename: 'Internal_Audit_Findings_Q1.pdf',
        file_path: '/uploads/internal_audit_findings_q1.pdf',
        file_size: 3072000,
        mime_type: 'application/pdf',
        uploaded_by: testUserId,
        workspace_id: 'workspace-1',
        ocr_text: 'INTERNAL AUDIT FINDINGS Q1 2024\n\nHigh Risk Items:\n1. Inadequate segregation of duties in AP\n2. Missing approval signatures on contracts >$50K\n\nMedium Risk Items:\n1. Outdated password policies\n2. Incomplete vendor onboarding documentation\n\nRecommendations:\n- Implement dual approval process\n- Update IT security policies',
        metadata: {
          pages: 28,
          confidence: 0.89,
          language: 'en'
        },
        tags: ['audit', 'findings', 'risk', 'Q1-2024', 'internal'],
        status: 'processed'
      },
      {
        id: 'doc-5',
        filename: 'Contract_Review_ABC_Corp.pdf',
        file_path: '/uploads/contract_review_abc_corp.pdf',
        file_size: 1024000,
        mime_type: 'application/pdf',
        uploaded_by: testUserId,
        workspace_id: 'workspace-2',
        ocr_text: 'CONTRACT REVIEW - ABC CORPORATION\n\nContract Value: $500,000\nTerm: 3 years\nPayment Terms: Net 30\n\nKey Clauses:\n- Termination: 90-day notice\n- Liability Cap: $1,000,000\n- Data Protection: GDPR compliant\n\nReview Status: Approved with minor modifications',
        metadata: {
          pages: 12,
          confidence: 0.92,
          language: 'en'
        },
        tags: ['contract', 'legal', 'ABC-Corp', 'approved'],
        status: 'processed'
      }
    ]

    const { data: insertedDocs, error: docError } = await supabase
      .from('documents')
      .insert(documents)
      .select()

    if (docError) {
      console.warn('Documents may already exist:', docError.message)
    } else {
      console.log('✅ Documents created:', insertedDocs?.length || 0)
    }

    // 3. SEED PARSED DATA
    console.log('\n🔍 Seeding Parsed Data...')
    const parsedDataEntries = [
      {
        document_id: 'doc-1',
        field_name: 'revenue',
        field_value: '$1,250,000',
        confidence: 0.95,
        field_type: 'currency',
        page_number: 1,
        coordinates: { x: 100, y: 200, width: 150, height: 20 }
      },
      {
        document_id: 'doc-1',
        field_name: 'net_income',
        field_value: '$400,000',
        confidence: 0.94,
        field_type: 'currency',
        page_number: 1,
        coordinates: { x: 100, y: 250, width: 120, height: 20 }
      },
      {
        document_id: 'doc-3',
        field_name: 'bank_balance',
        field_value: '$125,750.00',
        confidence: 0.98,
        field_type: 'currency',
        page_number: 1,
        coordinates: { x: 200, y: 100, width: 130, height: 18 }
      },
      {
        document_id: 'doc-5',
        field_name: 'contract_value',
        field_value: '$500,000',
        confidence: 0.92,
        field_type: 'currency',
        page_number: 1,
        coordinates: { x: 150, y: 180, width: 100, height: 20 }
      }
    ]

    const { data: parsedData, error: parsedError } = await supabase
      .from('parsed_data')
      .insert(parsedDataEntries)
      .select()

    if (parsedError) {
      console.warn('Parsed data may already exist:', parsedError.message)
    } else {
      console.log('✅ Parsed data entries created:', parsedData?.length || 0)
    }

    // 4. SEED COMPLIANCE FRAMEWORKS
    console.log('\n📋 Seeding Compliance Frameworks...')
    const frameworks = [
      {
        id: 'framework-sox',
        name: 'SOX',
        description: 'Sarbanes-Oxley Act Compliance',
        requirements: {
          data_retention: '7_years',
          audit_trail: 'required',
          digital_signatures: 'recommended',
          segregation_of_duties: 'required'
        },
        is_active: true
      },
      {
        id: 'framework-gdpr',
        name: 'GDPR',
        description: 'General Data Protection Regulation',
        requirements: {
          consent_tracking: 'required',
          data_portability: 'required',
          right_to_erasure: 'required',
          privacy_by_design: 'required'
        },
        is_active: true
      },
      {
        id: 'framework-pcaob',
        name: 'PCAOB Standards',
        description: 'Public Company Accounting Oversight Board',
        requirements: {
          workpaper_documentation: 'required',
          independence_verification: 'required',
          quality_control: 'required',
          risk_assessment: 'required'
        },
        is_active: true
      },
      {
        id: 'framework-iso27001',
        name: 'ISO 27001',
        description: 'Information Security Management',
        requirements: {
          access_control: 'required',
          encryption: 'required',
          audit_logging: 'required',
          incident_response: 'required'
        },
        is_active: true
      }
    ]

    const { data: insertedFrameworks, error: frameworkError } = await supabase
      .from('compliance_frameworks')
      .insert(frameworks)
      .select()

    if (frameworkError) {
      console.warn('Frameworks may already exist:', frameworkError.message)
    } else {
      console.log('✅ Compliance frameworks created:', insertedFrameworks?.length || 0)
    }

    // 5. SEED COMPLIANCE CHECKS
    console.log('\n✅ Seeding Compliance Checks...')
    const complianceChecks = [
      {
        document_id: 'doc-1',
        framework_id: 'framework-sox',
        check_name: 'Financial Statement SOX Compliance',
        status: 'PASSED',
        score: 95,
        details: {
          audit_trail: 'present',
          data_retention: 'compliant',
          digital_signatures: 'pending',
          overall_assessment: 'Strong compliance with minor improvements needed'
        }
      },
      {
        document_id: 'doc-2',
        framework_id: 'framework-gdpr',
        status: 'PASSED',
        check_name: 'GDPR Compliance Verification',
        score: 92,
        details: {
          consent_tracking: 'implemented',
          data_portability: 'available',
          right_to_erasure: 'implemented',
          privacy_policy: 'updated'
        }
      },
      {
        document_id: 'doc-3',
        framework_id: 'framework-sox',
        check_name: 'Bank Reconciliation SOX Review',
        status: 'PASSED',
        score: 88,
        details: {
          segregation_of_duties: 'adequate',
          approval_process: 'documented',
          audit_trail: 'complete'
        }
      },
      {
        document_id: 'doc-4',
        framework_id: 'framework-pcaob',
        check_name: 'Internal Audit PCAOB Standards',
        status: 'MANUAL_REVIEW',
        score: 75,
        details: {
          workpaper_quality: 'good',
          risk_assessment: 'comprehensive',
          documentation: 'needs_improvement'
        }
      },
      {
        document_id: 'doc-5',
        framework_id: 'framework-iso27001',
        check_name: 'Contract Security Review',
        status: 'PASSED',
        score: 97,
        details: {
          access_control: 'defined',
          data_protection: 'compliant',
          security_clauses: 'present'
        }
      }
    ]

    const { data: checks, error: checkError } = await supabase
      .from('compliance_checks')
      .insert(complianceChecks)
      .select()

    if (checkError) {
      console.warn('Compliance checks may already exist:', checkError.message)
    } else {
      console.log('✅ Compliance checks created:', checks?.length || 0)
    }

    // 6. SEED WORKFLOWS
    console.log('\n🔄 Seeding Workflows...')
    const workflows = [
      {
        id: 'workflow-audit-review',
        name: 'Standard Audit Review',
        description: 'Standard workflow for document audit and review process',
        workspace_id: 'workspace-1',
        created_by: testUserId,
        workflow_config: {
          steps: [
            { step: 1, name: 'Initial Review', role: 'reviewer', required: true },
            { step: 2, name: 'Risk Assessment', role: 'risk_analyst', required: true },
            { step: 3, name: 'Senior Partner Approval', role: 'senior_partner', required: true }
          ],
          auto_assign: true,
          due_date_days: 7
        },
        is_active: true
      },
      {
        id: 'workflow-compliance-check',
        name: 'Compliance Verification',
        description: 'Compliance verification workflow for regulatory documents',
        workspace_id: 'workspace-1',
        created_by: testUserId,
        workflow_config: {
          steps: [
            { step: 1, name: 'Compliance Scan', role: 'compliance_officer', required: true },
            { step: 2, name: 'Legal Review', role: 'legal_counsel', required: false },
            { step: 3, name: 'Final Approval', role: 'compliance_manager', required: true }
          ],
          auto_assign: false,
          due_date_days: 5
        },
        is_active: true
      }
    ]

    const { data: workflowData, error: workflowError } = await supabase
      .from('workflows')
      .insert(workflows)
      .select()

    if (workflowError) {
      console.warn('Workflows may already exist:', workflowError.message)
    } else {
      console.log('✅ Workflows created:', workflowData?.length || 0)
    }

    // 7. SEED WORKFLOW INSTANCES
    console.log('\n📋 Seeding Workflow Instances...')
    const workflowInstances = [
      {
        id: 'instance-1',
        workflow_id: 'workflow-audit-review',
        document_id: 'doc-1',
        initiated_by: testUserId,
        current_step: 2,
        status: 'IN_PROGRESS',
        workflow_data: {
          priority: 'high',
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        },
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'instance-2',
        workflow_id: 'workflow-compliance-check',
        document_id: 'doc-2',
        initiated_by: testUserId,
        current_step: 3,
        status: 'IN_PROGRESS',
        workflow_data: {
          priority: 'medium',
          frameworks: ['SOX', 'GDPR']
        },
        due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'instance-3',
        workflow_id: 'workflow-audit-review',
        document_id: 'doc-4',
        initiated_by: testUserId,
        current_step: 1,
        status: 'PENDING',
        workflow_data: {
          priority: 'high',
          risk_level: 'high'
        },
        due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]

    const { data: instances, error: instanceError } = await supabase
      .from('workflow_instances')
      .insert(workflowInstances)
      .select()

    if (instanceError) {
      console.warn('Workflow instances may already exist:', instanceError.message)
    } else {
      console.log('✅ Workflow instances created:', instances?.length || 0)
    }

    // 8. SEED WORKFLOW STEPS
    console.log('\n👥 Seeding Workflow Steps...')
    const workflowSteps = [
      {
        workflow_instance_id: 'instance-1',
        step_number: 1,
        step_name: 'Initial Review',
        assigned_to: 'reviewer@company.com',
        status: 'COMPLETED',
        action_required: 'Review document for completeness and accuracy',
        comments: 'Document reviewed. All required sections present. Minor formatting issues noted.',
        completed_by: 'reviewer@company.com',
        started_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        completed_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        workflow_instance_id: 'instance-1',
        step_number: 2,
        step_name: 'Risk Assessment',
        assigned_to: 'risk.analyst@company.com',
        status: 'IN_PROGRESS',
        action_required: 'Perform comprehensive risk analysis and identify any compliance concerns',
        started_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        workflow_instance_id: 'instance-1',
        step_number: 3,
        step_name: 'Senior Partner Approval',
        assigned_role: 'senior_partner',
        status: 'PENDING',
        action_required: 'Final review and approval sign-off',
        due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        workflow_instance_id: 'instance-2',
        step_number: 1,
        step_name: 'Compliance Scan',
        assigned_to: 'compliance@company.com',
        status: 'COMPLETED',
        action_required: 'Automated and manual compliance verification',
        comments: 'All compliance checks passed. SOX and GDPR requirements met.',
        completed_by: 'compliance@company.com',
        started_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        completed_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        workflow_instance_id: 'instance-2',
        step_number: 2,
        step_name: 'Legal Review',
        assigned_to: 'legal@company.com',
        status: 'COMPLETED',
        action_required: 'Review legal implications and regulatory compliance',
        comments: 'Legal review complete. No issues identified.',
        completed_by: 'legal@company.com',
        started_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        completed_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        workflow_instance_id: 'instance-2',
        step_number: 3,
        step_name: 'Final Approval',
        assigned_to: 'compliance.manager@company.com',
        status: 'IN_PROGRESS',
        action_required: 'Final compliance approval and sign-off',
        started_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        due_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]

    const { data: steps, error: stepError } = await supabase
      .from('workflow_steps')
      .insert(workflowSteps)
      .select()

    if (stepError) {
      console.warn('Workflow steps may already exist:', stepError.message)
    } else {
      console.log('✅ Workflow steps created:', steps?.length || 0)
    }

    // 9. SEED REVIEW COMMENTS
    console.log('\n💬 Seeding Review Comments...')
    const reviewComments = [
      {
        document_id: 'doc-1',
        comment_text: 'Revenue figures look accurate and well-documented. Please verify the Q1 growth calculation methodology.',
        comment_type: 'QUESTION',
        priority: 'MEDIUM',
        created_by: testUserId,
        workflow_step_id: null
      },
      {
        document_id: 'doc-1',
        comment_text: 'Expense categorization follows GAAP standards. All supporting documentation is present.',
        comment_type: 'APPROVAL',
        priority: 'LOW',
        created_by: testUserId,
        workflow_step_id: null
      },
      {
        document_id: 'doc-4',
        comment_text: 'High risk findings require immediate attention. Recommend implementing dual approval process by end of quarter.',
        comment_type: 'CONCERN',
        priority: 'HIGH',
        created_by: testUserId,
        workflow_step_id: null
      },
      {
        document_id: 'doc-2',
        comment_text: 'Compliance report is comprehensive. Digital signature implementation timeline needs clarification.',
        comment_type: 'GENERAL',
        priority: 'MEDIUM',
        created_by: testUserId,
        workflow_step_id: null
      }
    ]

    const { data: comments, error: commentError } = await supabase
      .from('review_comments')
      .insert(reviewComments)
      .select()

    if (commentError) {
      console.warn('Review comments may already exist:', commentError.message)
    } else {
      console.log('✅ Review comments created:', comments?.length || 0)
    }

    // 10. SEED RISK ASSESSMENTS
    console.log('\n⚠️ Seeding Risk Assessments...')
    const riskAssessments = [
      {
        document_id: 'doc-1',
        risk_category: 'FINANCIAL',
        risk_level: 'MEDIUM',
        risk_description: 'Revenue concentration risk - 60% of revenue from top 3 clients',
        likelihood: 'MEDIUM',
        impact: 'HIGH',
        mitigation_plan: 'Diversify client base, implement client retention programs',
        assigned_to: testUserId,
        due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'OPEN'
      },
      {
        document_id: 'doc-4',
        risk_category: 'OPERATIONAL',
        risk_level: 'HIGH',
        risk_description: 'Inadequate segregation of duties in accounts payable process',
        likelihood: 'HIGH',
        impact: 'HIGH',
        mitigation_plan: 'Implement dual approval process, update SOD matrix, provide training',
        assigned_to: testUserId,
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'IN_PROGRESS'
      },
      {
        document_id: 'doc-2',
        risk_category: 'COMPLIANCE',
        risk_level: 'LOW',
        risk_description: 'Pending digital signature implementation for full SOX compliance',
        likelihood: 'LOW',
        impact: 'MEDIUM',
        mitigation_plan: 'Complete digital signature system implementation by Q2',
        assigned_to: testUserId,
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'OPEN'
      },
      {
        document_id: 'doc-5',
        risk_category: 'FRAUD',
        risk_level: 'LOW',
        risk_description: 'Contract approval process lacks secondary verification',
        likelihood: 'LOW',
        impact: 'MEDIUM',
        mitigation_plan: 'Implement secondary approval for contracts >$100K',
        assigned_to: testUserId,
        due_date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'OPEN'
      }
    ]

    const { data: risks, error: riskError } = await supabase
      .from('risk_assessments')
      .insert(riskAssessments)
      .select()

    if (riskError) {
      console.warn('Risk assessments may already exist:', riskError.message)
    } else {
      console.log('✅ Risk assessments created:', risks?.length || 0)
    }

    // 11. SEED FINANCIAL EXTRACTIONS
    console.log('\n💰 Seeding Financial Extractions...')
    const financialExtractions = [
      {
        document_id: 'doc-1',
        extraction_type: 'REVENUE',
        amount: 1250000.00,
        currency: 'USD',
        period: 'Q1-2024',
        line_item: 'Total Revenue',
        confidence: 0.95,
        verification_status: 'VERIFIED',
        extraction_details: {
          page: 1,
          coordinates: { x: 100, y: 200 },
          method: 'OCR_ENHANCED'
        }
      },
      {
        document_id: 'doc-1',
        extraction_type: 'EXPENSE',
        amount: 850000.00,
        currency: 'USD',
        period: 'Q1-2024',
        line_item: 'Total Expenses',
        confidence: 0.94,
        verification_status: 'VERIFIED',
        extraction_details: {
          page: 1,
          coordinates: { x: 100, y: 220 },
          method: 'OCR_ENHANCED'
        }
      },
      {
        document_id: 'doc-3',
        extraction_type: 'ASSET',
        amount: 125750.00,
        currency: 'USD',
        period: 'March-2024',
        line_item: 'Bank Balance',
        confidence: 0.98,
        verification_status: 'VERIFIED',
        extraction_details: {
          page: 1,
          coordinates: { x: 200, y: 100 },
          method: 'OCR_DIRECT'
        }
      },
      {
        document_id: 'doc-5',
        extraction_type: 'LIABILITY',
        amount: 500000.00,
        currency: 'USD',
        period: '2024-2027',
        line_item: 'Contract Obligation',
        confidence: 0.92,
        verification_status: 'PENDING_REVIEW',
        extraction_details: {
          page: 1,
          coordinates: { x: 150, y: 180 },
          method: 'OCR_ENHANCED'
        }
      }
    ]

    const { data: extractions, error: extractionError } = await supabase
      .from('financial_extractions')
      .insert(financialExtractions)
      .select()

    if (extractionError) {
      console.warn('Financial extractions may already exist:', extractionError.message)
    } else {
      console.log('✅ Financial extractions created:', extractions?.length || 0)
    }

    // 12. SEED AUDIT TRAIL
    console.log('\n📊 Seeding Audit Trail...')
    const auditEntries = [
      {
        user_id: testUserId,
        action: 'DOCUMENT_UPLOAD',
        resource_type: 'DOCUMENT',
        resource_id: 'doc-1',
        details: {
          filename: 'Financial_Statement_Q1_2024.pdf',
          workspace: 'Audit Department',
          file_size: 2048576
        },
        ip_address: '192.168.1.100',
        user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        session_id: 'session-123',
        workspace_id: 'workspace-1'
      },
      {
        user_id: testUserId,
        action: 'WORKFLOW_START',
        resource_type: 'WORKFLOW',
        resource_id: 'instance-1',
        details: {
          workflow_name: 'Standard Audit Review',
          document: 'Financial_Statement_Q1_2024.pdf',
          assigned_reviewers: ['reviewer@company.com', 'risk.analyst@company.com']
        },
        ip_address: '192.168.1.100',
        user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        session_id: 'session-123',
        workspace_id: 'workspace-1'
      },
      {
        user_id: testUserId,
        action: 'COMPLIANCE_CHECK',
        resource_type: 'COMPLIANCE',
        resource_id: 'doc-2',
        details: {
          framework: 'GDPR',
          result: 'PASSED',
          score: 92,
          findings: ['Consent tracking implemented', 'Data portability available']
        },
        ip_address: '192.168.1.105',
        user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        session_id: 'session-456',
        workspace_id: 'workspace-1'
      },
      {
        user_id: testUserId,
        action: 'RISK_ASSESSMENT',
        resource_type: 'RISK',
        resource_id: 'doc-4',
        details: {
          risk_level: 'HIGH',
          category: 'OPERATIONAL',
          description: 'Inadequate segregation of duties',
          mitigation_assigned: true
        },
        ip_address: '192.168.1.100',
        user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        session_id: 'session-789',
        workspace_id: 'workspace-1'
      }
    ]

    const { data: auditData, error: auditError } = await supabase
      .from('audit_trail')
      .insert(auditEntries)
      .select()

    if (auditError) {
      console.warn('Audit trail entries may already exist:', auditError.message)
    } else {
      console.log('✅ Audit trail entries created:', auditData?.length || 0)
    }

    // 13. SEED WORKSPACE COLLABORATIONS
    console.log('\n👥 Seeding Workspace Collaborations...')
    const collaborations = [
      {
        workspace_id: 'workspace-1',
        user_id: 'reviewer@company.com',
        role: 'REVIEWER',
        permissions: ['read', 'comment', 'workflow_participate'],
        invited_by: testUserId
      },
      {
        workspace_id: 'workspace-1',
        user_id: 'risk.analyst@company.com',
        role: 'ANALYST',
        permissions: ['read', 'comment', 'risk_assess', 'workflow_participate'],
        invited_by: testUserId
      },
      {
        workspace_id: 'workspace-1',
        user_id: 'compliance@company.com',
        role: 'COMPLIANCE_OFFICER',
        permissions: ['read', 'comment', 'compliance_check', 'workflow_manage'],
        invited_by: testUserId
      },
      {
        workspace_id: 'workspace-2',
        user_id: 'financial.analyst@company.com',
        role: 'ANALYST',
        permissions: ['read', 'comment', 'financial_review'],
        invited_by: testUserId
      }
    ]

    const { data: collabData, error: collabError } = await supabase
      .from('workspace_collaborations')
      .insert(collaborations)
      .select()

    if (collabError) {
      console.warn('Workspace collaborations may already exist:', collabError.message)
    } else {
      console.log('✅ Workspace collaborations created:', collabData?.length || 0)
    }

    console.log('\n🎉 SEEDING COMPLETE! 🎉')
    console.log('\n📊 Data Summary:')
    console.log('   • 2 Workspaces (Audit Department, Financial Review)')
    console.log('   • 5 Documents (Financial statements, compliance reports, etc.)')
    console.log('   • 4 Parsed data entries with financial extractions')
    console.log('   • 4 Compliance frameworks (SOX, GDPR, PCAOB, ISO 27001)')
    console.log('   • 5 Compliance checks with realistic scores')
    console.log('   • 2 Workflows with 3 active instances')
    console.log('   • 6 Workflow steps across different stages')
    console.log('   • 4 Review comments with various priorities')
    console.log('   • 4 Risk assessments (Financial, Operational, Compliance, Fraud)')
    console.log('   • 4 Financial extractions with verified amounts')
    console.log('   • 4 Audit trail entries tracking key actions')
    console.log('   • 4 Workspace collaborations with role-based permissions')
    
    console.log('\n🚀 Your application now has comprehensive sample data!')
    console.log('   📱 Navigate to http://localhost:3000 to see live data in all tabs')
    console.log('   🔄 Refresh the compliance dashboard to see real scores')
    console.log('   📊 Check analytics for document processing statistics')
    console.log('   ⚠️ View risk assessments with actual risk data')
    console.log('   🔄 Test workflow management with active workflows')

  } catch (error) {
    console.error('❌ Seeding failed:', error)
    throw error
  }
}

// Run the seeding function
seedAllData()
  .then(() => {
    console.log('\n✅ All done! Your application is now fully populated with sample data.')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Seeding failed:', error)
    process.exit(1)
  })
