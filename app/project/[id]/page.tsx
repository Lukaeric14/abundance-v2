import { requireAuth } from '@/lib/auth'
import TeacherView, { type ChatMessageLite } from '@/components/TeacherView'
import { createClient } from '@/lib/supabase/server'

interface ProjectPageProps {
  params: { id: string }
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  await requireAuth()
  const supabase = createClient()

  const { data: project } = await supabase
    .from('projects')
    .select('id, title, spec_json, owner_email, created_at, group_size')
    .eq('id', params.id)
    .maybeSingle()

  let chat: ChatMessageLite[] = []
  let chatId: string | null = project?.spec_json?.chat_id ?? null
  // Fallback: use most recent chat by owner if project wasn't created with chat_id stored
  if (!chatId && project?.owner_email) {
    const { data: latestChat } = await supabase
      .from('chats')
      .select('id, created_at')
      .eq('owner_email', project.owner_email)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    chatId = latestChat?.id ?? null
  }

  if (chatId) {
    const { data: msgs } = await supabase
      .from('chat_messages')
      .select('role, content, created_at, id')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true })
      .order('id', { ascending: true })
    const raw = (msgs || [])
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))

    // Drop the final JSON control message if present
    const withoutControl = raw.filter(m => {
      if (m.role !== 'assistant') return true
      const t = m.content.trim()
      if (!t.startsWith('{') || !t.endsWith('}')) return true
      try {
        const parsed = JSON.parse(t)
        return !(parsed?.action === 'generate_project')
      } catch {
        return true
      }
    })

    // Prepend the onboarding assistant line if the history starts with user
    if (withoutControl.length > 0 && withoutControl[0].role === 'user') {
      withoutControl.unshift({
        role: 'assistant',
        content: 'What are we going to build? Share topic, group size (2-4), and life skill.',
      })
    }

    chat = withoutControl
  }

  // Check if project is still generating or get generated sections from microservice format
  let projectStatus = 'unknown'
  let generatedSections: any = null
  
  if (project?.spec_json) {
    projectStatus = project.spec_json.status || 'unknown'
    if (project.spec_json.sections) {
      generatedSections = project.spec_json.sections
    }
    // Debug logging (can be removed later)
    console.log('Project status:', projectStatus)
    console.log('Generated sections keys:', generatedSections ? Object.keys(generatedSections) : 'none')
  }

  // If project is still generating, we might want to poll for updates
  // For now, we'll show what we have
  let initialSections: any[] = []
  let allSections: any[] = []
  
  // Allow sections to show even if still generating, as long as we have sections data
  if (generatedSections) {
    // Transform microservice output to match existing component structure
    Object.keys(generatedSections).forEach(sectionId => {
      const section = generatedSections[sectionId]
      
      // Teacher section - handle both new and old formats
      if (section.teacher) {
        // New format (objective, steps, data)
        const teacherObjective = section.teacher.objective || section.teacher.instructions || section.teacher.name || 'Teacher objectives'
        const teacherSteps = section.teacher.steps || section.teacher.tools || []
        const teacherData = section.teacher.data || {}

        initialSections.push({
          id: `${sectionId}_teacher_objective`,
          section_type: 'objective',
          seat_number: 0,
          content_text: teacherObjective,
          order_index: 1
        })
        initialSections.push({
          id: `${sectionId}_teacher_steps`,
          section_type: 'steps', 
          seat_number: 0,
          content_text: Array.isArray(teacherSteps) ? teacherSteps.join('\n') : String(teacherSteps),
          order_index: 2
        })
        initialSections.push({
          id: `${sectionId}_teacher_data`,
          section_type: 'data',
          seat_number: 0,
          content_text: typeof teacherData === 'object' ? JSON.stringify(teacherData, null, 2) : String(teacherData),
          order_index: 3
        })
      }
      
      // Shared sections - handle both new and old formats  
      if (section.shared) {
        const sharedObjective = section.shared.objective || section.shared.setup || 'Shared group objectives'
        const sharedSteps = section.shared.steps || section.shared.materials_available || []
        const sharedData = section.shared.data || {}

        allSections.push({
          id: `${sectionId}_shared_objective`,
          section_type: 'objective',
          seat_number: null,
          content_text: sharedObjective,
          order_index: 1
        })
        allSections.push({
          id: `${sectionId}_shared_steps`,
          section_type: 'steps',
          seat_number: null,
          content_text: Array.isArray(sharedSteps) ? sharedSteps.join('\n') : String(sharedSteps),
          order_index: 2
        })
        allSections.push({
          id: `${sectionId}_shared_data`,
          section_type: 'data',
          seat_number: null,
          content_text: typeof sharedData === 'object' ? JSON.stringify(sharedData, null, 2) : String(sharedData),
          order_index: 3
        })
      }
      
      // Student seats - handle both new and old formats
      if (section.seats) {
        Object.keys(section.seats).forEach(seatNum => {
          const seat = section.seats[seatNum]
          const seatNumber = parseInt(seatNum)
          
          // Handle different seat formats
          const seatObjective = seat.objective || seat.notes || `Student ${seatNum} objectives`
          const seatSteps = seat.steps || seat.participants || [`Student ${seatNum} tasks`]
          const seatData = seat.data || { group_id: seat.group_id } || {}
          
          allSections.push({
            id: `${sectionId}_seat_${seatNum}_objective`,
            section_type: 'objective',
            seat_number: seatNumber,
            content_text: seatObjective,
            order_index: 1
          })
          allSections.push({
            id: `${sectionId}_seat_${seatNum}_steps`,
            section_type: 'steps',
            seat_number: seatNumber,
            content_text: Array.isArray(seatSteps) ? seatSteps.join('\n') : String(seatSteps),
            order_index: 2
          })
          allSections.push({
            id: `${sectionId}_seat_${seatNum}_data`,
            section_type: 'data',
            seat_number: seatNumber,
            content_text: typeof seatData === 'object' ? JSON.stringify(seatData, null, 2) : String(seatData),
            order_index: 3
          })
        })
      }
    })
    
    // Add teacher sections to allSections as well
    allSections.push(...initialSections)
    
    // Debug logging (can be removed later)
    console.log('Transformed sections - initial:', initialSections.length, 'all:', allSections.length)
  }

  return (
    <TeacherView
      projectTitle={project?.title}
      chat={chat}
      initialSections={initialSections}
      allSections={allSections}
      groupSize={project?.group_size ?? 3}
      projectId={project?.id}
      projectStatus={projectStatus}
      runId={project?.spec_json?.run_id}
    />
  )
}


