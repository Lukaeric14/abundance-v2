"use client"
import './TeacherView.css'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import WorkingContainer from './WorkingContainer'

export interface ChatMessageLite {
  role: 'user' | 'assistant'
  content: string
}

export default function StudentView({ 
  projectTitle, 
  mockData, 
  projectId, 
  projectStatus = 'unknown',
  studentRole = 's1' // 's1' for Buyer, 's2' for Seller
}: { 
  projectTitle?: string
  mockData?: any
  projectId?: string
  projectStatus?: string
  studentRole?: 's1' | 's2'
}) {
  const router = useRouter()
  const [chatMessages, setChatMessages] = useState<ChatMessageLite[]>([])
  const [chatInput, setChatInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChatSubmit = async () => {
    if (!chatInput.trim() || isSubmitting) return

    const newMessage: ChatMessageLite = {
      role: 'user',
      content: chatInput.trim()
    }

    setIsSubmitting(true)
    setChatMessages(prev => [...prev, newMessage])
    setChatInput('')

    try {
      // Simulate ChatGPT response (pass-through LLM, not tied to project)
      // In a real implementation, this would call an API endpoint
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API delay
      
      const assistantResponse: ChatMessageLite = {
        role: 'assistant',
        content: `I understand you're working on "${projectTitle || 'this project'}". How can I help you with your role as a ${studentRole === 's1' ? 'buyer' : 'seller'}? I can provide general guidance, explain concepts, or help you think through your approach.`
      }

      setChatMessages(prev => [...prev, assistantResponse])
    } catch (error) {
      console.error('Error getting chat response:', error)
      const errorResponse: ChatMessageLite = {
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again.'
      }
      setChatMessages(prev => [...prev, errorResponse])
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleChatSubmit()
    }
  }

  return (
    <div className="teacher-view">
      {/* Top Bar */}
      <div className="topbar">
        <div className="breadcrumb-container">
          <button type="button" className="abundance-icon" onClick={() => router.push('/')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <div className="icon-bar icon-bar-1" />
            <div className="icon-bar icon-bar-2" />
            <div className="icon-bar icon-bar-3" />
            <div className="icon-bar icon-bar-4" />
            <div className="icon-bar icon-bar-5" />
            <div className="icon-bar icon-bar-6" />
          </button>
          <div className="text-sb-12 breadcrumb-separator">/</div>
          <div className="breadcrumb-section">
            <div className="text-sb-12 breadcrumb-text">{studentRole === 's1' ? 'Design a water duct system' : 'Design a water duct system'}</div>
          </div>
          <div className="text-sb-12 breadcrumb-separator">/</div>
          <div className="text-sb-12 breadcrumb-text">
            Current: {studentRole === 's1' ? 'Research Phase' : 'Research Phase'}
          </div>
          <div className="text-sb-12 breadcrumb-separator">/</div>
          <div className="text-sb-12 breadcrumb-text">
            Next Phase: {studentRole === 's1' ? 'Interview in 3:15mins' : 'Interview in 3:15mins'}
          </div>
        </div>
        <div className="buttons-container">
          <div className="save-project-btn">
            <div className="text-sb-12 button-text">02:45</div>
          </div>
          <div className="go-live-btn">
            <div className="text-sb-12 button-text">Submit</div>
          </div>
        </div>
      </div>

      {/* Main Content - Two Container Shell */}
      <div className="main-content">
        {/* Working Container - Left Side */}
        <WorkingContainer
          mockData={mockData}
          projectTitle={projectTitle}
          projectStatus={projectStatus}
          projectId={projectId}
          activeViewer={studentRole}
          showStudentSwitcher={false}
          onActiveViewerChange={() => {}} // No switching in student view
        />

        {/* Chat Container - Right Side */}
        <div className="chat-container">
          <div className="chat-content">
            {/* Chat Header */}
            <div className="chat-header" style={{ padding: '16px', borderBottom: '1px solid #e0e0e0' }}>
              <div className="text-sb-14">ChatGPT Assistant</div>
              <div className="text-r-12" style={{ color: '#666', marginTop: '4px' }}>
                General help and guidance (not project-specific)
              </div>
            </div>

            {/* Chat Messages */}
            <div className="chat-messages" style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
              {chatMessages.length === 0 && (
                <div className="text-r-12" style={{ color: '#999', textAlign: 'center', padding: '20px' }}>
                  Ask ChatGPT for help with concepts, strategies, or general guidance...
                </div>
              )}
              {chatMessages.map((message, idx) => (
                message.role === 'user' ? (
                  <div key={idx} className="user-message" style={{ 
                    marginBottom: '16px',
                    padding: '12px',
                    backgroundColor: '#f0f8ff',
                    borderRadius: '8px',
                    marginLeft: '20%'
                  }}>
                    <div className="text-r-12">{message.content}</div>
                  </div>
                ) : (
                  <div key={idx} className="assistant-message" style={{
                    marginBottom: '16px',
                    padding: '12px',
                    backgroundColor: '#f9f9f9',
                    borderRadius: '8px',
                    marginRight: '20%'
                  }}>
                    <div className="text-r-12">{message.content}</div>
                  </div>
                )
              ))}
              {isSubmitting && (
                <div className="assistant-message" style={{
                  marginBottom: '16px',
                  padding: '12px',
                  backgroundColor: '#f9f9f9',
                  borderRadius: '8px',
                  marginRight: '20%'
                }}>
                  <div className="text-r-12" style={{ color: '#666' }}>Thinking...</div>
                </div>
              )}
            </div>
            
            {/* End Chat Messages */}
          </div>
          
          {/* Chat Input */}
          <div className="chat-input" style={{ 
            padding: '16px', 
            borderTop: '1px solid #e0e0e0',
            display: 'flex',
            gap: '12px',
            alignItems: 'center'
          }}>
            <input
              type="text"
              className="text-r-14"
              placeholder="Ask ChatGPT..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isSubmitting}
              style={{
                flex: 1,
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                outline: 'none'
              }}
            />
            <button
              className="submit-btn"
              onClick={handleChatSubmit}
              disabled={!chatInput.trim() || isSubmitting}
              style={{
                padding: '12px 20px',
                backgroundColor: chatInput.trim() && !isSubmitting ? '#D7AC00' : '#ccc',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: chatInput.trim() && !isSubmitting ? 'pointer' : 'not-allowed'
              }}
            >
              <div className="text-sb-12">
                {isSubmitting ? 'Sending...' : 'Send'}
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
