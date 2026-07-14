import { NextRequest, NextResponse } from 'next/server'
import { getAssignment, saveAssignment, deleteAssignment } from '@/lib/db'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const assignment = getAssignment(params.id)
  if (!assignment) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
  return NextResponse.json({ success: true, assignment })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const assignment = getAssignment(params.id)
    if (!assignment) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })

    const body = await req.json()

    if (body.title !== undefined) assignment.title = body.title
    if (body.subject !== undefined) assignment.subject = body.subject
    if (body.totalMarks !== undefined) assignment.totalMarks = Number(body.totalMarks)
    if (body.instructions !== undefined) assignment.instructions = body.instructions
    if (body.rubric !== undefined) {
      assignment.rubric = body.rubric
      // Saving a rubric (even a re-edit) counts as teacher approval — grading
      // will not run against an AI rubric that hasn't passed through this.
      assignment.rubricApproved = true
      if (body.rubric?.totalMarks) assignment.totalMarks = body.rubric.totalMarks
    }

    await saveAssignment(assignment)
    return NextResponse.json({ success: true, assignment })
  } catch (error: any) {
    console.error('[/api/assignments/[id] PATCH]', error)
    return NextResponse.json({ success: false, error: error.message || 'Unexpected error' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await deleteAssignment(params.id)
  return NextResponse.json({ success: true })
}
