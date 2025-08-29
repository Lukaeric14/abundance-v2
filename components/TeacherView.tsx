"use client"
import './TeacherView.css'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Steps, { StepData } from './ui/Steps'
import ObjectiveComponent from './ui/ObjectiveComponent'

const imgAvatarOfTeacherCartoon = "http://localhost:3845/assets/ad01a6641c76cff56de1d4a5dd942885df62bb80.png";

export interface ChatMessageLite {
  role: 'user' | 'assistant'
  content: string
}

export default function TeacherView({ projectTitle, chat, mockData, groupSize = 3, projectId, projectStatus = 'unknown' }: { projectTitle?: string; chat?: ChatMessageLite[]; mockData?: any; groupSize?: number; projectId?: string; projectStatus?: string }) {
  const router = useRouter()
  const [objectiveCollapsed, setObjectiveCollapsed] = useState<boolean>(false)
  const [stepsCollapsed, setStepsCollapsed] = useState<boolean>(false)
  const [dataCollapsed, setDataCollapsed] = useState<boolean>(false)
  const [activeViewer, setActiveViewer] = useState<'s1' | 's2'>('s1')
  const [isGenerating, setIsGenerating] = useState(projectStatus === 'generating')
  
  // Update generating state when projectStatus changes
  useEffect(() => {
    setIsGenerating(projectStatus === 'generating')
    console.log('TeacherView: projectStatus =', projectStatus, 'isGenerating =', projectStatus === 'generating')
  }, [projectStatus])
  const formatDataForDisplay = (data: any): string => {
    if (!data || typeof data !== 'object') return String(data)
    
    const lines: string[] = []
    
    Object.entries(data).forEach(([key, value]) => {
      // Convert camelCase/snake_case to Title Case
      const title = key
        .replace(/_/g, ' ')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/\b\w/g, l => l.toUpperCase())
      
      lines.push(`${title}`)
      lines.push('')
      
      if (typeof value === 'object' && value !== null) {
        Object.entries(value).forEach(([subKey, subValue]) => {
          const subTitle = subKey
            .replace(/_/g, ' ')
            .replace(/([a-z])([A-Z])/g, '$1 $2')
            .replace(/\b\w/g, l => l.toUpperCase())
          lines.push(`• ${subTitle}: ${String(subValue)}`)
        })
      } else if (Array.isArray(value)) {
        value.forEach(item => {
          lines.push(`• ${String(item)}`)
        })
      } else {
        lines.push(`• ${String(value)}`)
      }
      lines.push('')
    })
    
    return lines.join('\n').trim()
  }

  const chooseContent = (type: string): string => {
    if (!mockData) return ''
    
    // Student view only
    const seatNumber = activeViewer === 's1' ? '1' : '2'
    const studentData = mockData.students?.[seatNumber]
    
    if (type === 'objective') {
      return studentData?.objective || mockData.shared?.objective || ''
    }
    if (type === 'steps') {
      // For steps, we need to show the current phase tasks for this student
      if (studentData?.phase_tasks) {
        const allTasks: string[] = []
        Object.entries(studentData.phase_tasks).forEach(([phase, tasks]) => {
          allTasks.push(`${phase}:`)
          if (Array.isArray(tasks)) {
            tasks.forEach((task: string) => allTasks.push(`  • ${task}`))
          }
          allTasks.push('')
        })
        return allTasks.join('\n')
      }
      return ''
    }
    if (type === 'data') {
      // For students, show their specific data, but also include shared property details
      let data = studentData?.data || {}
      
      // Also include general property data that both students should see
      if (mockData.data) {
        data = { ...mockData.data, ...data }
      }
      
      return formatDataForDisplay(data)
    }
    
    return ''
  }

  const parseStepsContent = (): StepData[] => {
    if (!mockData) return getDefaultSteps()
    
    // Use the phases directly from mock data
    if (mockData.phases && Array.isArray(mockData.phases)) {
      return mockData.phases.map((phase: any, index: number) => ({
        id: phase.id || (index + 1).toString(),
        title: phase.title || `Phase ${index + 1}`,
        description: phase.description || '',
        duration: phase.duration || '5mins',
        status: phase.status || (index === 0 ? 'completed' : index === 1 ? 'active' : 'pending')
      }))
    }
    
    return getDefaultSteps()
  }

  const getDefaultSteps = (): StepData[] => [
      {
        id: '1',
        title: 'Research Phase',
        description: '1. Conduct a thorough analysis of the water duct requirements and regulations.',
        duration: '5mins',
        status: 'completed'
      },
      {
        id: '2',
        title: 'Discovery Phase',
        description: '2. Develop a comprehensive design plan that meets all necessary specifications.',
        duration: '10mins',
        status: 'active'
      },
      {
        id: '3',
        title: 'Planning Phase',
        description: '3. Assign team members specific tasks related to the design and implementation.',
        duration: '3mins',
        status: 'pending'
      },
      {
        id: '4',
        title: 'Design Phase',
        description: '4. Create a detailed presentation to showcase the design to government representatives.',
        duration: '10mins',
        status: 'pending'
      },
      {
        id: '5',
        title: 'Testing Phase',
        description: '5. Arrange meetings with local authorities to discuss project approvals.',
        duration: '8mins',
        status: 'pending'
      },
      {
        id: '6',
        title: 'Presentation Phase',
        description: '6. Finalize all contracts and ensure compliance with legal standards.',
        duration: '10mins',
        status: 'pending'
      }
    ]

  async function save(type: 'objective' | 'steps' | 'data', text: string) {
    // For now, just log the save operation since we're using mock data
    // In a real implementation, this would update the database or local state
    console.log(`Save ${type}:`, text)
  }

  // No need to fetch from API since we're using mock data directly

  // Poll for project completion when generating
  useEffect(() => {
    if (!isGenerating || !projectId) return

    const pollInterval = setInterval(async () => {
      try {
        // Refresh the page to get updated project data
        window.location.reload()
      } catch (error) {
        console.error('Error checking project status:', error)
      }
    }, 5000) // Poll every 5 seconds

    return () => clearInterval(pollInterval)
  }, [isGenerating, projectId])

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
          {isGenerating && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
              gap: '16px'
            }}>
              <div style={{ 
                width: '40px', 
                height: '40px', 
                border: '3px solid #f0f0f0', 
                borderTop: '3px solid #D7AC00',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
              <div className="text-sb-14" style={{ color: '#666' }}>
                Generating your project...
              </div>
              <div className="text-r-12" style={{ color: '#999', textAlign: 'center', maxWidth: '300px' }}>
                This may take up to 30 seconds. The page will refresh automatically when complete.
              </div>
            </div>
          )}
          <div className="project-content">
            {/* Header with Students Only */}
            <div className="project-header">
              <div className="students-section">
                <button type="button" className="avatar-btn" onClick={() => setActiveViewer('s1')}>
                  <div className={`student-avatar ${activeViewer === 's1' ? 'selected-avatar' : ''}`}>
                    <div className="text-r-14">BY</div>
                  </div>
                </button>
                {activeViewer === 's1' && (
                  <div className="text-sb-14 selected-student-label">Buyer</div>
                )}
                <button type="button" className="avatar-btn" onClick={() => setActiveViewer('s2')}>
                  <div className={`student-avatar ${activeViewer === 's2' ? 'selected-avatar' : ''}`}>
                    <div className="text-r-14">SE</div>
                  </div>
                </button>
                {activeViewer === 's2' && (
                  <div className="text-sb-14 selected-student-label">Seller</div>
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
            <ObjectiveComponent 
              projectOverview="Navigate a real estate transaction from initial research to closing"
              userRole={activeViewer === 's1' ? 'Homebuyer - First-time buyer seeking best value' : 'Home Seller - Relocating and motivated to sell'}
              userObjective={chooseContent('objective') || 'Complete your role in this real estate transaction'}
              isCollapsible={true}
              isCollapsed={objectiveCollapsed}
              onToggleCollapse={() => setObjectiveCollapsed(!objectiveCollapsed)}
            />

            {/* Steps and Data Row */}
            <div className="bottom-row">
              {!stepsCollapsed && (
                <div className="steps-standalone-wrapper">
                  <Steps 
                    steps={parseStepsContent()} 
                    onCollapse={() => setStepsCollapsed(true)}
                  />
                </div>
              )}
              {stepsCollapsed && (
                <button
                  type="button"
                  className="collapsed-bar"
                  onClick={() => setStepsCollapsed(false)}
                  title="Click to expand Steps"
                >
                  <span className="text-r-14 collapsed-text">Steps</span>
                  <span className="chevron">▾</span>
                </button>
              )}
              <div className="data-section section-card">
                <button className="toggle-abs" onClick={() => setDataCollapsed(v => !v)} aria-label="Toggle data">{dataCollapsed ? '▾' : '▴'}</button>
                <div className="text-sb-14 card-title">{`Data — ${activeViewer === 's1' ? 'Buyer' : 'Seller'}`}</div>
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