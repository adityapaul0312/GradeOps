import { NextRequest, NextResponse } from 'next/server'
import { getAssignment, listSubmissions } from '@/lib/db'
import { exportGradebookCSV } from '@/lib/csv'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const assignment = getAssignment(params.id)
  if (!assignment) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })

  const submissions = listSubmissions(params.id)
  const csv = exportGradebookCSV(assignment, submissions)

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${assignment.title.replace(/\s+/g, '-')}-gradebook.csv"`,
    },
  })
}
