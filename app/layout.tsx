import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Abundance Projects v0.1',
  description: 'Chat builder for AI-powered conversations',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}