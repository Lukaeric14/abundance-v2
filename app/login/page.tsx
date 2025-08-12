import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

export default function LoginPage() {
  const signIn = async (formData: FormData) => {
    'use server'
    
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    
    const supabase = createClient()
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) {
      redirect('/login?message=Could not authenticate user')
    }
    
    redirect('/')
  }


  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full space-y-8 px-4">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Abundance Projects
          </h1>
          <p className="text-r-16 mt-4 text-muted-foreground">
            Sign in to your account
          </p>
        </div>
        
        <Card className="border-border shadow-lg">
          <CardHeader className="space-y-2">
            <CardTitle className="text-center text-foreground">Welcome back</CardTitle>
            <p className="text-center text-r-14 text-muted-foreground">Enter your credentials to access your account</p>
          </CardHeader>
          <CardContent>
            <form action={signIn} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sb-14 text-foreground">
                  Email address
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="Enter your email"
                  className="h-11"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="password" className="text-sb-14 text-foreground">
                  Password
                </label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  placeholder="Enter your password"
                  className="h-11"
                />
              </div>
              
              <Button type="submit" className="w-full h-11 text-sb-16">
                Sign In
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-r-14 text-muted-foreground">
                Don't have an account?{' '}
                <Link href="/register" className="text-sb-14 text-primary hover:text-primary/80 transition-colors">
                  Create account
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}