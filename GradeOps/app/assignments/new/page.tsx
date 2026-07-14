'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, Loader2, ArrowRight } from 'lucide-react'
import UploadZone from '@/components/UploadZone'
import RubricEditor from '@/components/RubricEditor'
import type { Rubric } from '@/lib/types'

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

export default function NewAssignment() {
  const router = useRouter()

  const [title, setTitle] = useState('')
  const [subject, setSubject] = useState('')
  const [totalMarks, setTotalMarks] = useState('')
  const [instructions, setInstructions] = useState('')
  const [questionPaper, setQuestionPaper] = useState<File | null>(null)
  const [questionPaperPreview, setQuestionPaperPreview] = useState<string | null>(null)
  const [manualRubricText, setManualRubricText] = useState('')

  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState<string | null>(null)
  const [rubric, setRubric] = useState<Rubric | null>(null)
  const [saving, setSaving] = useState(false)

  const handleQuestionPaper = async (file: File) => {
    setQuestionPaper(file)
    setQuestionPaperPreview(await fileToDataUrl(file))
  }

  const handleGenerate = async () => {
    if (!questionPaperPreview) return
    setGenerating(true)
    setGenError(null)
    try {
      const res = await fetch(`/api/assignments/placeholder/rubric`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionPaperImage: questionPaperPreview,
          subjectHint: subject || undefined,
          totalMarksHint: totalMarks || undefined,
        }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'Rubric generation failed')
      setRubric({ questions: data.rubric.questions, totalMarks: data.rubric.totalMarks })
      if (!title && data.rubric.titleGuess) setTitle(data.rubric.titleGuess)
      if (!subject && data.rubric.subjectGuess) setSubject(data.rubric.subjectGuess)
      if (!totalMarks && data.rubric.totalMarks) setTotalMarks(String(data.rubric.totalMarks))
    } catch (err: any) {
      setGenError(err.message || 'Something went wrong')
    } finally {
      setGenerating(false)
    }
  }

  const useManualRubric = () => {
    // Turn pasted free-text rubric into a single-question placeholder the
    // teacher can expand — most teachers pasting a key want it attached
    // verbatim and will fine-tune per question afterwards.
    setRubric({
      questions: [
        { questionNumber: 1, questionText: 'See pasted answer key', correctAnswer: manualRubricText, maxMarks: Number(totalMarks) || 100, topic: subject || 'General' },
      ],
      totalMarks: Number(totalMarks) || 100,
    })
  }

  const canGenerate = !!questionPaperPreview && !generating
  const canSave = !!title && !!rubric && rubric.questions.length > 0 && !saving

  const handleSave = async () => {
    if (!rubric) return
    setSaving(true)
    try {
      const res = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          subject,
          totalMarks: rubric.totalMarks || Number(totalMarks) || 0,
          instructions,
          questionPaperImage: questionPaperPreview || undefined,
          rubric,
        }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'Failed to save assignment')
      router.push(`/assignments/${data.assignment.id}`)
    } catch (err: any) {
      alert(err.message || 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '2.5rem 1.5rem 4rem' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '0.4rem' }}>
          New Assignment
        </h1>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          One question paper + rubric, reused for every student's submission.
        </p>
      </header>

      {/* Basic details */}
      <section style={sectionStyle}>
        <p style={sectionTitle}>Details</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Assignment title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Class 10 Physics — Mid Term" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Subject</label>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Physics" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Total marks</label>
            <input type="number" value={totalMarks} onChange={(e) => setTotalMarks(e.target.value)} placeholder="e.g. 100" style={inputStyle} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Special grading instructions (optional)</label>
            <input value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="e.g. Award partial marks for correct method even if final answer is wrong" style={inputStyle} />
          </div>
        </div>
      </section>

      {/* Question paper */}
      <section style={sectionStyle}>
        <p style={sectionTitle}>Question paper</p>
        <UploadZone
          onFile={handleQuestionPaper}
          preview={questionPaperPreview}
          onClear={() => { setQuestionPaper(null); setQuestionPaperPreview(null) }}
          label="Drop the question paper (image) or click to upload"
        />
      </section>

      {/* Rubric */}
      <section style={sectionStyle}>
        <p style={sectionTitle}>Rubric</p>

        {!rubric && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <button
              onClick={handleGenerate}
              disabled={!canGenerate}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                padding: '0.75rem', borderRadius: 12, border: '1px solid var(--accent)',
                background: canGenerate ? 'var(--accent)' : 'var(--bg-elevated)',
                color: canGenerate ? '#fff' : 'var(--text-muted)',
                fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9rem',
                cursor: canGenerate ? 'pointer' : 'not-allowed',
              }}
            >
              {generating ? <Loader2 size={16} style={{ animation: 'spin-slow 1s linear infinite' }} /> : <Sparkles size={16} />}
              {generating ? 'Reading question paper…' : 'Generate rubric with AI'}
            </button>
            {!questionPaperPreview && (
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center' }}>Upload a question paper above to enable this.</p>
            )}
            {genError && <p style={{ fontSize: '0.82rem', color: 'var(--red)' }}>{genError}</p>}

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>or paste your own</span>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>

            <textarea
              value={manualRubricText}
              onChange={(e) => setManualRubricText(e.target.value)}
              placeholder={'Q1: 42\nQ2: Newton\'s first law\n...'}
              rows={4}
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}
            />
            <button
              onClick={useManualRubric}
              disabled={!manualRubricText.trim()}
              style={{
                padding: '0.6rem', borderRadius: 10, border: '1px solid var(--border-strong)',
                background: 'transparent', color: manualRubricText.trim() ? 'var(--text-primary)' : 'var(--text-muted)',
                fontWeight: 600, fontSize: '0.85rem', cursor: manualRubricText.trim() ? 'pointer' : 'not-allowed',
              }}
            >
              Use pasted rubric
            </button>
          </div>
        )}

        {rubric && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ background: 'var(--yellow-bg)', border: '1px solid var(--yellow)', borderRadius: 10, padding: '0.75rem 1rem' }}>
              <p style={{ fontSize: '0.82rem', color: 'var(--yellow)', fontWeight: 600 }}>
                Review before saving — never trust an unreviewed AI rubric for grading.
              </p>
            </div>
            <RubricEditor rubric={rubric} onChange={setRubric} />
            <button
              onClick={() => setRubric(null)}
              style={{ fontSize: '0.8rem', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
            >
              ← Start rubric over
            </button>
          </div>
        )}
      </section>

      <button
        onClick={handleSave}
        disabled={!canSave}
        style={{
          width: '100%', padding: '0.9rem', borderRadius: 12,
          background: canSave ? 'var(--accent)' : 'var(--bg-elevated)',
          border: `1px solid ${canSave ? 'var(--accent)' : 'var(--border)'}`,
          color: canSave ? '#fff' : 'var(--text-muted)',
          fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700,
          cursor: canSave ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
          boxShadow: canSave ? '0 0 24px var(--accent-glow)' : 'none',
        }}
      >
        {saving ? <Loader2 size={16} style={{ animation: 'spin-slow 1s linear infinite' }} /> : <ArrowRight size={16} />}
        {saving ? 'Saving…' : 'Save assignment & start grading'}
      </button>
    </div>
  )
}

const sectionStyle: React.CSSProperties = {
  background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 18, padding: '1.5rem', marginBottom: '1.25rem',
}
const sectionTitle: React.CSSProperties = {
  fontFamily: 'var(--font-display)', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.06em',
  textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '1rem',
}
const labelStyle: React.CSSProperties = { fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4, fontWeight: 500 }
const inputStyle: React.CSSProperties = {
  width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)',
  borderRadius: 8, padding: '0.55rem 0.85rem', color: 'var(--text-primary)',
  fontSize: '0.88rem', fontFamily: 'var(--font-body)', outline: 'none',
}
