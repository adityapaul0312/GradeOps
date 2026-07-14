'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, FlagTriangleRight, CheckCircle2 } from 'lucide-react'
import GradeReportView from '@/components/GradeReportView'
import StatusBadge from '@/components/StatusBadge'
import type { Submission } from '@/lib/types'

export default function SubmissionPage() {
  const params = useParams<{ id: string; subId: string }>()
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [requesting, setRequesting] = useState(false)

  const load = useCallback(async () => {
    const res = await fetch(`/api/assignments/${params.id}/submissions/${params.subId}`)
    const data = await res.json()
    if (data.success) setSubmission(data.submission)
  }, [params.id, params.subId])

  useEffect(() => {
    load()
  }, [load])

  const requestReeval = async () => {
    setRequesting(true)
    try {
      await fetch(`/api/assignments/${params.id}/submissions/${params.subId}/reeval`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'request' }),
      })
      await load()
    } finally {
      setRequesting(false)
    }
  }

  if (!submission) {
    return (
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '3rem 1.5rem' }}>
        <div className="animate-shimmer" style={{ height: 160, borderRadius: 20 }} />
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>
      <Link href={`/assignments/${params.id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem', textDecoration: 'none', marginBottom: '1.25rem' }}>
        <ArrowLeft size={14} /> Back to assignment
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {submission.studentName} <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.9rem' }}>· {submission.rollNumber}</span>
          </p>
          <div style={{ marginTop: 4 }}><StatusBadge status={submission.status} /></div>
        </div>

        {submission.report && !submission.pendingReeval && (
          <button onClick={requestReeval} disabled={requesting} style={btnStyle}>
            <FlagTriangleRight size={14} /> {requesting ? 'Requesting…' : 'Request re-evaluation'}
          </button>
        )}
        {submission.pendingReeval && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', color: 'var(--yellow)' }}>
            <CheckCircle2 size={14} /> Re-evaluation requested — teacher will review
          </span>
        )}
      </div>

      {submission.status === 'failed' && (
        <div style={{ background: 'var(--red-bg)', border: '1px solid var(--red)', borderRadius: 12, padding: '1rem 1.25rem' }}>
          <p style={{ color: 'var(--red)', fontWeight: 600, fontSize: '0.9rem' }}>Grading failed</p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: 4 }}>{submission.error}</p>
        </div>
      )}

      {(submission.status === 'queued' || submission.status === 'grading') && (
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>This submission is still being graded — refresh in a moment.</p>
      )}

      {submission.report && <GradeReportView report={submission.report} />}
    </div>
  )
}

const btnStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.9rem', borderRadius: 8,
  fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', background: 'transparent',
  border: '1px solid var(--border-strong)', color: 'var(--text-primary)',
}
