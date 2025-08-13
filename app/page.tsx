import { requireAuth } from '@/lib/auth'
import '@/components/TeacherView.css'
import ChatOnboarding from '@/components/ChatOnboarding'
import Link from 'next/link'

export default async function HomePage() {
  await requireAuth()

  return (
    <div className="teacher-view">
      <div className="topbar">
        <div className="breadcrumb-container">
          <Link href="/" className="abundance-icon" style={{ textDecoration: 'none' }}>
            <div className="icon-bar icon-bar-1" />
            <div className="icon-bar icon-bar-2" />
            <div className="icon-bar icon-bar-3" />
            <div className="icon-bar icon-bar-4" />
            <div className="icon-bar icon-bar-5" />
            <div className="icon-bar icon-bar-6" />
          </Link>
          <div className="text-sb-12 breadcrumb-separator">/</div>
          <div className="breadcrumb-section">
            <div className="text-sb-12 breadcrumb-text">Projects</div>
          </div>
          <div className="text-sb-12 breadcrumb-separator">/</div>
          <div className="text-sb-12 breadcrumb-text">New</div>
        </div>
      </div>

      <div className="main-content" style={{ justifyContent: 'center' }}>
        <ChatOnboarding />
      </div>
    </div>
  )
}