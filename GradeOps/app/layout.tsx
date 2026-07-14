import type { Metadata } from 'next'
import './globals.css'
import Nav from '@/components/Nav'

export const metadata: Metadata = {
  title: 'GradeOps — Assignment-based Answer Sheet Grading',
  description: 'Create an assignment once, grade every student submission against it with AI.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div
          style={{
            position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
            background:
              'radial-gradient(ellipse 80% 50% at 20% -10%, rgba(124,109,250,0.12) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 110%, rgba(52,211,153,0.07) 0%, transparent 60%)',
          }}
        />
        <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh' }}>
          <Nav />
          {children}
        </div>
      </body>
    </html>
  )
}
