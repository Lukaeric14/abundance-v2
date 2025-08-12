import { requireAuth } from '@/lib/auth'
import TeacherView from '@/components/TeacherView'

export default async function HomePage() {
  const user = await requireAuth()

  return <TeacherView />
}