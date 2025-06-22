import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    console.log('Testing with URL:', supabaseUrl)
    console.log('Service key exists:', !!serviceKey)
    console.log('Service key length:', serviceKey?.length)
    console.log('Service key starts with:', serviceKey?.substring(0, 20) + '...')
    
    // Create admin client
    const adminClient = createClient(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Test 1: Try to list users from auth
    console.log('Testing auth.admin.listUsers()...')
    const { data: authData, error: authError } = await adminClient.auth.admin.listUsers()
    
    console.log('Auth result:', { 
      userCount: authData?.users?.length || 0, 
      error: authError?.message 
    })

    // Test 2: Try to access user_profiles table
    console.log('Testing user_profiles access...')
    const { data: profileData, error: profileError } = await adminClient
      .from('user_profiles')
      .select('*')
      .limit(1)
    
    console.log('Profile result:', { 
      hasData: !!profileData, 
      error: profileError?.message 
    })

    return NextResponse.json({
      success: true,
      tests: {
        auth: {
          working: !authError,
          error: authError?.message,
          userCount: authData?.users?.length || 0
        },
        profiles: {
          working: !profileError,
          error: profileError?.message,
          hasData: !!profileData
        }
      },
      config: {
        hasUrl: !!supabaseUrl,
        hasServiceKey: !!serviceKey,
        serviceKeyLength: serviceKey?.length,
        serviceKeyPrefix: serviceKey?.substring(0, 20) + '...'
      }
    })

  } catch (error) {
    console.error('Admin test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Admin test failed'
    }, { status: 500 })
  }
}
