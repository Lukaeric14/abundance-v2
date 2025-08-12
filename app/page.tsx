import { requireAuth } from '@/lib/auth'
import AppShell from '@/components/layout/AppShell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

export default async function HomePage() {
  const user = await requireAuth()

  return (
    <AppShell user={user}>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Chat Builder</h2>
          <p className="text-gray-600 mt-2">
            Build and customize your chat interface
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Choose from pre-built chat templates to get started quickly
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Custom Builder</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Create your own chat interface from scratch with our drag-and-drop builder
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>AI Models</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Configure and customize AI model settings for your chat experience
              </p>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Welcome to Abundance Projects v0.1</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              This is your chat builder dashboard. Here you'll be able to create, 
              customize, and deploy chat interfaces for your projects.
            </p>
            <p className="text-gray-600 mt-4">
              Features coming soon:
            </p>
            <ul className="list-disc list-inside text-gray-600 mt-2 space-y-1">
              <li>Drag-and-drop chat builder</li>
              <li>Multiple AI model integrations</li>
              <li>Custom styling and themes</li>
              <li>Real-time collaboration</li>
              <li>Export and deployment options</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}