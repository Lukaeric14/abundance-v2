import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // Verify this is an authorized cleanup request
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.CLEANUP_TOKEN || 'default-cleanup-token'
    
    if (authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient()

    // Clean up expired sessions
    const { data: deletedCount, error } = await supabase.rpc('cleanup_expired_sessions')

    if (error) {
      console.error('Session cleanup error:', error)
      return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 })
    }

    // Additional cleanup tasks can be added here
    // - Clean up orphaned session_participants
    // - Clean up old phase history
    // - Archive old completed sessions

    return NextResponse.json({ 
      success: true, 
      deletedSessions: deletedCount,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Cleanup API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Allow GET requests for health checks
export async function GET() {
  return NextResponse.json({ 
    status: 'ready',
    endpoint: 'session-cleanup',
    timestamp: new Date().toISOString()
  })
}