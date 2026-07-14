'use client'

import { useEffect, useState } from 'react'

const STEPS = [
  { icon: '🔍', text: 'Reading answer sheet...' },
  { icon: '🧠', text: 'Identifying questions...' },
  { icon: '✏️', text: 'Evaluating answers...' },
  { icon: '📊', text: 'Calculating grades...' },
  { icon: '💬', text: 'Writing feedback...' },
]

export default function LoadingState() {
  const [step, setStep] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setStep(s => (s + 1) % STEPS.length), 1800)
    return () => clearInterval(id)
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3rem 2rem', gap: '2rem' }}>
      <div style={{ position: 'relative', width: 72, height: 72 }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '3px solid var(--border)' }} />
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          border: '3px solid transparent',
          borderTopColor: 'var(--accent)',
          borderRightColor: 'var(--accent-light)',
          animation: 'spin-slow 1s linear infinite',
        }} />
        <div style={{
          position: 'absolute', inset: 8, borderRadius: '50%',
          background: 'var(--accent-glow)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.5rem',
        }}>
          {STEPS[step].icon}
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
          {STEPS[step].text}
        </p>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          This may take 15–30 seconds depending on sheet complexity
        </p>
      </div>

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {[80, 60, 90].map((w, i) => (
          <div key={i} className="animate-shimmer" style={{ height: 14, borderRadius: 7, width: `${w}%` }} />
        ))}
      </div>
    </div>
  )
}