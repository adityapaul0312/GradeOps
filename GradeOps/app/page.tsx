'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { FileText, Users, ArrowRight, Sparkles } from 'lucide-react'
import type { Assignment } from '@/lib/types'

export default function Dashboard() {
  const [assignments, setAssignments] = useState<Assignment[] | null>(null)

  useEffect(() => {
    fetch('/api/assignments')
      .then((r) => r.json())
      .then((d) => setAssignments(d.assignments || []))
  }, [])

  return (
    <div style={{ maxWidth: 1080, margin: '0 auto', padding: '2.5rem 1.5rem' }}>
      <header style={{ marginBottom: '2.5rem' }}>
        <h1
          style={{
            fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 800,
            color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '0.5rem',
          }}
        >
          Your Assignments
        </h1>
        <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', maxWidth: 560 }}>
          Set up a question paper and rubric once, then grade every student's answer sheet against it —
          each submission is a cheap, focused Gemini call instead of re-uploading the whole paper each time.
        </p>
      </header>

      {assignments === null && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
          {[0, 1, 2].map((i) => (
            <div key={i} className="animate-shimmer" style={{ height: 150, borderRadius: 18 }} />
          ))}
        </div>
      )}

      {assignments?.length === 0 && (
        <div
          style={{
            border: '1px dashed var(--border-strong)', borderRadius: 20, padding: '3rem 2rem',
            textAlign: 'center', background: 'var(--bg-card)',
          }}
        >
          <div
            style={{
              width: 56, height: 56, borderRadius: 16, background: 'var(--accent-glow)', border: '1px solid var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem',
            }}
          >
            <Sparkles size={24} color="var(--accent-light)" />
          </div>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
            No assignments yet
          </p>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            Create your first assignment — upload a question paper and we'll draft a rubric for you to review.
          </p>
          <Link
            href="/assignments/new"
            style={{
              display: 'inline-block', padding: '0.65rem 1.4rem', borderRadius: 10, background: 'var(--accent)',
              color: '#fff', fontWeight: 700, fontFamily: 'var(--font-display)', fontSize: '0.9rem', textDecoration: 'none',
              boxShadow: '0 0 20px var(--accent-glow)',
            }}
          >
            + New Assignment
          </Link>
        </div>
      )}

      {assignments && assignments.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {assignments.map((a) => (
            <Link
              key={a.id}
              href={`/assignments/${a.id}`}
              className="animate-fade-up"
              style={{
                display: 'block', textDecoration: 'none', background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 18, padding: '1.4rem', transition: 'border-color 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div
                  style={{
                    width: 36, height: 36, borderRadius: 10, background: 'var(--accent-glow)', border: '1px solid var(--accent)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <FileText size={16} color="var(--accent-light)" />
                </div>
                {!a.rubricApproved && (
                  <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--yellow)', background: 'var(--yellow-bg)', borderRadius: 99, padding: '2px 8px' }}>
                    RUBRIC PENDING
                  </span>
                )}
              </div>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                {a.title}
              </p>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                {a.subject || 'No subject'} · {a.totalMarks} marks
              </p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Users size={13} /> View gradebook
                </span>
                <ArrowRight size={14} color="var(--text-muted)" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
