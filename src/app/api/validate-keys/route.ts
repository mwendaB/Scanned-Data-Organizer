import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    // Function to decode JWT payload (without verification)
    const decodeJWT = (token: string) => {
      try {
        const parts = token.split('.')
        if (parts.length !== 3) return null
        
        const payload = JSON.parse(atob(parts[1]))
        return payload
      } catch (e) {
        return null
      }
    }
    
    const anonPayload = decodeJWT(anonKey)
    const servicePayload = decodeJWT(serviceKey)
    
    return NextResponse.json({
      success: true,
      url: {
        value: supabaseUrl,
        valid: supabaseUrl.includes('supabase.co')
      },
      anonKey: {
        length: anonKey.length,
        hasCorrectParts: anonKey.split('.').length === 3,
        payload: anonPayload ? {
          iss: anonPayload.iss,
          ref: anonPayload.ref,
          role: anonPayload.role,
          exp: new Date(anonPayload.exp * 1000).toISOString()
        } : null
      },
      serviceKey: {
        length: serviceKey.length,
        hasCorrectParts: serviceKey.split('.').length === 3,
        payload: servicePayload ? {
          iss: servicePayload.iss,
          ref: servicePayload.ref,
          role: servicePayload.role,
          exp: new Date(servicePayload.exp * 1000).toISOString()
        } : null
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Key validation error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Key validation failed'
    }, { status: 500 })
  }
}
