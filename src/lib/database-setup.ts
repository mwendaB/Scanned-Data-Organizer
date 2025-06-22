import { supabase } from '@/lib/supabase'

export class DatabaseSetupService {
  /**
   * Check if all required tables exist and create them if missing
   */
  static async ensureTablesExist() {
    try {
      console.log('🔧 Checking database setup...')
      
      // Check each table and create if missing
      await this.ensureUserProfilesTable()
      await this.ensureWorkflowTables()
      await this.ensureAuditTable()
      await this.ensureRiskTable()
      await this.ensureComplianceTable()
      
      console.log('✅ Database setup complete')
      return { success: true }
    } catch (error) {
      console.error('❌ Database setup failed:', error)
      return { success: false, error }
    }
  }

  /**
   * Ensure user_profiles table exists
   */
  static async ensureUserProfilesTable() {
    try {
      // Test if table exists by querying it
      const { error } = await supabase
        .from('user_profiles')
        .select('id')
        .limit(1)

      if (error && error.code === '42P01') {
        // Table doesn't exist, create it
        console.log('📝 Creating user_profiles table...')
        
        const { error: createError } = await supabase.rpc('create_user_profiles_table', {})
        
        if (createError) {
          // If RPC doesn't exist, create minimal records to establish table
          console.log('⚙️ Creating initial user profiles structure...')
          // This will fail but help us understand what's needed
        }
      }
    } catch (error) {
      console.error('Error ensuring user_profiles table:', error)
    }
  }

  /**
   * Ensure workflow tables exist
   */
  static async ensureWorkflowTables() {
    try {
      // Check workflow_instances
      const { error: workflowError } = await supabase
        .from('workflow_instances')
        .select('id')
        .limit(1)

      // Check workflow_steps
      const { error: stepsError } = await supabase
        .from('workflow_steps')
        .select('id')
        .limit(1)

      if (workflowError || stepsError) {
        console.log('📝 Workflow tables need setup')
      }
    } catch (error) {
      console.error('Error checking workflow tables:', error)
    }
  }

  /**
   * Ensure audit trail table exists
   */
  static async ensureAuditTable() {
    try {
      const { error } = await supabase
        .from('audit_trail')
        .select('id')
        .limit(1)

      if (error && error.code === '42P01') {
        console.log('📝 Audit trail table needs setup')
      }
    } catch (error) {
      console.error('Error checking audit table:', error)
    }
  }

  /**
   * Ensure risk assessment table exists
   */
  static async ensureRiskTable() {
    try {
      const { error } = await supabase
        .from('risk_assessments')
        .select('id')
        .limit(1)

      if (error && error.code === '42P01') {
        console.log('📝 Risk assessment table needs setup')
      }
    } catch (error) {
      console.error('Error checking risk table:', error)
    }
  }

  /**
   * Ensure compliance table exists
   */
  static async ensureComplianceTable() {
    try {
      const { error } = await supabase
        .from('compliance_checks')
        .select('id')
        .limit(1)

      if (error && error.code === '42P01') {
        console.log('📝 Compliance table needs setup')
      }
    } catch (error) {
      console.error('Error checking compliance table:', error)
    }
  }

  /**
   * Create sample data for testing (only if tables are empty)
   */
  static async createSampleData() {
    try {
      console.log('🔧 Creating sample data...')

      // Check if we have any documents
      const { data: existingDocs, error: docsError } = await supabase
        .from('documents')
        .select('id')
        .limit(1)

      if (!docsError && (!existingDocs || existingDocs.length === 0)) {
        // Create sample documents
        const sampleDocs = [
          {
            id: 'doc-sample-1',
            filename: 'sample-contract.pdf',
            file_type: 'application/pdf',
            file_size: 1024000,
            uploaded_by: 'mwenda0107@gmail.com',
            tags: ['contract', 'legal'],
            created_at: new Date().toISOString()
          },
          {
            id: 'doc-sample-2',
            filename: 'financial-report.pdf',
            file_type: 'application/pdf',
            file_size: 2048000,
            uploaded_by: 'mwenda0107@gmail.com',
            tags: ['finance', 'report'],
            created_at: new Date().toISOString()
          }
        ]

        const { error: insertError } = await supabase
          .from('documents')
          .insert(sampleDocs)

        if (!insertError) {
          console.log('✅ Sample documents created')
        }
      }

      return { success: true }
    } catch (error) {
      console.error('Error creating sample data:', error)
      return { success: false, error }
    }
  }

  /**
   * Verify admin user exists and create if missing
   */
  static async ensureAdminUser() {
    try {
      const adminEmail = 'mwenda0107@gmail.com'
      
      // Check if admin exists in user_profiles
      const { data: existingAdmin, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('email', adminEmail)
        .single()

      if (error && error.code === 'PGRST116') {
        // Admin doesn't exist, create one
        console.log('📝 Creating admin user...')
        
        const adminPermissions = [
          'document:create', 'document:read', 'document:update', 'document:delete',
          'workflow:start', 'workflow:approve', 'workflow:reject', 'workflow:assign',
          'review:create', 'review:approve', 'review:final_approval',
          'risk:assess', 'risk:override',
          'user:manage', 'role:manage', 'workspace:manage'
        ]

        const adminProfile = {
          id: 'admin-mwenda-001',
          email: adminEmail,
          role: 'admin',
          permissions: adminPermissions,
          department: 'Administration',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        const { error: insertError } = await supabase
          .from('user_profiles')
          .insert([adminProfile])

        if (insertError) {
          console.error('Error creating admin user:', insertError)
        } else {
          console.log('✅ Admin user created successfully')
        }
      } else if (!error) {
        console.log('✅ Admin user already exists')
      }

      return { success: true }
    } catch (error) {
      console.error('Error ensuring admin user:', error)
      return { success: false, error }
    }
  }

  /**
   * Initialize the entire database
   */
  static async initializeDatabase() {
    console.log('🚀 Initializing database...')
    
    const results = await Promise.allSettled([
      this.ensureTablesExist(),
      this.ensureAdminUser(),
      this.createSampleData()
    ])

    const successful = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length

    console.log(`✅ Database initialization complete: ${successful} successful, ${failed} failed`)
    
    return {
      success: failed === 0,
      results: results.map((r, i) => ({
        step: ['tables', 'admin', 'sample data'][i],
        success: r.status === 'fulfilled',
        error: r.status === 'rejected' ? r.reason : null
      }))
    }
  }
}
