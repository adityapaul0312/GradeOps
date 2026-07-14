import { NextRequest, NextResponse } from 'next/server'
import { generateRubric } from '@/lib/gemini'

export const maxDuration = 120

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    if (!body.questionPaperImage) {
      return NextResponse.json({ success: false, error: 'No question paper image provided' }, { status: 400 })
    }

    const [meta, base64] = body.questionPaperImage.split(',')
    const mimeMatch = meta.match(/^data:([^;]+);base64/)
    const mimeType = mimeMatch?.[1] || 'image/jpeg'

    const rubric = await generateRubric({
      questionPaperBase64: base64,
      mimeType,
      subjectHint: body.subjectHint,
      totalMarksHint: body.totalMarksHint ? Number(body.totalMarksHint) : undefined,
    })

    return NextResponse.json({ success: true, rubric })
  } catch (error: any) {
    console.error('[/api/assignments/[id]/rubric POST]', error)
    return NextResponse.json({ success: false, error: error.message || 'Rubric generation failed' }, { status: 500 })
  }
}
