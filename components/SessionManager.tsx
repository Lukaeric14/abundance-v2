'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Session {
  id: string
  session_code: string
  current_phase: string
  status: string
  created_at: string
  expires_at: string
  session_participants: any[]
}

interface SessionManagerProps {
  projectId: string
  groupSize: number
}

export default function SessionManager({ projectId, groupSize }: SessionManagerProps) {
  const [sessions, setSessions] = useState<Session[]>([])
  const [participants, setParticipants] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const router = useRouter()

  useEffect(() => {
    loadSessions()
    loadParticipants()
  }, [projectId])

  const loadSessions = async () => {
    try {
      // For now, we'll fetch sessions via a direct query since we don't have a specific endpoint
      // In practice, you'd create a GET endpoint for this
      const response = await fetch(`/api/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_by_project',
          project_id: projectId,
        }),
      })

      if (response.ok) {
        const { sessions } = await response.json()
        setSessions(sessions || [])
      }
    } catch (error) {
      console.error('Failed to load sessions:', error)
    }
  }

  const loadParticipants = async () => {
    try {
      // We'll need to implement this endpoint or use the existing sections API
      const response = await fetch(`/api/sections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          role: 'student',
        }),
      })

      if (response.ok) {
        const data = await response.json()
        // Extract participant info from sections response
        setParticipants(data.participants || [])
      }
    } catch (error) {
      console.error('Failed to load participants:', error)
    }
  }

  const createSession = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          project_id: projectId,
          participant_ids: participants.map(p => p.id),
        }),
      })

      if (response.ok) {
        const { session, url } = await response.json()
        router.push(url)
      } else {
        console.error('Failed to create session')
      }
    } catch (error) {
      console.error('Failed to create session:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const activeSessions = sessions.filter(s => s.status === 'active' || s.status === 'paused')
  const completedSessions = sessions.filter(s => s.status === 'completed')

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Session Management</h3>
        <button
          onClick={createSession}
          disabled={isLoading}
          className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Creating...' : 'Start New Session'}
        </button>
      </div>

      {activeSessions.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Active Sessions</h4>
          <div className="space-y-2">
            {activeSessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200"
              >
                <div>
                  <div className="font-medium text-blue-900">
                    Session {session.session_code}
                  </div>
                  <div className="text-sm text-blue-700">
                    Phase: {session.current_phase} • Status: {session.status}
                  </div>
                  <div className="text-xs text-blue-600">
                    {session.session_participants.length} participant(s) • 
                    Created {new Date(session.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => router.push(`/project/${projectId}/session/${session.session_code}`)}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                  >
                    Join
                  </button>
                  <button
                    onClick={() => {
                      const url = `${window.location.origin}/project/${projectId}/session/${session.session_code}`
                      navigator.clipboard.writeText(url)
                      alert('Session URL copied to clipboard!')
                    }}
                    className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
                  >
                    Copy URL
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {completedSessions.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Completed Sessions</h4>
          <div className="space-y-2">
            {completedSessions.slice(0, 3).map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div>
                  <div className="font-medium text-gray-900">
                    Session {session.session_code}
                  </div>
                  <div className="text-sm text-gray-600">
                    Completed • {new Date(session.created_at).toLocaleDateString()}
                  </div>
                </div>
                <button
                  onClick={() => router.push(`/project/${projectId}/session/${session.session_code}`)}
                  className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
                >
                  Review
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {sessions.length === 0 && (
        <div className="text-center py-8">
          <div className="text-gray-500 mb-2">No sessions yet</div>
          <p className="text-sm text-gray-400">
            Create a session to start NPC roleplay with students
          </p>
        </div>
      )}

      {/* Session URL Instructions */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 mb-2">How Sessions Work</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Each session gets a unique URL that can be shared with students</li>
          <li>• Students progress through phases: Research → Discovery → Planning → Implementation → Reflection</li>
          <li>• Sessions automatically expire after 48 hours</li>
          <li>• Students can leave and return to active sessions</li>
        </ul>
      </div>
    </div>
  )
}