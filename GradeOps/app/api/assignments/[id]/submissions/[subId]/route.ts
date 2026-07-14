import { NextRequest, NextResponse } from 'next/server'
import { getSubmission, deleteSubmission } from '@/lib/db'

export async function GET(_req: NextRequest, { params }: { params: { id: string; subId: string } }) {
  const submission = getSubmission(params.subId)
  if (!submission || submission.assignmentId !== params.id) {
    return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
  }
  return NextResponse.json({ success: true, submission })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string; subId: string } }) {
  await deleteSubmission(params.subId)
  return NextResponse.json({ success: true })
}
