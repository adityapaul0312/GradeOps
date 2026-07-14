import type { Assignment, Submission } from './types'

// Minimal CSV parser — good enough for simple roster files (name, roll, email)
// with no embedded commas/quotes edge cases beyond basic quoting.
export function parseCSV(text: string): string[][] {
  const rows: string[][] = []
  const lines = text.split(/\r\n|\n|\r/).filter((l) => l.trim().length > 0)
  for (const line of lines) {
    const cells: string[] = []
    let cur = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        inQuotes = !inQuotes
      } else if (ch === ',' && !inQuotes) {
        cells.push(cur.trim())
        cur = ''
      } else {
        cur += ch
      }
    }
    cells.push(cur.trim())
    rows.push(cells)
  }
  return rows
}

export interface RosterRow {
  name: string
  rollNumber: string
  email?: string
}

/** Parses a roster CSV. Accepts a header row with any casing of name/roll/email. */
export function parseRosterCSV(text: string): RosterRow[] {
  const rows = parseCSV(text)
  if (rows.length === 0) return []

  const header = rows[0].map((h) => h.toLowerCase())
  const hasHeader = header.some((h) => /name|roll|email/.test(h))
  const nameIdx = hasHeader ? header.findIndex((h) => h.includes('name')) : 0
  const rollIdx = hasHeader ? header.findIndex((h) => h.includes('roll')) : 1
  const emailIdx = hasHeader ? header.findIndex((h) => h.includes('email')) : 2

  const dataRows = hasHeader ? rows.slice(1) : rows
  return dataRows
    .filter((r) => r.some((c) => c.length > 0))
    .map((r) => ({
      name: r[nameIdx] || '',
      rollNumber: r[rollIdx] || '',
      email: emailIdx >= 0 ? r[emailIdx] || undefined : undefined,
    }))
    .filter((r) => r.name && r.rollNumber)
}

function csvEscape(val: string | number): string {
  const s = String(val ?? '')
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

export function exportGradebookCSV(assignment: Assignment, submissions: Submission[]): string {
  const maxQuestions = Math.max(0, ...submissions.map((s) => s.report?.questions.length || 0))
  const qHeaders = Array.from({ length: maxQuestions }, (_, i) => `Q${i + 1}`)

  const header = ['Roll Number', 'Name', 'Email', 'Status', 'Marks Obtained', 'Total Marks', 'Percentage', 'Grade', ...qHeaders]
  const lines = [header.map(csvEscape).join(',')]

  for (const s of submissions) {
    const row = [
      s.rollNumber,
      s.studentName,
      s.email || '',
      s.status,
      s.report?.obtainedMarks ?? '',
      s.report?.totalMarks ?? assignment.totalMarks,
      s.report ? s.report.percentage.toFixed(1) : '',
      s.report?.grade ?? '',
      ...Array.from({ length: maxQuestions }, (_, i) => s.report?.questions[i]?.marksAwarded ?? ''),
    ]
    lines.push(row.map(csvEscape).join(','))
  }

  return lines.join('\n')
}
