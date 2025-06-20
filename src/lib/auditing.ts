import { supabase } from '@/lib/supabase'

export interface AuditTrailEntry {
  id: string
  user_id: string
  workspace_id?: string
  document_id?: string
  table_name: string
  record_id: string
  action_type: 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW' | 'DOWNLOAD' | 'APPROVE' | 'REJECT'
  old_values?: any
  new_values?: any
  changed_fields?: string[]
  ip_address?: string
  user_agent?: string
  session_id?: string
  request_id?: string
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  compliance_tags?: string[]
  created_at: string
}

export interface RiskAssessment {
  id: string
  document_id: string
  user_id: string
  risk_score: number
  risk_category: 'FINANCIAL' | 'OPERATIONAL' | 'COMPLIANCE' | 'FRAUD' | 'DATA_QUALITY'
  risk_factors: any
  anomalies_detected: any[]
  ai_confidence: number
  human_review_required: boolean
  status: 'PENDING' | 'REVIEWED' | 'APPROVED' | 'FLAGGED'
  reviewer_notes?: string
  created_at: string
  reviewed_at?: string
}

export interface WorkflowInstance {
  id: string
  workflow_id: string
  document_id: string
  initiated_by: string
  current_step: number
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED' | 'CANCELLED'
  workflow_data: any
  due_date?: string
  created_at: string
  completed_at?: string
}

export interface ReviewComment {
  id: string
  document_id: string
  user_id: string
  parent_comment_id?: string
  comment_text: string
  comment_type: 'GENERAL' | 'QUESTION' | 'CONCERN' | 'APPROVAL' | 'REJECTION'
  position_data?: any
  is_resolved: boolean
  resolved_by?: string
  resolved_at?: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  tags?: string[]
  created_at: string
  updated_at: string
}

export interface FinancialExtraction {
  id: string
  document_id: string
  extracted_data: any
  extraction_confidence: number
  amounts: any[]
  dates: any[]
  account_numbers: any[]
  entity_names: any[]
  tax_ids: any[]
  validation_status: 'PENDING' | 'VALIDATED' | 'FAILED' | 'MANUAL_REVIEW'
  validation_errors: any[]
  created_at: string
  validated_at?: string
}

export interface ComplianceCheck {
  id: string
  document_id: string
  framework_id: string
  check_name: string
  status: 'PENDING' | 'PASSED' | 'FAILED' | 'MANUAL_REVIEW'
  score: number
  details: any
  exceptions: any[]
  reviewed_by?: string
  created_at: string
  reviewed_at?: string
}

export class AuditingService {
  
  // Create audit trail entry
  static async logAuditEvent(event: Partial<AuditTrailEntry>): Promise<void> {
    try {
      const { error } = await supabase
        .from('audit_trail')
        .insert([{
          ...event,
          ip_address: await this.getClientIP(),
          user_agent: navigator.userAgent,
          session_id: this.getSessionId(),
          request_id: this.generateRequestId()
        }])

      if (error) throw error
    } catch (error) {
      console.error('Failed to log audit event:', error)
    }
  }

  // Get audit trail for a document
  static async getDocumentAuditTrail(documentId: string): Promise<AuditTrailEntry[]> {
    const { data, error } = await supabase
      .from('audit_trail')
      .select('*')
      .eq('document_id', documentId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  // Create risk assessment
  static async createRiskAssessment(assessment: Partial<RiskAssessment>): Promise<RiskAssessment> {
    const { data, error } = await supabase
      .from('risk_assessments')
      .insert([assessment])
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Get risk assessments for document
  static async getDocumentRiskAssessments(documentId: string): Promise<RiskAssessment[]> {
    const { data, error } = await supabase
      .from('risk_assessments')
      .select('*')
      .eq('document_id', documentId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  // AI-powered risk scoring
  static async calculateRiskScore(documentData: any): Promise<{ score: number; factors: any; anomalies: any[] }> {
    try {
      // Simulated AI risk analysis - in production, this would call an AI service
      const riskFactors = {
        large_amounts: this.detectLargeAmounts(documentData),
        unusual_patterns: this.detectUnusualPatterns(documentData),
        missing_data: this.detectMissingData(documentData),
        data_inconsistencies: this.detectInconsistencies(documentData)
      }

      const anomalies = []
      let score = 0

      // Calculate risk score based on factors
      if (riskFactors.large_amounts.detected) {
        score += 25
        anomalies.push({ type: 'LARGE_AMOUNT', details: riskFactors.large_amounts })
      }

      if (riskFactors.unusual_patterns.detected) {
        score += 30
        anomalies.push({ type: 'UNUSUAL_PATTERN', details: riskFactors.unusual_patterns })
      }

      if (riskFactors.missing_data.detected) {
        score += 20
        anomalies.push({ type: 'MISSING_DATA', details: riskFactors.missing_data })
      }

      if (riskFactors.data_inconsistencies.detected) {
        score += 35
        anomalies.push({ type: 'INCONSISTENCY', details: riskFactors.data_inconsistencies })
      }

      return { score: Math.min(score, 100), factors: riskFactors, anomalies }
    } catch (error) {
      console.error('Risk calculation failed:', error)
      return { score: 0, factors: {}, anomalies: [] }
    }
  }

  // Financial data extraction
  static async extractFinancialData(documentId: string, ocrText: string): Promise<FinancialExtraction> {
    try {
      const extractedData = {
        amounts: this.extractAmounts(ocrText),
        dates: this.extractDates(ocrText),
        account_numbers: this.extractAccountNumbers(ocrText),
        entity_names: this.extractEntityNames(ocrText),
        tax_ids: this.extractTaxIds(ocrText)
      }

      const confidence = this.calculateExtractionConfidence(extractedData)

      const { data, error } = await supabase
        .from('financial_extractions')
        .insert([{
          document_id: documentId,
          extracted_data: extractedData,
          extraction_confidence: confidence,
          amounts: extractedData.amounts,
          dates: extractedData.dates,
          account_numbers: extractedData.account_numbers,
          entity_names: extractedData.entity_names,
          tax_ids: extractedData.tax_ids,
          validation_status: confidence > 80 ? 'VALIDATED' : 'MANUAL_REVIEW'
        }])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Financial extraction failed:', error)
      throw error
    }
  }

  // Review comments
  static async addReviewComment(comment: Partial<ReviewComment>): Promise<ReviewComment> {
    const { data, error } = await supabase
      .from('review_comments')
      .insert([comment])
      .select()
      .single()

    if (error) throw error

    // Log audit event
    await this.logAuditEvent({
      table_name: 'review_comments',
      record_id: data.id,
      action_type: 'CREATE',
      document_id: comment.document_id,
      new_values: comment,
      risk_level: comment.priority === 'URGENT' ? 'HIGH' : 'LOW'
    })

    return data
  }

  // Get review comments for document
  static async getDocumentComments(documentId: string): Promise<ReviewComment[]> {
    const { data, error } = await supabase
      .from('review_comments')
      .select('*')
      .eq('document_id', documentId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data || []
  }

  // Compliance checks
  static async runComplianceChecks(documentId: string, frameworkIds: string[]): Promise<ComplianceCheck[]> {
    const checks = []

    for (const frameworkId of frameworkIds) {
      try {
        const score = await this.calculateComplianceScore(documentId, frameworkId)
        
        const { data, error } = await supabase
          .from('compliance_checks')
          .insert([{
            document_id: documentId,
            framework_id: frameworkId,
            check_name: `Compliance Check - ${frameworkId}`,
            status: score >= 80 ? 'PASSED' : score >= 60 ? 'MANUAL_REVIEW' : 'FAILED',
            score: score,
            details: { calculated_score: score, timestamp: new Date().toISOString() }
          }])
          .select()
          .single()

        if (error) throw error
        checks.push(data)
      } catch (error) {
        console.error(`Compliance check failed for framework ${frameworkId}:`, error)
      }
    }

    return checks
  }

  // Helper methods for AI analysis
  private static detectLargeAmounts(data: any): { detected: boolean; amounts: number[] } {
    // Simulate detection of unusually large amounts
    const amounts = data.amounts || []
    const largeAmounts = amounts.filter((amount: number) => amount > 100000)
    return { detected: largeAmounts.length > 0, amounts: largeAmounts }
  }

  private static detectUnusualPatterns(data: any): { detected: boolean; patterns: string[] } {
    // Simulate pattern detection
    const patterns = []
    if (data.weekend_transactions) patterns.push('weekend_transactions')
    if (data.round_numbers) patterns.push('round_number_amounts')
    return { detected: patterns.length > 0, patterns }
  }

  private static detectMissingData(data: any): { detected: boolean; missing_fields: string[] } {
    const required_fields = ['date', 'amount', 'description']
    const missing = required_fields.filter(field => !data[field])
    return { detected: missing.length > 0, missing_fields: missing }
  }

  private static detectInconsistencies(data: any): { detected: boolean; inconsistencies: string[] } {
    const issues = []
    if (data.date_format_issues) issues.push('inconsistent_date_formats')
    if (data.currency_issues) issues.push('multiple_currencies')
    return { detected: issues.length > 0, inconsistencies: issues }
  }

  // Text extraction helpers
  private static extractAmounts(text: string): any[] {
    const amountRegex = /[$£€¥]\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g
    const matches = []
    let match
    while ((match = amountRegex.exec(text)) !== null) {
      matches.push({
        amount: parseFloat(match[1].replace(/,/g, '')),
        currency: match[0][0],
        position: match.index,
        raw_text: match[0]
      })
    }
    return matches
  }

  private static extractDates(text: string): any[] {
    const dateRegex = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/g
    const matches = []
    let match
    while ((match = dateRegex.exec(text)) !== null) {
      matches.push({
        date: match[1],
        position: match.index,
        confidence: 0.8
      })
    }
    return matches
  }

  private static extractAccountNumbers(text: string): any[] {
    const accountRegex = /(?:Account|Acct|A\/C)[:\s]*(\d{8,20})/gi
    const matches = []
    let match
    while ((match = accountRegex.exec(text)) !== null) {
      matches.push({
        account_number: match[1],
        position: match.index,
        confidence: 0.9
      })
    }
    return matches
  }

  private static extractEntityNames(text: string): any[] {
    // Simplified entity extraction - in production, use NLP
    const entityRegex = /([A-Z][a-z]+ (?:[A-Z][a-z]+ )*(?:Inc|Corp|LLC|Ltd|Company))/g
    const matches = []
    let match
    while ((match = entityRegex.exec(text)) !== null) {
      matches.push({
        entity_name: match[1],
        position: match.index,
        confidence: 0.7
      })
    }
    return matches
  }

  private static extractTaxIds(text: string): any[] {
    const taxIdRegex = /(?:EIN|Tax ID|TIN)[:\s]*(\d{2}-\d{7})/gi
    const matches = []
    let match
    while ((match = taxIdRegex.exec(text)) !== null) {
      matches.push({
        tax_id: match[1],
        position: match.index,
        confidence: 0.95
      })
    }
    return matches
  }

  private static calculateExtractionConfidence(data: any): number {
    let confidence = 0
    let factors = 0

    if (data.amounts.length > 0) { confidence += 30; factors++ }
    if (data.dates.length > 0) { confidence += 25; factors++ }
    if (data.account_numbers.length > 0) { confidence += 20; factors++ }
    if (data.entity_names.length > 0) { confidence += 15; factors++ }
    if (data.tax_ids.length > 0) { confidence += 10; factors++ }

    return factors > 0 ? confidence / factors * factors : 0
  }

  private static async calculateComplianceScore(documentId: string, frameworkId: string): Promise<number> {
    // Simulate compliance scoring - in production, implement actual checks
    const baseScore = Math.random() * 40 + 60 // 60-100
    return Math.round(baseScore)
  }

  // Utility methods
  private static async getClientIP(): Promise<string> {
    try {
      const response = await fetch('/api/get-ip')
      const data = await response.json()
      return data.ip || 'unknown'
    } catch {
      return 'unknown'
    }
  }

  private static getSessionId(): string {
    return sessionStorage.getItem('session_id') || 'unknown'
  }

  private static generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}
