import { requireAuth } from '@/lib/auth'
import TeacherView from '@/components/TeacherView'

interface ProjectPageProps {
  params: { id: string }
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  await requireAuth()
  // In future: use params.id to fetch and render project-specific data
  return <TeacherView />
}


