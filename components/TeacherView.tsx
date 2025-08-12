import './TeacherView.css'

const imgAvatarOfTeacherCartoon = "http://localhost:3845/assets/ad01a6641c76cff56de1d4a5dd942885df62bb80.png";
const imgFrame14 = "http://localhost:3845/assets/ca2454b2a62c0d67707d892390c722de77e1b02f.svg";

export default function TeacherView() {
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
            <div className="dropdown-arrow">
              <img alt="" src={imgFrame14} />
            </div>
          </div>
          <div className="text-sb-12 breadcrumb-separator">/</div>
          <div className="text-sb-12 breadcrumb-text">Real Estate & Fractions Project</div>
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
              <div className="user-message">
                <div className="text-r-12">Real Estate project for 3 students teaching fractions</div>
              </div>
            </div>
            
            {/* Project Description */}
            <div className="project-description">
              <div className="abundance-icon-small">
                <div className="icon-bar icon-bar-1" />
                <div className="icon-bar icon-bar-2" />
                <div className="icon-bar icon-bar-3" />
                <div className="icon-bar icon-bar-4" />
                <div className="icon-bar icon-bar-5" />
                <div className="icon-bar icon-bar-6" />
              </div>
              <div className="text-r-12">
                This project aims to engage three students in a hands-on real estate exercise that incorporates the
                concept of fractions. By simulating property transactions, students will learn to calculate areas,
                determine property values, and understand how fractions play a crucial role in real estate
                measurements. The exercise will not only enhance their mathematical skills but also provide practical
                insights into the real estate market, fostering teamwork and critical thinking as they collaborate on
                their project.
              </div>
            </div>
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
                <div 
                  className="teacher-avatar"
                  style={{ backgroundImage: `url('${imgAvatarOfTeacherCartoon}')` }}
                />
                <div className="text-sb-14">You (Teacher)</div>
              </div>
              <div className="students-section">
                <div className="student-avatar">
                  <div className="text-r-14">LE</div>
                </div>
                <div className="student-avatar">
                  <div className="text-r-14">SI</div>
                </div>
                <div className="student-avatar">
                  <div className="text-r-14">JK</div>
                </div>
              </div>
            </div>

            {/* Objective Section */}
            <div className="objective-section">
              <div className="text-sb-16">Objective</div>
            </div>

            {/* Steps and Data Row */}
            <div className="bottom-row">
              <div className="steps-section">
                <div className="text-sb-16">Steps</div>
              </div>
              <div className="data-section">
                <div className="text-sb-16">Data</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}