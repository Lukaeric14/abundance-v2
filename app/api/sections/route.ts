import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const { projectId, role, seat } = await req.json().catch(() => ({}))
  if (!projectId || !role) {
    return NextResponse.json({ error: 'Missing projectId or role' }, { status: 400 })
  }

  const supabase = createClient()

  try {
    if (role === 'teacher') {
      const { data, error } = await supabase.rpc('get_teacher_sections', { p_project_id: projectId })
      if (error) throw error
      return NextResponse.json({ sections: data || [] })
    }

    const seatNum = Number(seat)
    if (!seatNum || Number.isNaN(seatNum)) {
      return NextResponse.json({ error: 'Missing or invalid seat' }, { status: 400 })
    }
    const { data, error } = await supabase.rpc('get_student_sections', {
      p_project_id: projectId,
      p_seat: seatNum,
    })
    if (error) throw error
    return NextResponse.json({ sections: data || [] })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'RPC error' }, { status: 500 })
  }
}


