import { requireAuth } from '@/lib/auth'
import SessionView from '@/components/SessionView'
import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'

interface SessionPageProps {
  params: { 
    id: string
    code: string 
  }
  searchParams: {
    participant?: string
  }
}

export default async function SessionPage({ params, searchParams }: SessionPageProps) {
  await requireAuth()
  const supabase = createClient()

  // Get session by code directly from database
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select(`
      *,
      project:projects(*),
      session_participants(
        participant:participants(*)
      ),
      session_phase_history(*)
    `)
    .eq('session_code', params.code)
    .single()

  if (sessionError || !session) {
    notFound()
  }

  // Check if session is expired
  if (new Date(session.expires_at) < new Date()) {
    // Update session status to expired
    await supabase
      .from('sessions')
      .update({ status: 'expired' })
      .eq('id', session.id)

    redirect(`/project/${params.id}?message=session_expired`)
  }

  // Update last accessed time
  await supabase
    .from('sessions')
    .update({ 
      last_accessed_at: new Date().toISOString(),
      updated_at: new Date().toISOString() 
    })
    .eq('id', session.id)

  // Verify the session belongs to the correct project
  if (session.project_id !== params.id) {
    notFound()
  }

  // Get participant data if specified
  let participant = null
  if (searchParams.participant) {
    const { data: participantData } = await supabase
      .from('participants')
      .select('*')
      .eq('id', searchParams.participant)
      .eq('project_id', params.id)
      .single()
    
    participant = participantData
  }

  return (
    <SessionView
      session={session}
      participant={participant}
      projectId={params.id}
    />
  )
}

export async function generateMetadata({ params }: SessionPageProps) {
  return {
    title: `Session ${params.code} - Abundance Projects`,
    description: 'NPC Roleplay Session',
  }
}