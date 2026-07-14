'use client'

import { useEffect, useState } from 'react'
import { Loader2, UploadCloud, X } from 'lucide-react'
import UploadZone from './UploadZone'
import LoadingState from './LoadingState'
import GradeReportView from './GradeReportView'
import StatusBadge from './StatusBadge'
import type { Assignment, Submission } from '@/lib/types'

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

// Heuristic: batch file names like "24BIO001_Rahul.jpg" or "24BIO001.png" ->
// roll number is the token before the first underscore/space/dot.
function guessRollFromFilename(name: string): string {
  return name.split(/[_\s.]/)[0] || ''
}

interface BatchItem {
  file: File
  preview: string
  studentName: string
  rollNumber: string
  email: string
  matched: boolean
}

interface Props {
  assignment: Assignment
  roster: Submission[]
  onGraded: () => void
}

export default function GradeTab({ assignment, roster, onGraded }: Props) {
  const [mode, setMode] = useState<'single' | 'batch'>('single')

  // ---- single submission state ----
  const [studentName, setStudentName] = useState('')
  const [rollNumber, setRollNumber] = useState('')
  const [email, setEmail] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [activeSubmissionId, setActiveSubmissionId] = useState<string | null>(null)
  const [activeSubmission, setActiveSubmission] = useState<Submission | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null)

  // ---- batch state ----
  const [batch, setBatch] = useState<BatchItem[]>([])
  const [batchSubmitting, setBatchSubmitting] = useState(false)

  const pendingRoster = roster.filter((s) => s.status === 'not_submitted')

  const handleFile = async (f: File) => {
    setFile(f)
    setPreview(await fileToDataUrl(f))
    const guess = guessRollFromFilename(f.name)
    const match = roster.find((s) => s.rollNumber.toLowerCase() === guess.toLowerCase())
    if (match && !studentName && !rollNumber) {
      setStudentName(match.studentName)
      setRollNumber(match.rollNumber)
      setEmail(match.email || '')
    }
  }

  const pickRosterEntry = (id: string) => {
    const s = roster.find((r) => r.id === id)
    if (!s) return
    setStudentName(s.studentName)
    setRollNumber(s.rollNumber)
    setEmail(s.email || '')
  }

  const submitSingle = async (force = false) => {
    if (!file || !preview || !studentName || !rollNumber) return
    setSubmitting(true)
    setError(null)
    setDuplicateWarning(null)
    try {
      const res = await fetch(`/api/assignments/${assignment.id}/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentName, rollNumber, email: email || undefined, answerSheetImage: preview, force }),
      })
      const data = await res.json()
      if (!data.success) {
        if (data.duplicate) {
          setDuplicateWarning(data.error)
          setSubmitting(false)
          return
        }
        throw new Error(data.error || 'Grading failed to start')
      }
      setActiveSubmissionId(data.submission.id)
      setActiveSubmission(data.submission)
      onGraded()
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  // Poll active submission until it's done/failed/needs_review
  useEffect(() => {
    if (!activeSubmissionId) return
    if (activeSubmission && ['done', 'failed', 'needs_review'].includes(activeSubmission.status)) return
    const id = setInterval(async () => {
      const res = await fetch(`/api/assignments/${assignment.id}/submissions/${activeSubmissionId}`)
      const data = await res.json()
      if (data.success) {
        setActiveSubmission(data.submission)
        if (['done', 'failed', 'needs_review'].includes(data.submission.status)) {
          onGraded()
        }
      }
    }, 2500)
    return () => clearInterval(id)
  }, [activeSubmissionId, activeSubmission, assignment.id])

  const resetSingle = () => {
    setStudentName('')
    setRollNumber('')
    setEmail('')
    setFile(null)
    setPreview(null)
    setActiveSubmissionId(null)
    setActiveSubmission(null)
    setError(null)
    setDuplicateWarning(null)
  }

  const handleBatchFiles = async (files: File[]) => {
    const items: BatchItem[] = await Promise.all(
      files.map(async (f) => {
        const preview = await fileToDataUrl(f)
        const guess = guessRollFromFilename(f.name)
        const match = roster.find((s) => s.rollNumber.toLowerCase() === guess.toLowerCase())
        return {
          file: f,
          preview,
          studentName: match?.studentName || '',
          rollNumber: match?.rollNumber || guess,
          email: match?.email || '',
          matched: !!match,
        }
      })
    )
    setBatch(items)
  }

  const updateBatchItem = (idx: number, patch: Partial<BatchItem>) => {
    setBatch((b) => b.map((item, i) => (i === idx ? { ...item, ...patch } : item)))
  }

  const removeBatchItem = (idx: number) => {
    setBatch((b) => b.filter((_, i) => i !== idx))
  }

  const submitBatch = async () => {
    setBatchSubmitting(true)
    for (const item of batch) {
      if (!item.studentName || !item.rollNumber) continue
      try {
        await fetch(`/api/assignments/${assignment.id}/submissions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentName: item.studentName,
            rollNumber: item.rollNumber,
            email: item.email || undefined,
            answerSheetImage: item.preview,
            force: true,
          }),
        })
      } catch {
        // individual failures surface later in the roster tab's status column
      }
    }
    setBatchSubmitting(false)
    setBatch([])
    onGraded()
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
        {(['single', 'batch'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            style={{
              padding: '0.4rem 0.9rem', borderRadius: 8, fontSize: '0.82rem', fontWeight: 600,
              border: `1px solid ${mode === m ? 'var(--accent)' : 'var(--border)'}`,
              background: mode === m ? 'var(--accent-glow)' : 'transparent',
              color: mode === m ? 'var(--accent-light)' : 'var(--text-secondary)', cursor: 'pointer',
            }}
          >
            {m === 'single' ? 'One at a time' : 'Batch upload'}
          </button>
        ))}
      </div>

      {mode === 'single' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {!activeSubmission && (
            <>
              {pendingRoster.length > 0 && (
                <div>
                  <label style={labelStyle}>Pick from roster ({pendingRoster.length} not yet submitted)</label>
                  <select onChange={(e) => e.target.value && pickRosterEntry(e.target.value)} style={inputStyle} defaultValue="">
                    <option value="">— select a student —</option>
                    {pendingRoster.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.rollNumber} · {s.studentName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={labelStyle}>Student name *</label>
                  <input value={studentName} onChange={(e) => setStudentName(e.target.value)} style={inputStyle} placeholder="e.g. Rahul Sharma" />
                </div>
                <div>
                  <label style={labelStyle}>Roll number *</label>
                  <input value={rollNumber} onChange={(e) => setRollNumber(e.target.value)} style={inputStyle} placeholder="e.g. 24BIO001" />
                </div>
                <div>
                  <label style={labelStyle}>Email (optional)</label>
                  <input value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} placeholder="for auto report" />
                </div>
              </div>

              <UploadZone onFile={handleFile} preview={preview} onClear={() => { setFile(null); setPreview(null) }} label="Drop this student's answer sheet or click to upload" disabled={submitting} />

              {duplicateWarning && (
                <div style={{ background: 'var(--yellow-bg)', border: '1px solid var(--yellow)', borderRadius: 10, padding: '0.85rem 1rem' }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--yellow)', marginBottom: 8 }}>{duplicateWarning}</p>
                  <button onClick={() => submitSingle(true)} style={{ ...smallBtn, borderColor: 'var(--yellow)', color: 'var(--yellow)' }}>
                    Grade again anyway
                  </button>
                </div>
              )}

              {error && <p style={{ fontSize: '0.85rem', color: 'var(--red)' }}>{error}</p>}

              <button
                onClick={() => submitSingle(false)}
                disabled={!file || !studentName || !rollNumber || submitting}
                style={{
                  padding: '0.85rem', borderRadius: 12,
                  background: file && studentName && rollNumber ? 'var(--accent)' : 'var(--bg-elevated)',
                  border: `1px solid ${file && studentName && rollNumber ? 'var(--accent)' : 'var(--border)'}`,
                  color: file && studentName && rollNumber ? '#fff' : 'var(--text-muted)',
                  fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem',
                  cursor: file && studentName && rollNumber ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                }}
              >
                {submitting && <Loader2 size={16} style={{ animation: 'spin-slow 1s linear infinite' }} />}
                {submitting ? 'Queuing…' : '✨ Grade this submission'}
              </button>
            </>
          )}

          {activeSubmission && ['queued', 'grading'].includes(activeSubmission.status) && (
            <div>
              <StatusBadge status={activeSubmission.status} />
              <div style={{ marginTop: '0.5rem' }}>
                <LoadingState />
              </div>
            </div>
          )}

          {activeSubmission?.status === 'failed' && (
            <div style={{ background: 'var(--red-bg)', border: '1px solid var(--red)', borderRadius: 12, padding: '1rem 1.25rem' }}>
              <p style={{ color: 'var(--red)', fontWeight: 600, fontSize: '0.9rem' }}>Grading failed</p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: 4 }}>{activeSubmission.error}</p>
              <button onClick={resetSingle} style={{ ...smallBtn, marginTop: 12 }}>Try another sheet</button>
            </div>
          )}

          {activeSubmission && ['done', 'needs_review'].includes(activeSubmission.status) && activeSubmission.report && (
            <div>
              {activeSubmission.status === 'needs_review' && (
                <div style={{ background: 'var(--yellow-bg)', border: '1px solid var(--yellow)', borderRadius: 10, padding: '0.75rem 1rem', marginBottom: '1rem' }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--yellow)' }}>
                    Low OCR confidence on this sheet — please double-check the handwritten answers manually.
                  </p>
                </div>
              )}
              <GradeReportView report={activeSubmission.report} />
              <button onClick={resetSingle} style={{ ...smallBtn, marginTop: '1.25rem' }}>Grade another sheet</button>
            </div>
          )}
        </div>
      )}

      {mode === 'batch' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {batch.length === 0 && (
            <>
              <UploadZone
                onFile={() => {}}
                onFiles={handleBatchFiles}
                multiple
                label="Drop multiple answer sheets — name files like RollNumber_Name.jpg to auto-match your roster"
              />
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Files still go through the grading queue one at a time (this respects Gemini's rate limit) — you'll see live status per student in the Roster tab.
              </p>
            </>
          )}

          {batch.length > 0 && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {batch.map((item, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '48px 1fr 1fr 1fr 32px', gap: '0.5rem', alignItems: 'center', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 10, padding: '0.5rem 0.75rem' }}>
                    <img src={item.preview} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6 }} alt="" />
                    <input value={item.studentName} onChange={(e) => updateBatchItem(idx, { studentName: e.target.value })} placeholder="Name" style={{ ...inputStyle, padding: '0.4rem 0.6rem', fontSize: '0.8rem' }} />
                    <input value={item.rollNumber} onChange={(e) => updateBatchItem(idx, { rollNumber: e.target.value })} placeholder="Roll no." style={{ ...inputStyle, padding: '0.4rem 0.6rem', fontSize: '0.8rem', borderColor: item.matched ? 'var(--green)' : 'var(--border-strong)' }} />
                    <input value={item.email} onChange={(e) => updateBatchItem(idx, { email: e.target.value })} placeholder="Email (optional)" style={{ ...inputStyle, padding: '0.4rem 0.6rem', fontSize: '0.8rem' }} />
                    <button onClick={() => removeBatchItem(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={16} /></button>
                  </div>
                ))}
              </div>
              <button
                onClick={submitBatch}
                disabled={batchSubmitting || batch.every((b) => !b.studentName || !b.rollNumber)}
                style={{
                  padding: '0.85rem', borderRadius: 12, background: 'var(--accent)', border: '1px solid var(--accent)',
                  color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                }}
              >
                {batchSubmitting ? <Loader2 size={16} style={{ animation: 'spin-slow 1s linear infinite' }} /> : <UploadCloud size={16} />}
                {batchSubmitting ? 'Queuing all…' : `Queue ${batch.filter((b) => b.studentName && b.rollNumber).length} submissions`}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

const labelStyle: React.CSSProperties = { fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4, fontWeight: 500 }
const inputStyle: React.CSSProperties = {
  width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border-strong)',
  borderRadius: 8, padding: '0.55rem 0.85rem', color: 'var(--text-primary)',
  fontSize: '0.88rem', fontFamily: 'var(--font-body)', outline: 'none',
}
const smallBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.9rem', borderRadius: 8,
  fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', background: 'transparent',
  border: '1px solid var(--border-strong)', color: 'var(--text-primary)',
}
