import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()

    if (body.action === 'create') {
      return await createSession(supabase, body)
    } else if (body.action === 'get') {
      return await getSession(supabase, body)
    } else if (body.action === 'get_by_project') {
      return await getSessionsByProject(supabase, body)
    } else if (body.action === 'update') {
      return await updateSession(supabase, body)
    } else if (body.action === 'progress_phase') {
      return await progressPhase(supabase, body)
    } else if (body.action === 'add_conversation') {
      return await addConversation(supabase, body)
    } else if (body.action === 'cleanup') {
      return await cleanupExpired(supabase)
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Session API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function createSession(supabase: any, body: any) {
  const { project_id, participant_ids = [] } = body

  // Verify project exists
  const { data: project } = await supabase
    .from('projects')
    .select('id, title')
    .eq('id', project_id)
    .single()

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  // Generate unique session code
  let sessionCode: string
  let codeExists = true
  let attempts = 0

  while (codeExists && attempts < 10) {
    const { data: code } = await supabase.rpc('generate_session_code')
    sessionCode = code

    const { data: existing } = await supabase
      .from('sessions')
      .select('id')
      .eq('session_code', sessionCode)
      .single()

    codeExists = !!existing
    attempts++
  }

  if (codeExists) {
    return NextResponse.json({ error: 'Failed to generate unique session code' }, { status: 500 })
  }

  // Create session
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .insert({
      project_id,
      session_code: sessionCode!,
      current_phase: 'research',
      phase_start_time: new Date().toISOString(),
    })
    .select()
    .single()

  if (sessionError) {
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
  }

  // Add participants to session
  if (participant_ids.length > 0) {
    const { error: participantError } = await supabase
      .from('session_participants')
      .insert(
        participant_ids.map((pid: string) => ({
          session_id: session.id,
          participant_id: pid,
        }))
      )

    if (participantError) {
      console.error('Failed to add participants:', participantError)
    }
  }

  // Create initial phase history entry
  await supabase
    .from('session_phase_history')
    .insert({
      session_id: session.id,
      phase_name: 'research',
    })

  return NextResponse.json({
    session,
    url: `/project/${project_id}/session/${sessionCode}`,
  })
}

async function getSession(supabase: any, body: any) {
  const { session_code, session_id } = body

  let query = supabase
    .from('sessions')
    .select(`
      *,
      project:projects(*),
      session_participants(
        participant:participants(*)
      ),
      session_phase_history(*)
    `)

  if (session_code) {
    query = query.eq('session_code', session_code)
  } else if (session_id) {
    query = query.eq('id', session_id)
  } else {
    return NextResponse.json({ error: 'Session code or ID required' }, { status: 400 })
  }

  const { data: session, error } = await query.single()

  if (error || !session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  // Update last accessed time
  await supabase.rpc('update_session_access', { session_id_param: session.id })

  // Check if session is expired
  if (new Date(session.expires_at) < new Date()) {
    await supabase
      .from('sessions')
      .update({ status: 'expired' })
      .eq('id', session.id)

    return NextResponse.json({ error: 'Session expired' }, { status: 410 })
  }

  return NextResponse.json({ session })
}

async function updateSession(supabase: any, body: any) {
  const { session_id, updates } = body

  const { data: session, error } = await supabase
    .from('sessions')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', session_id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 })
  }

  return NextResponse.json({ session })
}

async function progressPhase(supabase: any, body: any) {
  const { session_id, new_phase } = body

  const { data: result, error } = await supabase.rpc('progress_session_phase', {
    session_id_param: session_id,
    new_phase: new_phase || null,
  })

  if (error) {
    return NextResponse.json({ error: 'Failed to progress phase' }, { status: 500 })
  }

  return NextResponse.json({ result })
}

async function addConversation(supabase: any, body: any) {
  const { session_id, message } = body

  // Get current conversation history
  const { data: session } = await supabase
    .from('sessions')
    .select('conversation_history')
    .eq('id', session_id)
    .single()

  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  const history = session.conversation_history || []
  history.push({
    ...message,
    timestamp: new Date().toISOString(),
  })

  // Update conversation history
  const { error } = await supabase
    .from('sessions')
    .update({
      conversation_history: history,
      updated_at: new Date().toISOString(),
    })
    .eq('id', session_id)

  if (error) {
    return NextResponse.json({ error: 'Failed to add conversation' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

async function getSessionsByProject(supabase: any, body: any) {
  const { project_id } = body

  if (!project_id) {
    return NextResponse.json({ error: 'Project ID required' }, { status: 400 })
  }

  const { data: sessions, error } = await supabase
    .from('sessions')
    .select(`
      *,
      session_participants(
        participant:participants(*)
      ),
      session_phase_history(*)
    `)
    .eq('project_id', project_id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 })
  }

  return NextResponse.json({ sessions })
}

async function cleanupExpired(supabase: any) {
  const { data: deletedCount, error } = await supabase.rpc('cleanup_expired_sessions')

  if (error) {
    return NextResponse.json({ error: 'Failed to cleanup sessions' }, { status: 500 })
  }

  return NextResponse.json({ deletedCount })
}