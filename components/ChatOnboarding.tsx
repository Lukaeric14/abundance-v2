"use client"
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

type ChatMessage = { role: 'user' | 'assistant'; content: string }

export default function ChatOnboarding() {
  const router = useRouter()
  const [chatId, setChatId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant' as const, content: 'What are we going to build? Share topic, group size (2-4), and life skill.' },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send() {
    if (!input.trim() || loading) return
    const nextMessages: ChatMessage[] = [...messages, { role: 'user', content: input.trim() }]
    setMessages(nextMessages)
    setInput('')
    setLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId, messages: nextMessages }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Chat error')

      if (data.action === 'generate_project' && data.projectId) {
        router.push(`/project/${data.projectId}`)
        return
      }

      if (data.chatId && !chatId) setChatId(data.chatId)
      if (data.message) setMessages((m: ChatMessage[]) => [...m, { role: 'assistant', content: data.message }])
    } catch (e: any) {
      setMessages(m => [...m, { role: 'assistant', content: `Error: ${e.message}` }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="chat-container" style={{ width: 600, maxWidth: '90%' }}>
      <div className="chat-content" style={{ alignItems: 'stretch' }}>
        <div className="chat-messages" style={{ maxHeight: 380, overflowY: 'auto' }}>
          {messages.map((m, i) => (
            <div key={i} className={m.role === 'user' ? 'user-message' : 'project-description'}>
              <div className={m.role === 'user' ? 'text-r-12' : 'text-r-12'}>
                {m.content}
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>
      </div>
      <div className="chat-input">
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Describe your project idea..."
          className="text-r-14"
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          style={{ width: '100%', height: '100%', resize: 'none', outline: 'none', background: 'transparent' }}
        />
        <button type="button" className="submit-btn" onClick={send} disabled={loading}>
          <div className="text-sb-12">{loading ? '...' : 'Submit'}</div>
        </button>
      </div>
    </div>
  )
}


