import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { getAssignment, listSubmissions, findSubmissionByRoll, saveSubmission } from '@/lib/db'
import { enqueueGrading } from '@/lib/queue'
import type { Submission } from '@/lib/types'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const submissions = listSubmissions(params.id)
  return NextResponse.json({ success: true, submissions })
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const assignment = getAssignment(params.id)
    if (!assignment) return NextResponse.json({ success: false, error: 'Assignment not found' }, { status: 404 })
    if (!assignment.rubric || !assignment.rubricApproved) {
      return NextResponse.json(
        { success: false, error: 'This assignment has no approved rubric yet. Review and save a rubric first.' },
        { status: 400 }
      )
    }

    const body = await req.json()
    if (!body.studentName || !body.rollNumber) {
      return NextResponse.json({ success: false, error: 'Student name and roll number are required' }, { status: 400 })
    }
    if (!body.answerSheetImage) {
      return NextResponse.json({ success: false, error: 'No answer sheet image provided' }, { status: 400 })
    }

    const existing = findSubmissionByRoll(params.id, body.rollNumber)
    if (existing && existing.status !== 'not_submitted' && !body.force) {
      return NextResponse.json(
        {
          success: false,
          duplicate: true,
          error: `Roll number ${body.rollNumber} has already been graded for this assignment (${existing.studentName}). Re-submit with force=true to grade again (this replaces the existing result).`,
          existingSubmissionId: existing.id,
        },
        { status: 409 }
      )
    }

    const submission: Submission = existing
      ? {
          ...existing,
          studentName: body.studentName,
          email: body.email || existing.email,
          answerSheetImage: body.answerSheetImage,
          status: 'queued',
          report: undefined,
          error: undefined,
          pendingReeval: false,
        }
      : {
          id: randomUUID(),
          assignmentId: params.id,
          studentName: body.studentName,
          rollNumber: body.rollNumber,
          email: body.email || undefined,
          status: 'queued',
          answerSheetImage: body.answerSheetImage,
          createdAt: new Date().toISOString(),
        }

    await saveSubmission(submission)
    enqueueGrading(submission.id)

    return NextResponse.json({ success: true, submission })
  } catch (error: any) {
    console.error('[/api/assignments/[id]/submissions POST]', error)
    return NextResponse.json({ success: false, error: error.message || 'Unexpected error' }, { status: 500 })
  }
}
