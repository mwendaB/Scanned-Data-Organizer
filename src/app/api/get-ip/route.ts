import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Get IP address from various possible headers
    const forwarded = request.headers.get('x-forwarded-for')
    const real = request.headers.get('x-real-ip')
    const cfConnecting = request.headers.get('cf-connecting-ip')
    
    let ip = 'unknown'
    
    if (forwarded) {
      ip = forwarded.split(',')[0].trim()
    } else if (real) {
      ip = real
    } else if (cfConnecting) {
      ip = cfConnecting
    } else {
      // Fallback to connection remote address
      ip = request.ip || 'unknown'
    }

    return NextResponse.json({ ip }, { status: 200 })
  } catch (error) {
    console.error('Failed to get IP address:', error)
    return NextResponse.json({ ip: 'unknown' }, { status: 200 })
  }
}
