import { requireAuth } from '@/lib/auth'
import TeacherView, { type ChatMessageLite } from '@/components/TeacherView'
import { createClient } from '@/lib/supabase/server'
import fs from 'fs/promises'
import path from 'path'

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

  // Load mock data directly
  const mockDataPath = path.join(process.cwd(), 'data', 'mock-project.json')
  const mockData = JSON.parse(await fs.readFile(mockDataPath, 'utf-8'))

  // Use mock data directly instead of database transformation
  const projectStatus = 'complete'

  return (
    <TeacherView
      projectTitle={project?.title || mockData.objective?.title}
      chat={chat}
      mockData={mockData}
      groupSize={project?.group_size ?? 2}
      projectId={project?.id}
      projectStatus={projectStatus}
    />
  )
}


