'use client'

import { TrendingDown, BarChart3 } from 'lucide-react'
import type { Assignment, Submission } from '@/lib/types'

interface Props {
  assignment: Assignment
  roster: Submission[]
}

export default function AnalyticsTab({ assignment, roster }: Props) {
  const graded = roster.filter((s) => s.report)

  if (graded.length === 0) {
    return (
      <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', textAlign: 'center', padding: '3rem 0' }}>
        No graded submissions yet — analytics will appear here once students are graded.
      </p>
    )
  }

  const percentages = graded.map((s) => s.report!.percentage)
  const classAverage = percentages.reduce((a, b) => a + b, 0) / percentages.length
  const highest = Math.max(...percentages)
  const lowest = Math.min(...percentages)

  const buckets = [
    { label: '0–40%', min: 0, max: 40 },
    { label: '40–60%', min: 40, max: 60 },
    { label: '60–75%', min: 60, max: 75 },
    { label: '75–90%', min: 75, max: 90 },
    { label: '90–100%', min: 90, max: 101 },
  ]
  const distribution = buckets.map((b) => ({
    ...b,
    count: percentages.filter((p) => p >= b.min && p < b.max).length,
  }))
  const maxCount = Math.max(1, ...distribution.map((d) => d.count))

  // Per-question stats
  const questionMap = new Map<number, { topic: string; totalAwarded: number; totalMax: number; count: number }>()
  for (const s of graded) {
    for (const q of s.report!.questions) {
      const entry = questionMap.get(q.questionNumber) || { topic: q.topic, totalAwarded: 0, totalMax: 0, count: 0 }
      entry.totalAwarded += q.marksAwarded
      entry.totalMax += q.maxMarks
      entry.count += 1
      questionMap.set(q.questionNumber, entry)
    }
  }
  const questionStats = Array.from(questionMap.entries())
    .map(([num, v]) => ({ questionNumber: num, topic: v.topic, avgPercent: v.totalMax > 0 ? (v.totalAwarded / v.totalMax) * 100 : 0 }))
    .sort((a, b) => a.avgPercent - b.avgPercent)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
        {[
          { label: 'Class average', val: `${classAverage.toFixed(1)}%`, color: 'var(--accent-light)' },
          { label: 'Graded', val: `${graded.length}/${roster.length}`, color: 'var(--text-primary)' },
          { label: 'Highest', val: `${highest.toFixed(1)}%`, color: 'var(--green)' },
          { label: 'Lowest', val: `${lowest.toFixed(1)}%`, color: 'var(--red)' },
        ].map((c) => (
          <div key={c.label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '1rem' }}>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{c.label}</p>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '1.4rem', fontWeight: 700, color: c.color }}>{c.val}</p>
          </div>
        ))}
      </div>

      {/* Distribution */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <BarChart3 size={15} color="var(--accent-light)" />
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--accent-light)' }}>
            Score distribution
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.75rem', height: 140 }}>
          {distribution.map((d) => (
            <div key={d.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{d.count}</span>
              <div
                style={{
                  width: '100%', borderRadius: '6px 6px 0 0', background: 'var(--accent)',
                  height: `${Math.max(4, (d.count / maxCount) * 100)}px`, opacity: 0.85,
                }}
              />
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{d.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Question weak spots */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <TrendingDown size={15} color="var(--yellow)" />
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--yellow)' }}>
            Question-wise weak spots
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {questionStats.map((q) => {
            const color = q.avgPercent < 50 ? 'var(--red)' : q.avgPercent < 75 ? 'var(--yellow)' : 'var(--green)'
            return (
              <div key={q.questionNumber} style={{ display: 'grid', gridTemplateColumns: '60px 1fr 60px', gap: '0.75rem', alignItems: 'center' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>Q{q.questionNumber}</span>
                <div style={{ position: 'relative', background: 'var(--bg-elevated)', borderRadius: 6, height: 20, overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', inset: 0, width: `${q.avgPercent}%`, background: color, opacity: 0.5 }} />
                  <span style={{ position: 'relative', fontSize: '0.72rem', color: 'var(--text-primary)', padding: '0 8px', lineHeight: '20px' }}>{q.topic}</span>
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color, textAlign: 'right' }}>{q.avgPercent.toFixed(0)}%</span>
              </div>
            )
          })}
        </div>
        {questionStats.length > 0 && questionStats[0].avgPercent < 60 && (
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '1rem' }}>
            Q{questionStats[0].questionNumber} ({questionStats[0].topic}) is where the class lost the most marks — worth revisiting in class.
          </p>
        )}
      </div>
    </div>
  )
}
