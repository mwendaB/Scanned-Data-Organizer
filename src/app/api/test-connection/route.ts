import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    // Test basic connection with anon key
    const { data, error } = await supabase
      .from('user_profiles')
      .select('count', { count: 'exact', head: true })

    console.log('Connection test result:', { data, error })

    // Test getting current user (should be null for anon)
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    console.log('User test result:', { user, userError })

    return NextResponse.json({
      success: true,
      connection: {
        working: !error,
        error: error?.message,
        userProfilesAccessible: !error
      },
      auth: {
        userError: userError?.message,
        hasUser: !!user
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Connection test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Connection test failed'
    }, { status: 500 })
  }
}
