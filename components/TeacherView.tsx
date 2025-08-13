"use client"
import './TeacherView.css'
import { useEffect, useRef, useState } from 'react'
import { createBrowserSupabase } from '@/lib/supabase/client'

const imgAvatarOfTeacherCartoon = "http://localhost:3845/assets/ad01a6641c76cff56de1d4a5dd942885df62bb80.png";

export interface ChatMessageLite {
  role: 'user' | 'assistant'
  content: string
}

export default function TeacherView({ projectTitle, chat, initialSections = [], allSections = [], groupSize = 3, projectId }: { projectTitle?: string; chat?: ChatMessageLite[]; initialSections?: any[]; allSections?: any[]; groupSize?: number; projectId?: string }) {
  const [objectiveCollapsed, setObjectiveCollapsed] = useState<boolean>(false)
  const [stepsCollapsed, setStepsCollapsed] = useState<boolean>(false)
  const [dataCollapsed, setDataCollapsed] = useState<boolean>(false)
  const [activeViewer, setActiveViewer] = useState<'teacher' | 's1' | 's2' | 's3'>('teacher')
  const [sections, setSections] = useState<any[]>(initialSections)
  const cachedAllRef = useRef(allSections)
  const chooseContent = (type: string): string => {
    const specific = sections.find((s: any) => s.section_type === type && typeof s.seat_number === 'number' && s.seat_number > 0)
    const shared = sections.find((s: any) => s.section_type === type && (s.seat_number === null || typeof s.seat_number === 'undefined'))
    const teacher = sections.find((s: any) => s.section_type === type && s.seat_number === 0)
    // When viewing teacher, RPC already returns only seat 0. For students, prefer specific>shared
    return (specific ?? shared ?? teacher)?.content_text || ''
  }

  const findSectionId = (type: string): string | undefined => {
    const specific = sections.find((s: any) => s.section_type === type && typeof s.seat_number === 'number' && s.seat_number > 0)
    const shared = sections.find((s: any) => s.section_type === type && (s.seat_number === null || typeof s.seat_number === 'undefined'))
    const teacher = sections.find((s: any) => s.section_type === type && s.seat_number === 0)
    return (specific ?? shared ?? teacher)?.id
  }

  async function save(type: 'objective' | 'steps' | 'data', text: string) {
    const id = findSectionId(type)
    if (!id) return
    await fetch('/api/sections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ update: { id, content_text: text } }),
    })
    // Update local cache
    setSections(prev => prev.map((s: any) => (s.id === id ? { ...s, content_text: text } : s)))
    cachedAllRef.current = cachedAllRef.current.map((s: any) => (s.id === id ? { ...s, content_text: text } : s))
  }

  // PROTOTYPE: fetch via RPC per active viewer; falls back gracefully
  // Use server API to avoid exposing client keys; no env required client-side

  useEffect(() => {
    const run = async () => {
      try {
        if (!projectId) return
        const payload =
          activeViewer === 'teacher'
            ? { projectId, role: 'teacher' }
            : { projectId, role: 'student', seat: activeViewer === 's1' ? 1 : activeViewer === 's2' ? 2 : 3 }

        // Try local cache first
        const seat = payload.role === 'student' ? (payload as any).seat : 0
        const cached = cachedAllRef.current.filter((s: any) => {
          if (seat === 0) return s.seat_number === 0
          return s.seat_number === null || s.seat_number === seat
        })
        if (cached.length > 0) {
          setSections(cached)
          return
        }

        const res = await fetch('/api/sections', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const json = await res.json()
        if (res.ok && Array.isArray(json.sections)) {
          setSections(json.sections)
          // merge into cache
          cachedAllRef.current = [...cachedAllRef.current, ...json.sections]
        }
      } catch {
        // keep previous sections on error to avoid flicker
      }
    }
    run()
  }, [activeViewer, projectId])
  return (
    <div className="teacher-view">
      {/* Top Bar */}
      <div className="topbar">
        <div className="breadcrumb-container">
          <div className="abundance-icon">
            <div className="icon-bar icon-bar-1" />
            <div className="icon-bar icon-bar-2" />
            <div className="icon-bar icon-bar-3" />
            <div className="icon-bar icon-bar-4" />
            <div className="icon-bar icon-bar-5" />
            <div className="icon-bar icon-bar-6" />
          </div>
          <div className="text-sb-12 breadcrumb-separator">/</div>
          <div className="breadcrumb-section">
            <div className="text-sb-12 breadcrumb-text">Numbers</div>
            <div className="internal-tag">
              <div className="text-sb-12 internal-text">Internal</div>
            </div>
          </div>
          <div className="text-sb-12 breadcrumb-separator">/</div>
          <div className="text-sb-12 breadcrumb-text">{projectTitle ?? 'Untitled Project'}</div>
        </div>
        <div className="buttons-container">
          <div className="save-project-btn">
            <div className="text-sb-12 button-text">Save Project</div>
          </div>
          <div className="go-live-btn">
            <div className="text-sb-12 button-text">Go Live</div>
          </div>
        </div>
      </div>

      {/* Main Content - Two Container Shell */}
      <div className="main-content">
        {/* Chat UI Container - Left Side */}
        <div className="chat-container">
          <div className="chat-content">
            {/* Chat Message */}
            <div className="chat-messages">
              {(chat ?? []).map((m, idx) => (
                m.role === 'user' ? (
                  <div key={idx} className="user-message">
                    <div className="text-r-12">{m.content}</div>
                  </div>
                ) : (
                  <div key={idx} className="project-description">
                    <div className="abundance-icon-small">
                      <div className="icon-bar icon-bar-1" />
                      <div className="icon-bar icon-bar-2" />
                      <div className="icon-bar icon-bar-3" />
                      <div className="icon-bar icon-bar-4" />
                      <div className="icon-bar icon-bar-5" />
                      <div className="icon-bar icon-bar-6" />
                    </div>
                    <div className="text-r-12">{m.content}</div>
                  </div>
                )
              ))}
            </div>
            
            {/* End Chat Messages */}
          </div>
          
          {/* Chat Input */}
          <div className="chat-input">
            <div className="text-r-14">Ask Abundance...</div>
            <div className="submit-btn">
              <div className="text-sb-12">Submit</div>
            </div>
          </div>
        </div>

        {/* Project Container - Right Side */}
        <div className="project-container">
          <div className="project-content">
            {/* Header with Teacher and Students */}
            <div className="project-header">
              <div className="teacher-section">
                <button type="button" className="avatar-btn" onClick={() => setActiveViewer('teacher')}>
                  <div 
                    className={`teacher-avatar ${activeViewer === 'teacher' ? 'selected-avatar' : ''}`}
                    style={{ backgroundImage: `url('${imgAvatarOfTeacherCartoon}')` }}
                  />
                </button>
                {activeViewer === 'teacher' && (
                  <div className="text-sb-14">You (Teacher)</div>
                )}
              </div>
              <div className="students-section">
                <button type="button" className="avatar-btn" onClick={() => setActiveViewer('s1')}>
                  <div className={`student-avatar ${activeViewer === 's1' ? 'selected-avatar' : ''}`}>
                    <div className="text-r-14">LE</div>
                  </div>
                </button>
                {activeViewer === 's1' && (
                  <div className="text-sb-14 selected-student-label">Student 1</div>
                )}
                {groupSize >= 2 && (
                  <>
                    <button type="button" className="avatar-btn" onClick={() => setActiveViewer('s2')}>
                      <div className={`student-avatar ${activeViewer === 's2' ? 'selected-avatar' : ''}`}>
                        <div className="text-r-14">SI</div>
                      </div>
                    </button>
                    {activeViewer === 's2' && (
                      <div className="text-sb-14 selected-student-label">Student 2</div>
                    )}
                  </>
                )}
                {groupSize >= 3 && (
                  <>
                    <button type="button" className="avatar-btn" onClick={() => setActiveViewer('s3')}>
                      <div className={`student-avatar ${activeViewer === 's3' ? 'selected-avatar' : ''}`}>
                        <div className="text-r-14">JK</div>
                      </div>
                    </button>
                    {activeViewer === 's3' && (
                      <div className="text-sb-14 selected-student-label">Student 3</div>
                    )}
                  </>
                )}
              </div>
              {/* Objective collapsed bar when minimized */}
              {objectiveCollapsed && (
                <button
                  type="button"
                  className="collapsed-bar collapsed-wide"
                  onClick={() => setObjectiveCollapsed(false)}
                  title="Click to expand Objective"
                >
                  <span className="text-r-14 collapsed-text">{chooseContent('objective') || 'Objective'}</span>
                  <span className="chevron">▾</span>
                </button>
              )}
            </div>

            {/* Objective Section */}
            {!objectiveCollapsed && (
              <div className="objective-section section-card">
                <button className="toggle-abs" onClick={() => setObjectiveCollapsed(true)} aria-label="Collapse objective">▴</button>
                <div className="text-sb-14 card-title">{activeViewer === 'teacher' ? 'Objective' : `Objective — ${activeViewer === 's1' ? 'Student 1' : activeViewer === 's2' ? 'Student 2' : 'Student 3'}`}</div>
                <EditableArea
                  initialValue={chooseContent('objective')}
                  onSave={(t) => save('objective', t)}
                />
              </div>
            )}

            {/* Steps and Data Row */}
            <div className="bottom-row">
              <div className="steps-section section-card">
                <button className="toggle-abs" onClick={() => setStepsCollapsed(v => !v)} aria-label="Toggle steps">{stepsCollapsed ? '▾' : '▴'}</button>
                <div className="text-sb-14 card-title">{activeViewer === 'teacher' ? 'Steps' : `Steps — ${activeViewer === 's1' ? 'Student 1' : activeViewer === 's2' ? 'Student 2' : 'Student 3'}`}</div>
                {!stepsCollapsed && (
                  <EditableArea
                    initialValue={chooseContent('steps')}
                    onSave={(t) => save('steps', t)}
                  />
                )}
              </div>
              <div className="data-section section-card">
                <button className="toggle-abs" onClick={() => setDataCollapsed(v => !v)} aria-label="Toggle data">{dataCollapsed ? '▾' : '▴'}</button>
                <div className="text-sb-14 card-title">{activeViewer === 'teacher' ? 'Data' : `Data — ${activeViewer === 's1' ? 'Student 1' : activeViewer === 's2' ? 'Student 2' : 'Student 3'}`}</div>
                {!dataCollapsed && (
                  <EditableArea
                    initialValue={chooseContent('data')}
                    onSave={(t) => save('data', t)}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EditableArea({ initialValue, onSave }: { initialValue: string; onSave: (text: string) => void }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(initialValue)
  useEffect(() => setValue(initialValue), [initialValue])

  return (
    <div className={"card-body editable"} onClick={() => setEditing(true)}>
      {editing ? (
        <textarea
          className="text-r-14"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={() => {
            setEditing(false)
            if (value !== initialValue) onSave(value)
          }}
          autoFocus
          style={{ width: '100%', height: '100%', minHeight: 120, resize: 'vertical', outline: 'none', background: 'transparent', whiteSpace: 'pre-wrap', padding: 10 }}
        />
      ) : (
        <div className="text-r-14" style={{ padding: 10, whiteSpace: 'pre-wrap' }}>
          {value || ''}
        </div>
      )}
    </div>
  )
}