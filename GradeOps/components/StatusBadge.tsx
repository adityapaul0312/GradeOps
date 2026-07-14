'use client'

import { Clock, Loader2, CheckCircle2, AlertTriangle, XCircle, FileQuestion } from 'lucide-react'
import type { SubmissionStatus } from '@/lib/types'

const CONFIG: Record<SubmissionStatus, { label: string; color: string; bg: string; Icon: any; spin?: boolean }> = {
  not_submitted: { label: 'Not submitted', color: 'var(--text-muted)', bg: 'var(--bg-elevated)', Icon: FileQuestion },
  queued: { label: 'Queued', color: 'var(--text-secondary)', bg: 'var(--bg-elevated)', Icon: Clock },
  grading: { label: 'Grading…', color: 'var(--accent-light)', bg: 'var(--accent-glow)', Icon: Loader2, spin: true },
  done: { label: 'Graded', color: 'var(--green)', bg: 'var(--green-bg)', Icon: CheckCircle2 },
  needs_review: { label: 'Needs review', color: 'var(--yellow)', bg: 'var(--yellow-bg)', Icon: AlertTriangle },
  failed: { label: 'Failed', color: 'var(--red)', bg: 'var(--red-bg)', Icon: XCircle },
}

export default function StatusBadge({ status }: { status: SubmissionStatus }) {
  const c = CONFIG[status] || CONFIG.queued
  const Icon = c.Icon
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
        fontSize: '0.75rem', fontWeight: 600, color: c.color, background: c.bg,
        borderRadius: 99, padding: '0.2rem 0.6rem',
      }}
    >
      <Icon size={12} style={c.spin ? { animation: 'spin-slow 1s linear infinite' } : undefined} />
      {c.label}
    </span>
  )
}
