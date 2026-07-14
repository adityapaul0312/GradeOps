import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { listAssignments, saveAssignment } from '@/lib/db'
import type { Assignment } from '@/lib/types'

export async function GET() {
  const assignments = listAssignments()
  return NextResponse.json({ success: true, assignments })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    if (!body.title) {
      return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 })
    }

    const assignment: Assignment = {
      id: randomUUID(),
      title: body.title,
      subject: body.subject || '',
      totalMarks: Number(body.totalMarks) || 0,
      createdAt: new Date().toISOString(),
      questionPaperImage: body.questionPaperImage || undefined,
      rubric: body.rubric || null,
      rubricApproved: !!body.rubric,
      instructions: body.instructions || undefined,
    }

    await saveAssignment(assignment)
    return NextResponse.json({ success: true, assignment })
  } catch (error: any) {
    console.error('[/api/assignments POST]', error)
    return NextResponse.json({ success: false, error: error.message || 'Unexpected error' }, { status: 500 })
  }
}
