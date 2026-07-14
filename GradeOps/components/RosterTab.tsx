'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { Download, Upload, ExternalLink, AlertTriangle } from 'lucide-react'
import StatusBadge from './StatusBadge'
import type { Assignment, Submission } from '@/lib/types'

interface Props {
  assignment: Assignment
  roster: Submission[]
  onChanged: () => void
}

export default function RosterTab({ assignment, roster, onChanged }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importing, setImporting] = useState(false)
  const [importMsg, setImportMsg] = useState<string | null>(null)

  const pendingReeval = roster.filter((s) => s.pendingReeval)

  const handleImportFile = async (file: File) => {
    setImporting(true)
    setImportMsg(null)
    try {
      const text = await file.text()
      const res = await fetch(`/api/assignments/${assignment.id}/roster`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv: text }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      setImportMsg(`Added ${data.added} students${data.skipped ? `, skipped ${data.skipped} already on the roster` : ''}.`)
      onChanged()
    } catch (err: any) {
      setImportMsg(err.message || 'Import failed')
    } finally {
      setImporting(false)
    }
  }

  const approveRegrade = async (submissionId: string) => {
    await fetch(`/api/assignments/${assignment.id}/submissions/${submissionId}/reeval`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'regrade' }),
    })
    onChanged()
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => fileInputRef.current?.click()} disabled={importing} style={btnStyle}>
            <Upload size={14} /> {importing ? 'Importing…' : 'Import roster CSV'}
          </button>
          <input
            ref={fileInputRef} type="file" accept=".csv" style={{ display: 'none' }}
            onChange={(e) => e.target.files?.[0] && handleImportFile(e.target.files[0])}
          />
          <a href={`/api/assignments/${assignment.id}/export`} style={{ ...btnStyle, textDecoration: 'none' }}>
            <Download size={14} /> Export gradebook CSV
          </a>
        </div>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          CSV columns: name, roll number, email (optional)
        </span>
      </div>

      {importMsg && (
        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>{importMsg}</p>
      )}

      {pendingReeval.length > 0 && (
        <div style={{ background: 'var(--yellow-bg)', border: '1px solid var(--yellow)', borderRadius: 10, padding: '0.75rem 1rem', marginBottom: '1.25rem' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--yellow)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            <AlertTriangle size={14} /> {pendingReeval.length} student(s) requested re-evaluation
          </p>
        </div>
      )}

      {roster.length === 0 && (
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>
          No students yet — grade a submission or import a roster CSV to get started.
        </p>
      )}

      {roster.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Roll No.', 'Name', 'Status', 'Marks', 'Grade', '', ''].map((h) => (
                  <th key={h} style={{ textAlign: 'left', padding: '0.6rem 0.5rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {roster.map((s) => (
                <tr key={s.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.6rem 0.5rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{s.rollNumber}</td>
                  <td style={{ padding: '0.6rem 0.5rem', color: 'var(--text-primary)', fontWeight: 500 }}>{s.studentName}</td>
                  <td style={{ padding: '0.6rem 0.5rem' }}><StatusBadge status={s.status} /></td>
                  <td style={{ padding: '0.6rem 0.5rem', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                    {s.report ? `${s.report.obtainedMarks}/${s.report.totalMarks}` : '—'}
                  </td>
                  <td style={{ padding: '0.6rem 0.5rem', color: 'var(--text-secondary)' }}>{s.report?.grade || '—'}</td>
                  <td style={{ padding: '0.6rem 0.5rem' }}>
                    {s.pendingReeval && (
                      <button onClick={() => approveRegrade(s.id)} style={{ ...btnStyle, borderColor: 'var(--yellow)', color: 'var(--yellow)' }}>
                        Re-grade
                      </button>
                    )}
                  </td>
                  <td style={{ padding: '0.6rem 0.5rem' }}>
                    {s.report && (
                      <Link href={`/assignments/${assignment.id}/submissions/${s.id}`} style={{ color: 'var(--accent-light)', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem', textDecoration: 'none' }}>
                        View <ExternalLink size={12} />
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

const btnStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.8rem', borderRadius: 8,
  fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', background: 'transparent',
  border: '1px solid var(--border-strong)', color: 'var(--text-primary)',
}
