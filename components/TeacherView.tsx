"use client"
import './TeacherView.css'
import { useEffect, useState } from 'react'
import { createBrowserSupabase } from '@/lib/supabase/client'

const imgAvatarOfTeacherCartoon = "http://localhost:3845/assets/ad01a6641c76cff56de1d4a5dd942885df62bb80.png";

export interface ChatMessageLite {
  role: 'user' | 'assistant'
  content: string
}

export default function TeacherView({ projectTitle, chat }: { projectTitle?: string; chat?: ChatMessageLite[] }) {
  const [objectiveCollapsed, setObjectiveCollapsed] = useState<boolean>(false)
  const [stepsCollapsed, setStepsCollapsed] = useState<boolean>(false)
  const [dataCollapsed, setDataCollapsed] = useState<boolean>(false)
  const [activeViewer, setActiveViewer] = useState<'teacher' | 's1' | 's2' | 's3'>('teacher')
  const [sections, setSections] = useState<any[]>([])

  // PROTOTYPE: fetch via RPC per active viewer; falls back gracefully
  useEffect(() => {
    const run = async () => {
      try {
        const url = typeof window !== 'undefined' ? window.location.pathname : ''
        const projectId = url.split('/project/')[1]?.split('/')[0]
        if (!projectId) return
        const supabase = createBrowserSupabase()
        if (activeViewer === 'teacher') {
          const { data } = await supabase.rpc('get_teacher_sections', { p_project_id: projectId })
          setSections(data || [])
        } else {
          const seat = activeViewer === 's1' ? 1 : activeViewer === 's2' ? 2 : 3
          const { data } = await supabase.rpc('get_student_sections', { p_project_id: projectId, p_seat: seat })
          setSections(data || [])
        }
      } catch {
        setSections([])
      }
    }
    run()
  }, [activeViewer])
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
                <button type="button" className="avatar-btn" onClick={() => setActiveViewer('s2')}>
                  <div className={`student-avatar ${activeViewer === 's2' ? 'selected-avatar' : ''}`}>
                    <div className="text-r-14">SI</div>
                  </div>
                </button>
                {activeViewer === 's2' && (
                  <div className="text-sb-14 selected-student-label">Student 2</div>
                )}
                <button type="button" className="avatar-btn" onClick={() => setActiveViewer('s3')}>
                  <div className={`student-avatar ${activeViewer === 's3' ? 'selected-avatar' : ''}`}>
                    <div className="text-r-14">JK</div>
                  </div>
                </button>
                {activeViewer === 's3' && (
                  <div className="text-sb-14 selected-student-label">Student 3</div>
                )}
              </div>
              {/* Objective collapsed bar when minimized */}
              {objectiveCollapsed && (
                <button
                  type="button"
                  className="collapsed-bar collapsed-wide"
                  onClick={() => setObjectiveCollapsed(false)}
                >
                  <span className="text-sb-14">Objective</span>
                  <span className="chevron">▾</span>
                </button>
              )}
            </div>

            {/* Objective Section */}
            {!objectiveCollapsed && (
              <div className="objective-section section-card">
                <button className="toggle-abs" onClick={() => setObjectiveCollapsed(true)} aria-label="Collapse objective">▴</button>
                <div className="text-sb-14 card-title">{activeViewer === 'teacher' ? 'Objective' : `Objective — ${activeViewer === 's1' ? 'Student 1' : activeViewer === 's2' ? 'Student 2' : 'Student 3'}`}</div>
              </div>
            )}

            {/* Steps and Data Row */}
            <div className="bottom-row">
              <div className="steps-section section-card">
                <button className="toggle-abs" onClick={() => setStepsCollapsed(v => !v)} aria-label="Toggle steps">{stepsCollapsed ? '▾' : '▴'}</button>
                <div className="text-sb-14 card-title">{activeViewer === 'teacher' ? 'Steps' : `Steps — ${activeViewer === 's1' ? 'Student 1' : activeViewer === 's2' ? 'Student 2' : 'Student 3'}`}</div>
                {!stepsCollapsed && (<div className="card-body" />)}
              </div>
              <div className="data-section section-card">
                <button className="toggle-abs" onClick={() => setDataCollapsed(v => !v)} aria-label="Toggle data">{dataCollapsed ? '▾' : '▴'}</button>
                <div className="text-sb-14 card-title">{activeViewer === 'teacher' ? 'Data' : `Data — ${activeViewer === 's1' ? 'Student 1' : activeViewer === 's2' ? 'Student 2' : 'Student 3'}`}</div>
                {!dataCollapsed && (<div className="card-body" />)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}