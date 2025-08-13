import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ChatOpenAI } from '@langchain/openai'
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts'
import { RunnableSequence } from '@langchain/core/runnables'
import { HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Helper: ensure tables exist (no-op if already exist). Safe for prototype.
async function ensureChat(sessionEmail: string) {
  const supabase = createClient()
  // Create chat row for this session if not present; for now create one per new conversation request
  const { data, error } = await supabase
    .from('chats')
    .insert({ owner_email: sessionEmail })
    .select('id')
    .single()
  if (error) throw error
  return data.id as string
}

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const { chatId, messages } = body as {
    chatId?: string
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>
  }

  // Create new chat if needed
  let currentChatId = chatId
  if (!currentChatId) {
    currentChatId = await ensureChat(user.email)
  }

  // Persist incoming user message
  const lastMessage = messages[messages.length - 1]
  if (lastMessage) {
    await supabase
      .from('chat_messages')
      .insert({ chat_id: currentChatId, role: lastMessage.role, content: lastMessage.content })
  }

  const openrouterKey = process.env.OPENROUTER_API_KEY
  if (!openrouterKey) {
    return NextResponse.json({ error: 'Missing OPENROUTER_API_KEY' }, { status: 500 })
  }

  const llm = new ChatOpenAI({
    apiKey: openrouterKey,
    model: process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini',
    temperature: 0.3,
    configuration: {
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'Abundance',
      },
    },
  })

  const system = new SystemMessage(
    'You are Abundance, an education project assistant. In at most 3-4 messages, elicit: topic, group dynamics (2-4 students), life skill, and decide when enough info is gathered to generate the project. When ready, respond EXACTLY as JSON with keys {"action":"generate_project","project":{ "title","topic","life_skill","group_size","duration_min","spec_json" }}. Otherwise, ask a concise next question. Never include extra text when sending the JSON.'
  )

  const history = messages
    .filter(m => m.role !== 'system')
    .map(m => (m.role === 'user' ? new HumanMessage(m.content) : new AIMessage(m.content)))

  const prompt = ChatPromptTemplate.fromMessages([
    system,
    new MessagesPlaceholder('history'),
    new MessagesPlaceholder('input'),
  ])

  const chain = RunnableSequence.from([
    prompt,
    llm,
  ])

  const response = await chain.invoke({ history, input: [] })
  const text = response.content as string

  // Try to detect JSON action
  let action: 'continue' | 'generate_project' = 'continue'
  let project: any = null
  try {
    const trimmed = text.trim()
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      const parsed = JSON.parse(trimmed)
      if (parsed?.action === 'generate_project' && parsed?.project) {
        action = 'generate_project'
        project = parsed.project
      }
    }
  } catch {}

  if (action === 'continue') {
    // Save assistant message and return
    await supabase
      .from('chat_messages')
      .insert({ chat_id: currentChatId, role: 'assistant', content: text })

    return NextResponse.json({ chatId: currentChatId, message: text })
  }

  // Create initial project in DB
  const insert = await supabase
    .from('projects')
    .insert({
      owner_email: user.email,
      title: project.title || 'Untitled Project',
      topic: project.topic,
      life_skill: project.life_skill,
      group_size: Number(project.group_size) || 2,
      duration_min: Number(project.duration_min) || 30,
      spec_json: { status: 'generating', chat_id: currentChatId },
    })
    .select('id')
    .single()

  if (insert.error) {
    return NextResponse.json({ error: insert.error.message }, { status: 500 })
  }

  const projectId = insert.data.id

  // Call generate-project microservice
  try {
    const microserviceUrl = process.env.GENERATE_PROJECT_URL || 'http://localhost:8080'
    const response = await fetch(`${microserviceUrl}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: projectId,
        chat_id: currentChatId,
        title: project.title || 'Untitled Project',
        topic: project.topic,
        life_skill: project.life_skill,
        group_size: Number(project.group_size) || 2,
        duration_min: Number(project.duration_min) || 30,
        owner_email: user.email
      })
    })

    if (!response.ok) {
      throw new Error(`Microservice error: ${response.status}`)
    }

    const result = await response.json()
    console.log('Microservice started:', result)

    // Update project with run_id for tracking
    await supabase
      .from('projects')
      .update({ spec_json: { status: 'generating', chat_id: currentChatId, run_id: result.run_id } })
      .eq('id', projectId)

  } catch (error) {
    console.error('Microservice error:', error)
    // Update project status to error
    await supabase
      .from('projects')
      .update({ spec_json: { status: 'error', chat_id: currentChatId, error: (error as Error).message } })
      .eq('id', projectId)
  }

  // Save a human-friendly assistant confirmation message as the final message
  const confirmation = `Generated project: ${project.title || 'Untitled Project'}. Processing in background...`
  await supabase
    .from('chat_messages')
    .insert({ chat_id: currentChatId, role: 'assistant', content: confirmation })

  return NextResponse.json({ action: 'generate_project', projectId: projectId })
}


