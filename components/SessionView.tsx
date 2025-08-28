'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface Session {
  id: string
  project_id: string
  session_code: string
  current_phase: string
  phase_start_time: string
  total_elapsed_seconds: number
  conversation_history: any[]
  phase_time_limits: Record<string, number>
  status: string
  completion_data: any
  created_at: string
  updated_at: string
  last_accessed_at: string
  expires_at: string
  project: {
    id: string
    title: string
    topic: string
    life_skill: string
    group_size: number
    duration_min: number
    spec_json: any
  }
  session_participants: any[]
  session_phase_history: any[]
}

interface Participant {
  id: string
  project_id: string
  role: string
  seat_number: number | null
  name: string | null
  email: string | null
  meta: any
}

interface SessionViewProps {
  session: Session
  participant: Participant | null
  projectId: string
}

const PHASES = [
  { key: 'research', name: 'Research', description: 'Gather information and understand the problem' },
  { key: 'discovery', name: 'Discovery', description: 'Explore solutions and identify key insights' },
  { key: 'planning', name: 'Planning', description: 'Create a detailed plan of action' },
  { key: 'implementation', name: 'Implementation', description: 'Execute your plan and build solutions' },
  { key: 'reflection', name: 'Reflection', description: 'Review outcomes and lessons learned' },
]

export default function SessionView({ session: initialSession, participant, projectId }: SessionViewProps) {
  const [session, setSession] = useState<Session>(initialSession)
  const [currentPhaseTime, setCurrentPhaseTime] = useState(0)
  const [totalTime, setTotalTime] = useState(initialSession.total_elapsed_seconds)
  const [chatMessage, setChatMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  // Timer effect for current phase
  useEffect(() => {
    const interval = setInterval(() => {
      const phaseStart = new Date(session.phase_start_time).getTime()
      const now = Date.now()
      const elapsed = Math.floor((now - phaseStart) / 1000)
      setCurrentPhaseTime(elapsed)
      setTotalTime(session.total_elapsed_seconds + elapsed)
    }, 1000)

    return () => clearInterval(interval)
  }, [session.phase_start_time, session.total_elapsed_seconds])

  const refreshSession = useCallback(async () => {
    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get',
          session_id: session.id,
        }),
      })

      if (response.ok) {
        const { session: updatedSession } = await response.json()
        setSession(updatedSession)
      }
    } catch (error) {
      console.error('Failed to refresh session:', error)
    }
  }, [session.id])

  const progressToNextPhase = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'progress_phase',
          session_id: session.id,
        }),
      })

      if (response.ok) {
        const { result } = await response.json()
        if (result.completed) {
          // Session completed
          setSession(prev => ({ ...prev, status: 'completed' }))
        } else {
          await refreshSession()
        }
      }
    } catch (error) {
      console.error('Failed to progress phase:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const sendChatMessage = async () => {
    if (!chatMessage.trim()) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_conversation',
          session_id: session.id,
          message: {
            role: 'user',
            content: chatMessage,
            participant_id: participant?.id,
          },
        }),
      })

      if (response.ok) {
        setChatMessage('')
        await refreshSession()
      }
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const pauseSession = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          session_id: session.id,
          updates: { status: 'paused' },
        }),
      })

      if (response.ok) {
        await refreshSession()
      }
    } catch (error) {
      console.error('Failed to pause session:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const resumeSession = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          session_id: session.id,
          updates: { 
            status: 'active',
            phase_start_time: new Date().toISOString(),
          },
        }),
      })

      if (response.ok) {
        await refreshSession()
      }
    } catch (error) {
      console.error('Failed to resume session:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getCurrentPhase = () => {
    return PHASES.find(p => p.key === session.current_phase) || PHASES[0]
  }

  const getCurrentPhaseIndex = () => {
    return PHASES.findIndex(p => p.key === session.current_phase)
  }

  const getPhaseTimeLimit = () => {
    return session.phase_time_limits[session.current_phase] || 0
  }

  const currentPhase = getCurrentPhase()
  const currentPhaseIndex = getCurrentPhaseIndex()
  const phaseTimeLimit = getPhaseTimeLimit()
  const isPhaseTimeUp = currentPhaseTime >= phaseTimeLimit
  const isSessionCompleted = session.status === 'completed'
  const isSessionPaused = session.status === 'paused'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push(`/project/${projectId}`)}
                className="text-gray-500 hover:text-gray-700"
              >
                ← Back to Project
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{session.project.title}</h1>
                <p className="text-sm text-gray-500">Session {session.session_code}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">
                  Total Time: {formatTime(totalTime)}
                </div>
                <div className="text-xs text-gray-500">
                  Phase: {formatTime(currentPhaseTime)} / {formatTime(phaseTimeLimit)}
                </div>
              </div>
              
              {session.status === 'active' && (
                <button
                  onClick={pauseSession}
                  disabled={isLoading}
                  className="bg-yellow-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-yellow-700 disabled:opacity-50"
                >
                  Pause
                </button>
              )}
              
              {session.status === 'paused' && (
                <button
                  onClick={resumeSession}
                  disabled={isLoading}
                  className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                >
                  Resume
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Phase Progress */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Phase Progress</h2>
              
              <div className="space-y-4">
                {PHASES.map((phase, index) => {
                  const isActive = phase.key === session.current_phase
                  const isCompleted = index < currentPhaseIndex
                  const isPaused = isActive && isSessionPaused
                  
                  return (
                    <div
                      key={phase.key}
                      className={`p-4 rounded-lg border-2 ${
                        isActive 
                          ? isPaused 
                            ? 'border-yellow-300 bg-yellow-50' 
                            : 'border-blue-300 bg-blue-50'
                          : isCompleted 
                          ? 'border-green-300 bg-green-50' 
                          : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <h3 className={`font-medium ${
                          isActive ? 'text-blue-900' : isCompleted ? 'text-green-900' : 'text-gray-700'
                        }`}>
                          {phase.name}
                        </h3>
                        {isActive && !isPaused && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            Active
                          </span>
                        )}
                        {isPaused && isActive && (
                          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                            Paused
                          </span>
                        )}
                        {isCompleted && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                            Complete
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{phase.description}</p>
                      
                      {isActive && !isPaused && (
                        <div className="mt-3">
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>{formatTime(currentPhaseTime)}</span>
                            <span>{formatTime(phaseTimeLimit)}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                isPhaseTimeUp ? 'bg-red-500' : 'bg-blue-500'
                              }`}
                              style={{ 
                                width: `${Math.min(100, (currentPhaseTime / phaseTimeLimit) * 100)}%` 
                              }}
                            />
                          </div>
                          {isPhaseTimeUp && (
                            <p className="text-xs text-red-600 mt-1">Time limit reached!</p>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
              
              {!isSessionCompleted && session.status === 'active' && (
                <button
                  onClick={progressToNextPhase}
                  disabled={isLoading}
                  className="w-full mt-6 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {currentPhaseIndex === PHASES.length - 1 ? 'Complete Session' : 'Next Phase'}
                </button>
              )}
              
              {isSessionCompleted && (
                <div className="mt-6 p-4 bg-green-100 rounded-lg">
                  <h3 className="font-medium text-green-900">Session Completed!</h3>
                  <p className="text-sm text-green-700 mt-1">
                    Great work! You've completed all phases.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Current Phase Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  {currentPhase.name} Phase
                </h2>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  session.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : session.status === 'paused'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                </span>
              </div>
              
              <p className="text-gray-600 mb-4">{currentPhase.description}</p>
              
              {participant && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-medium text-blue-900">Your Role</h3>
                  <p className="text-sm text-blue-700">
                    {participant.role === 'student' 
                      ? `Student ${participant.seat_number}${participant.name ? ` - ${participant.name}` : ''}`
                      : 'Teacher'
                    }
                  </p>
                </div>
              )}
            </div>

            {/* Conversation History */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Conversation</h3>
              
              <div className="space-y-4 max-h-64 overflow-y-auto">
                {session.conversation_history.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No messages yet. Start the conversation!</p>
                ) : (
                  session.conversation_history.map((message, index) => (
                    <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.role === 'user' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-100 text-gray-900'
                      }`}>
                        <p className="text-sm">{message.content}</p>
                        <p className="text-xs opacity-75 mt-1">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              {session.status === 'active' && (
                <div className="mt-4 flex space-x-2">
                  <input
                    type="text"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                    placeholder="Type your message..."
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isLoading}
                  />
                  <button
                    onClick={sendChatMessage}
                    disabled={isLoading || !chatMessage.trim()}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                  >
                    Send
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}