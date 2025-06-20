-- Advanced Auditing Features Migration
-- This migration adds comprehensive auditing capabilities for professional auditors

-- 1. Enhanced Audit Trail Table
CREATE TABLE audit_trail (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('CREATE', 'UPDATE', 'DELETE', 'VIEW', 'DOWNLOAD', 'APPROVE', 'REJECT')),
  old_values JSONB DEFAULT '{}'::jsonb,
  new_values JSONB DEFAULT '{}'::jsonb,
  changed_fields TEXT[],
  ip_address INET,
  user_agent TEXT,
  session_id TEXT,
  request_id TEXT,
  risk_level TEXT DEFAULT 'LOW' CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  compliance_tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Document Integrity & Digital Signatures
CREATE TABLE document_integrity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  file_hash TEXT NOT NULL, -- SHA-256 hash of original file
  signature_hash TEXT, -- Digital signature hash
  checksum TEXT NOT NULL,
  verification_status TEXT DEFAULT 'PENDING' CHECK (verification_status IN ('PENDING', 'VERIFIED', 'FAILED', 'TAMPERED')),
  signed_by UUID REFERENCES auth.users(id),
  signed_at TIMESTAMP WITH TIME ZONE,
  certificate_info JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Risk Assessment Table
CREATE TABLE risk_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  risk_score DECIMAL(5,2) NOT NULL DEFAULT 0.00, -- 0.00 to 100.00
  risk_category TEXT NOT NULL CHECK (risk_category IN ('FINANCIAL', 'OPERATIONAL', 'COMPLIANCE', 'FRAUD', 'DATA_QUALITY')),
  risk_factors JSONB DEFAULT '{}'::jsonb,
  anomalies_detected JSONB DEFAULT '[]'::jsonb,
  ai_confidence DECIMAL(5,2) DEFAULT 0.00,
  human_review_required BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'REVIEWED', 'APPROVED', 'FLAGGED')),
  reviewer_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE
);

-- 4. Workflow Management
CREATE TABLE workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workflow_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE workflow_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  initiated_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_step INTEGER DEFAULT 1,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'REJECTED', 'CANCELLED')),
  workflow_data JSONB DEFAULT '{}'::jsonb,
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE workflow_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_instance_id UUID NOT NULL REFERENCES workflow_instances(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  step_name TEXT NOT NULL,
  assigned_to UUID REFERENCES auth.users(id),
  assigned_role TEXT,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED', 'REJECTED')),
  action_required TEXT,
  comments TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  completed_by UUID REFERENCES auth.users(id),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Review Comments and Annotations
CREATE TABLE review_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES review_comments(id),
  comment_text TEXT NOT NULL,
  comment_type TEXT DEFAULT 'GENERAL' CHECK (comment_type IN ('GENERAL', 'QUESTION', 'CONCERN', 'APPROVAL', 'REJECTION')),
  position_data JSONB DEFAULT '{}'::jsonb, -- For document positioning
  is_resolved BOOLEAN DEFAULT false,
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  priority TEXT DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Financial Data Extraction Results
CREATE TABLE financial_extractions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  extracted_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  extraction_confidence DECIMAL(5,2) DEFAULT 0.00,
  amounts JSONB DEFAULT '[]'::jsonb, -- Array of monetary amounts found
  dates JSONB DEFAULT '[]'::jsonb, -- Array of dates found
  account_numbers JSONB DEFAULT '[]'::jsonb,
  entity_names JSONB DEFAULT '[]'::jsonb,
  tax_ids JSONB DEFAULT '[]'::jsonb,
  validation_status TEXT DEFAULT 'PENDING' CHECK (validation_status IN ('PENDING', 'VALIDATED', 'FAILED', 'MANUAL_REVIEW')),
  validation_errors JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  validated_at TIMESTAMP WITH TIME ZONE
);

-- 7. Compliance Tracking
CREATE TABLE compliance_frameworks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  requirements JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE compliance_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  framework_id UUID NOT NULL REFERENCES compliance_frameworks(id) ON DELETE CASCADE,
  check_name TEXT NOT NULL,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PASSED', 'FAILED', 'MANUAL_REVIEW')),
  score DECIMAL(5,2) DEFAULT 0.00,
  details JSONB DEFAULT '{}'::jsonb,
  exceptions JSONB DEFAULT '[]'::jsonb,
  reviewed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE
);

-- 8. Create indexes for performance
CREATE INDEX idx_audit_trail_user_id ON audit_trail(user_id);
CREATE INDEX idx_audit_trail_document_id ON audit_trail(document_id);
CREATE INDEX idx_audit_trail_created_at ON audit_trail(created_at);
CREATE INDEX idx_audit_trail_action_type ON audit_trail(action_type);
CREATE INDEX idx_audit_trail_risk_level ON audit_trail(risk_level);

CREATE INDEX idx_document_integrity_document_id ON document_integrity(document_id);
CREATE INDEX idx_document_integrity_verification_status ON document_integrity(verification_status);

CREATE INDEX idx_risk_assessments_document_id ON risk_assessments(document_id);
CREATE INDEX idx_risk_assessments_risk_score ON risk_assessments(risk_score);
CREATE INDEX idx_risk_assessments_status ON risk_assessments(status);

CREATE INDEX idx_workflow_instances_workflow_id ON workflow_instances(workflow_id);
CREATE INDEX idx_workflow_instances_document_id ON workflow_instances(document_id);
CREATE INDEX idx_workflow_instances_status ON workflow_instances(status);

CREATE INDEX idx_workflow_steps_workflow_instance_id ON workflow_steps(workflow_instance_id);
CREATE INDEX idx_workflow_steps_assigned_to ON workflow_steps(assigned_to);
CREATE INDEX idx_workflow_steps_status ON workflow_steps(status);

CREATE INDEX idx_review_comments_document_id ON review_comments(document_id);
CREATE INDEX idx_review_comments_user_id ON review_comments(user_id);
CREATE INDEX idx_review_comments_is_resolved ON review_comments(is_resolved);

CREATE INDEX idx_financial_extractions_document_id ON financial_extractions(document_id);
CREATE INDEX idx_financial_extractions_validation_status ON financial_extractions(validation_status);

CREATE INDEX idx_compliance_checks_document_id ON compliance_checks(document_id);
CREATE INDEX idx_compliance_checks_framework_id ON compliance_checks(framework_id);
CREATE INDEX idx_compliance_checks_status ON compliance_checks(status);

-- 9. Enable RLS for all new tables
ALTER TABLE audit_trail ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_integrity ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_extractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_frameworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_checks ENABLE ROW LEVEL SECURITY;

-- 10. RLS Policies
-- Audit trail - viewable by workspace members
CREATE POLICY "Workspace members can view audit trail" ON audit_trail
  FOR SELECT USING (
    auth.uid() = user_id OR
    workspace_id IS NULL OR
    EXISTS (
      SELECT 1 FROM workspace_members 
      WHERE workspace_id = audit_trail.workspace_id 
      AND user_id = auth.uid()
    )
  );

-- Document integrity - viewable by document owners and workspace members
CREATE POLICY "Document integrity viewable by authorized users" ON document_integrity
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM documents 
      WHERE id = document_integrity.document_id 
      AND (user_id = auth.uid() OR workspace_id IN (
        SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
      ))
    )
  );

-- Risk assessments - viewable by document owners and workspace members
CREATE POLICY "Risk assessments viewable by authorized users" ON risk_assessments
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM documents 
      WHERE id = risk_assessments.document_id 
      AND (user_id = auth.uid() OR workspace_id IN (
        SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
      ))
    )
  );

-- Similar policies for other tables...
CREATE POLICY "Workflows viewable by workspace members" ON workflows
  FOR SELECT USING (
    workspace_id IS NULL OR
    EXISTS (
      SELECT 1 FROM workspace_members 
      WHERE workspace_id = workflows.workspace_id 
      AND user_id = auth.uid()
    )
  );

-- Insert some default compliance frameworks
INSERT INTO compliance_frameworks (name, description, requirements) VALUES
('SOX', 'Sarbanes-Oxley Act Compliance', '{"data_retention": "7_years", "audit_trail": "required", "digital_signatures": "required"}'::jsonb),
('PCAOB', 'Public Company Accounting Oversight Board', '{"workpaper_retention": "7_years", "review_documentation": "required", "independence_verification": "required"}'::jsonb),
('ISO_27001', 'Information Security Management', '{"access_control": "required", "encryption": "required", "audit_logging": "required"}'::jsonb),
('GDPR', 'General Data Protection Regulation', '{"consent_tracking": "required", "data_portability": "required", "right_to_erasure": "required"}'::jsonb);
