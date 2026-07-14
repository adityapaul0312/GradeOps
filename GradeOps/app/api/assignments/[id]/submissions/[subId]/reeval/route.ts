import { NextRequest, NextResponse } from 'next/server'
import { getSubmission, saveSubmission } from '@/lib/db'
import { enqueueGrading } from '@/lib/queue'

// POST { mode: 'request' }  -> flags submission as pending-re-eval for teacher review queue
// POST { mode: 'regrade' }  -> teacher approves, re-runs Gemini grading on the same answer sheet
export async function POST(req: NextRequest, { params }: { params: { id: string; subId: string } }) {
  const submission = getSubmission(params.subId)
  if (!submission || submission.assignmentId !== params.id) {
    return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
  }

  const body = await req.json().catch(() => ({}))
  const mode = body.mode || 'request'

  if (mode === 'regrade') {
    submission.pendingReeval = false
    submission.status = 'queued'
    await saveSubmission(submission)
    enqueueGrading(submission.id)
    return NextResponse.json({ success: true, submission })
  }

  submission.pendingReeval = true
  await saveSubmission(submission)
  return NextResponse.json({ success: true, submission })
}
