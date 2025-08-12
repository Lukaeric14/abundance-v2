import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { User } from '@supabase/supabase-js'

export async function getSession(): Promise<User | null> {
  const supabase = createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()
  
  return user
}

export async function requireAuth(): Promise<User> {
  const user = await getSession()
  
  if (!user) {
    redirect('/login')
  }
  
  return user
}