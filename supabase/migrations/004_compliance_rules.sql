-- Add configurable compliance rules and scoring to the database
-- This migration adds tables to store compliance rules, scoring criteria, and validation logic

-- 1. Compliance Rules table - stores individual compliance rules for each framework
CREATE TABLE IF NOT EXISTS compliance_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  framework_id UUID NOT NULL REFERENCES compliance_frameworks(id) ON DELETE CASCADE,
  rule_name TEXT NOT NULL,
  rule_description TEXT,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('DATA_VALIDATION', 'FIELD_REQUIRED', 'VALUE_RANGE', 'PATTERN_MATCH', 'CALCULATION', 'CROSS_REFERENCE', 'CUSTOM_LOGIC')),
  
  -- Rule configuration stored as JSON
  rule_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Scoring configuration
  max_score DECIMAL(5,2) DEFAULT 100.00,
  weight DECIMAL(3,2) DEFAULT 1.00, -- Weight in overall framework score
  
  -- Rule status
  is_active BOOLEAN DEFAULT true,
  severity TEXT DEFAULT 'MEDIUM' CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_by UUID REFERENCES auth.users(id)
);

-- 2. Compliance Rule Results table - stores results of individual rule evaluations
CREATE TABLE IF NOT EXISTS compliance_rule_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  compliance_check_id UUID NOT NULL REFERENCES compliance_checks(id) ON DELETE CASCADE,
  rule_id UUID NOT NULL REFERENCES compliance_rules(id) ON DELETE CASCADE,
  
  -- Result details
  passed BOOLEAN NOT NULL,
  score_achieved DECIMAL(5,2) DEFAULT 0.00,
  error_message TEXT,
  validation_details JSONB DEFAULT '{}'::jsonb,
  
  -- Execution metadata
  execution_time_ms INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Compliance Scoring Thresholds table - configurable scoring thresholds
CREATE TABLE IF NOT EXISTS compliance_scoring_thresholds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  framework_id UUID NOT NULL REFERENCES compliance_frameworks(id) ON DELETE CASCADE,
  
  -- Threshold configuration
  pass_threshold DECIMAL(5,2) NOT NULL DEFAULT 80.00, -- Score needed to pass
  manual_review_threshold DECIMAL(5,2) NOT NULL DEFAULT 60.00, -- Score that triggers manual review
  fail_threshold DECIMAL(5,2) NOT NULL DEFAULT 0.00, -- Below this is automatic fail
  
  -- Additional configuration
  allow_exceptions BOOLEAN DEFAULT true,
  require_documentation BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_compliance_rules_framework_id ON compliance_rules(framework_id);
CREATE INDEX IF NOT EXISTS idx_compliance_rules_active ON compliance_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_compliance_rule_results_check_id ON compliance_rule_results(compliance_check_id);
CREATE INDEX IF NOT EXISTS idx_compliance_rule_results_rule_id ON compliance_rule_results(rule_id);
CREATE INDEX IF NOT EXISTS idx_compliance_scoring_framework_id ON compliance_scoring_thresholds(framework_id);

-- 5. Insert default scoring thresholds for existing frameworks
INSERT INTO compliance_scoring_thresholds (framework_id, pass_threshold, manual_review_threshold, fail_threshold)
SELECT 
  id,
  80.00, -- Pass threshold
  60.00, -- Manual review threshold  
  0.00   -- Fail threshold
FROM compliance_frameworks 
WHERE is_active = true
ON CONFLICT DO NOTHING;

-- 6. Insert some example compliance rules for SOX framework
INSERT INTO compliance_rules (framework_id, rule_name, rule_description, rule_type, rule_config, max_score, weight, severity)
SELECT 
  cf.id,
  'Data Retention Period',
  'Verify documents meet 7-year retention requirement',
  'DATA_VALIDATION',
  '{"required_retention_years": 7, "date_field": "document_date", "calculation_method": "years_from_current"}'::jsonb,
  25.00,
  1.00,
  'HIGH'
FROM compliance_frameworks cf 
WHERE cf.name = 'SOX'
ON CONFLICT DO NOTHING;

INSERT INTO compliance_rules (framework_id, rule_name, rule_description, rule_type, rule_config, max_score, weight, severity)
SELECT 
  cf.id,
  'Audit Trail Completeness',
  'Ensure all document changes are tracked in audit trail',
  'CROSS_REFERENCE',
  '{"required_fields": ["user_id", "action", "timestamp", "document_id"], "audit_table": "audit_trail"}'::jsonb,
  25.00,
  1.00,
  'CRITICAL'
FROM compliance_frameworks cf 
WHERE cf.name = 'SOX'
ON CONFLICT DO NOTHING;

INSERT INTO compliance_rules (framework_id, rule_name, rule_description, rule_type, rule_config, max_score, weight, severity)
SELECT 
  cf.id,
  'Digital Signature Validation',
  'Verify documents have valid digital signatures when required',
  'FIELD_REQUIRED',
  '{"required_field": "digital_signature", "validation_type": "not_null", "conditional": true}'::jsonb,
  25.00,
  0.75,
  'MEDIUM'
FROM compliance_frameworks cf 
WHERE cf.name = 'SOX'
ON CONFLICT DO NOTHING;

INSERT INTO compliance_rules (framework_id, rule_name, rule_description, rule_type, rule_config, max_score, weight, severity)
SELECT 
  cf.id,
  'Segregation of Duties',
  'Ensure document creator and approver are different users',
  'CUSTOM_LOGIC',
  '{"validation_logic": "creator_id != approver_id", "fields": ["created_by", "approved_by"]}'::jsonb,
  25.00,
  1.00,
  'HIGH'
FROM compliance_frameworks cf 
WHERE cf.name = 'SOX'
ON CONFLICT DO NOTHING;

-- 7. Add sample rules for GDPR framework
INSERT INTO compliance_rules (framework_id, rule_name, rule_description, rule_type, rule_config, max_score, weight, severity)
SELECT 
  cf.id,
  'Consent Tracking',
  'Verify user consent is properly documented and tracked',
  'FIELD_REQUIRED',
  '{"required_field": "user_consent", "validation_type": "valid_consent_record"}'::jsonb,
  30.00,
  1.00,
  'CRITICAL'
FROM compliance_frameworks cf 
WHERE cf.name = 'GDPR'
ON CONFLICT DO NOTHING;

INSERT INTO compliance_rules (framework_id, rule_name, rule_description, rule_type, rule_config, max_score, weight, severity)
SELECT 
  cf.id,
  'Data Portability Support',
  'Ensure data can be exported in machine-readable format',
  'DATA_VALIDATION',
  '{"export_formats": ["JSON", "CSV", "XML"], "required_fields": ["export_capability"]}'::jsonb,
  25.00,
  0.75,
  'MEDIUM'
FROM compliance_frameworks cf 
WHERE cf.name = 'GDPR'
ON CONFLICT DO NOTHING;

-- 8. Create a view for easy compliance rule management
CREATE OR REPLACE VIEW compliance_rules_summary AS
SELECT 
  cr.id,
  cr.rule_name,
  cr.rule_description,
  cr.rule_type,
  cr.max_score,
  cr.weight,
  cr.severity,
  cr.is_active,
  cf.name as framework_name,
  cf.description as framework_description,
  cr.created_at
FROM compliance_rules cr
JOIN compliance_frameworks cf ON cr.framework_id = cf.id
ORDER BY cf.name, cr.rule_name;

-- Success message
SELECT 'Compliance rules and scoring system added successfully!' as status;
