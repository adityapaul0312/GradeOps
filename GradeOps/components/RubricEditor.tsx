'use client'

import { Trash2, Plus } from 'lucide-react'
import type { Rubric, RubricQuestion } from '@/lib/types'

interface Props {
  rubric: Rubric
  onChange: (rubric: Rubric) => void
}

const cellStyle: React.CSSProperties = {
  width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border-strong)',
  borderRadius: 6, padding: '0.4rem 0.6rem', color: 'var(--text-primary)',
  fontSize: '0.82rem', fontFamily: 'var(--font-body)', outline: 'none',
}

export default function RubricEditor({ rubric, onChange }: Props) {
  const updateQuestion = (idx: number, patch: Partial<RubricQuestion>) => {
    const questions = rubric.questions.map((q, i) => (i === idx ? { ...q, ...patch } : q))
    onChange({ ...rubric, questions, totalMarks: questions.reduce((sum, q) => sum + (Number(q.maxMarks) || 0), 0) })
  }

  const removeQuestion = (idx: number) => {
    const questions = rubric.questions.filter((_, i) => i !== idx)
    onChange({ ...rubric, questions, totalMarks: questions.reduce((sum, q) => sum + (Number(q.maxMarks) || 0), 0) })
  }

  const addQuestion = () => {
    const nextNum = (rubric.questions[rubric.questions.length - 1]?.questionNumber || 0) + 1
    const questions = [
      ...rubric.questions,
      { questionNumber: nextNum, questionText: '', correctAnswer: '', maxMarks: 5, topic: '' },
    ]
    onChange({ ...rubric, questions, totalMarks: questions.reduce((sum, q) => sum + (Number(q.maxMarks) || 0), 0) })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {rubric.questions.map((q, idx) => (
        <div
          key={idx}
          style={{
            background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 12,
            padding: '1rem', display: 'grid', gridTemplateColumns: '48px 1fr 90px 32px', gap: '0.6rem', alignItems: 'start',
          }}
        >
          <div>
            <label style={labelStyle}>No.</label>
            <input
              type="number" value={q.questionNumber} style={cellStyle}
              onChange={(e) => updateQuestion(idx, { questionNumber: Number(e.target.value) })}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div>
              <label style={labelStyle}>Question</label>
              <textarea
                value={q.questionText} rows={2} style={{ ...cellStyle, resize: 'vertical' }}
                onChange={(e) => updateQuestion(idx, { questionText: e.target.value })}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <div>
                <label style={labelStyle}>Expected answer / key points</label>
                <textarea
                  value={q.correctAnswer} rows={2} style={{ ...cellStyle, resize: 'vertical' }}
                  onChange={(e) => updateQuestion(idx, { correctAnswer: e.target.value })}
                />
              </div>
              <div>
                <label style={labelStyle}>Topic</label>
                <input
                  value={q.topic} style={cellStyle}
                  onChange={(e) => updateQuestion(idx, { topic: e.target.value })}
                />
              </div>
            </div>
          </div>
          <div>
            <label style={labelStyle}>Max marks</label>
            <input
              type="number" value={q.maxMarks} style={cellStyle}
              onChange={(e) => updateQuestion(idx, { maxMarks: Number(e.target.value) })}
            />
          </div>
          <button
            onClick={() => removeQuestion(idx)}
            title="Remove question"
            style={{
              alignSelf: 'center', background: 'var(--red-bg)', border: '1px solid var(--red)',
              borderRadius: 8, width: 30, height: 30, display: 'flex', alignItems: 'center',
              justifyContent: 'center', cursor: 'pointer', color: 'var(--red)', marginTop: 18,
            }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}

      <button
        onClick={addQuestion}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
          padding: '0.6rem', borderRadius: 10, border: '1px dashed var(--border-strong)',
          background: 'transparent', color: 'var(--text-secondary)', fontSize: '0.82rem',
          fontWeight: 500, cursor: 'pointer',
        }}
      >
        <Plus size={14} /> Add question
      </button>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', alignItems: 'center', paddingTop: '0.25rem' }}>
        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Total marks:</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-primary)' }}>{rubric.totalMarks}</span>
      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block', marginBottom: 3, fontWeight: 500,
  textTransform: 'uppercase', letterSpacing: '0.04em',
}
