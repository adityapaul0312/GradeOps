'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { PenLine, Users, BarChart3, ListChecks, Save, Loader2 } from 'lucide-react'
import GradeTab from '@/components/GradeTab'
import RosterTab from '@/components/RosterTab'
import AnalyticsTab from '@/components/AnalyticsTab'
import RubricEditor from '@/components/RubricEditor'
import type { Assignment, Submission } from '@/lib/types'

type Tab = 'grade' | 'roster' | 'analytics' | 'rubric'

export default function AssignmentPage() {
  const params = useParams<{ id: string }>()
  const id = params.id

  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [roster, setRoster] = useState<Submission[]>([])
  const [tab, setTab] = useState<Tab>('grade')
  const [savingRubric, setSavingRubric] = useState(false)

  const loadAssignment = useCallback(async () => {
    const res = await fetch(`/api/assignments/${id}`)
    const data = await res.json()
    if (data.success) setAssignment(data.assignment)
  }, [id])

  const loadRoster = useCallback(async () => {
    const res = await fetch(`/api/assignments/${id}/submissions`)
    const data = await res.json()
    if (data.success) setRoster(data.submissions)
  }, [id])

  useEffect(() => {
    loadAssignment()
    loadRoster()
  }, [loadAssignment, loadRoster])

  // Light polling while anything is mid-flight, so status badges update live
  useEffect(() => {
    const hasInFlight = roster.some((s) => s.status === 'queued' || s.status === 'grading')
    if (!hasInFlight) return
    const t = setInterval(loadRoster, 3000)
    return () => clearInterval(t)
  }, [roster, loadRoster])

  const saveRubric = async () => {
    if (!assignment?.rubric) return
    setSavingRubric(true)
    try {
      await fetch(`/api/assignments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rubric: assignment.rubric }),
      })
      await loadAssignment()
    } finally {
      setSavingRubric(false)
    }
  }

  if (!assignment) {
    return (
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '3rem 1.5rem' }}>
        <div className="animate-shimmer" style={{ height: 160, borderRadius: 20 }} />
      </div>
    )
  }

  const TABS: { key: Tab; label: string; icon: any }[] = [
    { key: 'grade', label: 'Grade', icon: PenLine },
    { key: 'roster', label: 'Roster', icon: Users },
    { key: 'analytics', label: 'Analytics', icon: BarChart3 },
    { key: 'rubric', label: 'Rubric', icon: ListChecks },
  ]

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>
      <header style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.9rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '0.3rem' }}>
          {assignment.title}
        </h1>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
          {assignment.subject || 'No subject'} · {assignment.totalMarks} marks · {roster.length} student{roster.length === 1 ? '' : 's'}
        </p>
        {!assignment.rubricApproved && (
          <p style={{ fontSize: '0.82rem', color: 'var(--yellow)', marginTop: '0.5rem' }}>
            ⚠ Rubric not yet approved — review it in the Rubric tab before grading submissions.
          </p>
        )}
      </header>

      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
        {TABS.map((t) => {
          const Icon = t.icon
          const active = tab === t.key
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1rem',
                background: 'none', border: 'none', borderBottom: `2px solid ${active ? 'var(--accent)' : 'transparent'}`,
                color: active ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
              }}
            >
              <Icon size={14} /> {t.label}
            </button>
          )
        })}
      </div>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: '1.5rem' }}>
        {tab === 'grade' && <GradeTab assignment={assignment} roster={roster} onGraded={loadRoster} />}
        {tab === 'roster' && <RosterTab assignment={assignment} roster={roster} onChanged={loadRoster} />}
        {tab === 'analytics' && <AnalyticsTab assignment={assignment} roster={roster} />}
        {tab === 'rubric' && assignment.rubric && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* ── how the AI reading works ── */}
            <div style={{
              background: 'var(--accent-glow)', border: '1px solid var(--accent)',
              borderRadius: 10, padding: '0.75rem 1rem',
              display: 'flex', gap: '0.6rem', alignItems: 'flex-start',
            }}>
              <span style={{ fontSize: '1rem', lineHeight: 1 }}>ℹ️</span>
              <p style={{ fontSize: '0.82rem', color: 'var(--accent-light)', lineHeight: 1.5, margin: 0 }}>
                <strong>How AI extraction works:</strong> one Gemini call reads your entire question paper and extracts all questions at once — not one call per question.
                The rows below are what it found. Review, edit any errors, then save. The rubric is only used for grading after you save it here.
              </p>
            </div>

            {/* ── side-by-side: question paper (sticky) + rubric editor ── */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: assignment.questionPaperImage ? '1fr 1.5fr' : '1fr',
              gap: '1.5rem',
              alignItems: 'start',
            }}>

              {/* Left: question paper viewer */}
              {assignment.questionPaperImage && (
                <div style={{ position: 'sticky', top: 80 }}>
                  <p style={{
                    fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.06em',
                    textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.6rem',
                  }}>
                    Question paper
                  </p>
                  <div style={{
                    border: '1px solid var(--border-strong)', borderRadius: 14, overflow: 'hidden',
                    background: '#000',
                  }}>
                    <img
                      src={assignment.questionPaperImage}
                      alt="Question paper"
                      style={{ width: '100%', display: 'block', objectFit: 'contain', maxHeight: '72vh' }}
                    />
                  </div>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.5rem', textAlign: 'center' }}>
                    Refer to this while editing the rubric rows →
                  </p>
                </div>
              )}

              {/* Right: rubric editor + save */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <p style={{
                  fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.06em',
                  textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.2rem',
                }}>
                  Marking scheme
                </p>
                <RubricEditor
                  rubric={assignment.rubric}
                  onChange={(rubric) => setAssignment({ ...assignment, rubric })}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={saveRubric}
                    disabled={savingRubric}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.4rem',
                      padding: '0.6rem 1.1rem', borderRadius: 10, background: 'var(--accent)', border: '1px solid var(--accent)',
                      color: '#fff', fontWeight: 700, fontFamily: 'var(--font-display)', fontSize: '0.85rem',
                      cursor: savingRubric ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {savingRubric ? <Loader2 size={14} style={{ animation: 'spin-slow 1s linear infinite' }} /> : <Save size={14} />}
                    {savingRubric ? 'Saving…' : 'Save rubric changes'}
                  </button>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                    Edits only affect submissions graded from now on.
                  </p>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}
