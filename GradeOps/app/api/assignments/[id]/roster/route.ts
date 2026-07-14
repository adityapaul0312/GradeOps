import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { getAssignment, findSubmissionByRoll, saveSubmission } from '@/lib/db'
import { parseRosterCSV } from '@/lib/csv'
import type { Submission } from '@/lib/types'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const assignment = getAssignment(params.id)
    if (!assignment) return NextResponse.json({ success: false, error: 'Assignment not found' }, { status: 404 })

    const body = await req.json()
    if (!body.csv) return NextResponse.json({ success: false, error: 'No CSV content provided' }, { status: 400 })

    const rows = parseRosterCSV(body.csv)
    if (rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Could not parse any rows. Expected columns: name, roll number, email (optional).' }, { status: 400 })
    }

    let added = 0
    let skipped = 0

    for (const row of rows) {
      const existing = findSubmissionByRoll(params.id, row.rollNumber)
      if (existing) {
        skipped++
        continue
      }
      const submission: Submission = {
        id: randomUUID(),
        assignmentId: params.id,
        studentName: row.name,
        rollNumber: row.rollNumber,
        email: row.email,
        status: 'not_submitted',
        createdAt: new Date().toISOString(),
      }
      await saveSubmission(submission)
      added++
    }

    return NextResponse.json({ success: true, added, skipped, total: rows.length })
  } catch (error: any) {
    console.error('[/api/assignments/[id]/roster POST]', error)
    return NextResponse.json({ success: false, error: error.message || 'Unexpected error' }, { status: 500 })
  }
}
