'use client'

import { CheckCircle2, XCircle, MinusCircle, TrendingUp, TrendingDown, Award } from 'lucide-react'

function gradeColor(grade: string): string {
  if (['A+', 'A'].includes(grade)) return 'var(--green)'
  if (grade === 'B') return '#60a5fa'
  if (grade === 'C') return 'var(--yellow)'
  if (grade === 'D') return '#fb923c'
  return 'var(--red)'
}

function QuestionCard({ q }: { q: any }) {
  const color = q.isCorrect ? 'var(--green)' : q.partialCredit > 0 ? 'var(--yellow)' : 'var(--red)'
  const bg    = q.isCorrect ? 'var(--green-bg)' : q.partialCredit > 0 ? 'var(--yellow-bg)' : 'var(--red-bg)'
  const Icon  = q.isCorrect ? CheckCircle2 : q.partialCredit > 0 ? MinusCircle : XCircle

  return (
    <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 12, padding: '1.1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Icon size={16} color={color} />
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Q{q.questionNumber}
          </span>
          {q.topic && (
            <span style={{ fontSize: '0.72rem', color: 'var(--accent-light)', background: 'var(--accent-glow)', borderRadius: 99, padding: '1px 8px' }}>
              {q.topic}
            </span>
          )}
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', fontWeight: 500, color, background: bg, borderRadius: 8, padding: '2px 10px' }}>
          {q.marksAwarded}/{q.maxMarks}
        </div>
      </div>

      {q.studentAnswer && (
        <div>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 2 }}>Student Answer</p>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{q.studentAnswer}</p>
        </div>
      )}

      {!q.isCorrect && q.correctAnswer && (
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.5rem' }}>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 2 }}>Correct Answer</p>
          <p style={{ fontSize: '0.88rem', color: 'var(--green)', lineHeight: 1.5 }}>{q.correctAnswer}</p>
        </div>
      )}

      {q.feedback && (
        <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: '0.5rem', lineHeight: 1.55 }}>
          {q.feedback}
        </p>
      )}
    </div>
  )
}

export default function GradeReportView({ report }: { report: any }) {
  const gColor  = gradeColor(report.grade)
  const correct = report.questions?.filter((q: any) => q.isCorrect).length || 0
  const partial = report.questions?.filter((q: any) => !q.isCorrect && q.partialCredit > 0).length || 0
  const wrong   = report.questions?.filter((q: any) => !q.isCorrect && q.partialCredit === 0).length || 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="animate-fade-up">

      {/* Score Hero */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: '2rem', display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '2rem', alignItems: 'center' }}>
        <div style={{ width: 120, height: 120, borderRadius: '50%', border: `4px solid ${gColor}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 32px ${gColor}44`, flexShrink: 0 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 800, color: gColor, lineHeight: 1 }}>{report.grade}</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{report.percentage?.toFixed(1)}%</span>
        </div>
        <div>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>{report.studentName}</p>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>{report.subject} · {new Date(report.gradedAt).toLocaleString()}</p>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {[
              { label: 'Total Marks', val: `${report.obtainedMarks}/${report.totalMarks}`, color: 'var(--text-primary)' },
              { label: 'Correct',     val: correct, color: 'var(--green)' },
              { label: 'Partial',     val: partial, color: 'var(--yellow)' },
              { label: 'Wrong',       val: wrong,   color: 'var(--red)' },
            ].map(s => (
              <div key={s.label} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 10, padding: '0.4rem 0.85rem' }}>
                <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</p>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', fontWeight: 700, color: s.color }}>{s.val}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Feedback */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <Award size={15} color="var(--accent-light)" />
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--accent-light)' }}>Overall Feedback</span>
        </div>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>{report.overallFeedback}</p>
      </div>

      {/* Strengths & Improvements */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {report.strengths?.length > 0 && (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <TrendingUp size={15} color="var(--green)" />
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--green)' }}>Strengths</span>
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {report.strengths.map((s: string, i: number) => (
                <li key={i} style={{ display: 'flex', gap: '0.5rem', fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  <span style={{ color: 'var(--green)', flexShrink: 0 }}>✓</span> {s}
                </li>
              ))}
            </ul>
          </div>
        )}
        {report.improvements?.length > 0 && (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <TrendingDown size={15} color="var(--yellow)" />
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--yellow)' }}>Improvements</span>
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {report.improvements.map((s: string, i: number) => (
                <li key={i} style={{ display: 'flex', gap: '0.5rem', fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  <span style={{ color: 'var(--yellow)', flexShrink: 0 }}>→</span> {s}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Questions */}
      {report.questions?.length > 0 && (
        <div>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.85rem' }}>
            Question Breakdown
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '0.75rem' }}>
            {report.questions.map((q: any) => <QuestionCard key={q.questionNumber} q={q} />)}
          </div>
        </div>
      )}
    </div>
  )
}