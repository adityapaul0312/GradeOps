import { GoogleGenerativeAI } from '@google/generative-ai'
import type { GradeReport, Rubric } from './types'

function client() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not set')
  }
  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
}

/**
 * Robustly extract the first valid JSON object from a Gemini response.
 * Gemini 2.5 Flash frequently wraps output in ```json fences, adds a preamble
 * sentence before the JSON, or both. A simple startsWith check misses all of
 * these cases. This function finds the first '{' and last '}' in the response
 * and parses whatever is between them.
 */
function extractJSON(raw: string): any {
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) {
    throw new Error(`Could not find a JSON object in Gemini response. Raw text: ${raw.slice(0, 300)}`)
  }
  const jsonStr = raw.slice(start, end + 1)
  try {
    return JSON.parse(jsonStr)
  } catch (e) {
    throw new Error(`JSON parse failed. Extracted string: ${jsonStr.slice(0, 400)}`)
  }
}

/** A 429 (or generic rate-limit) error from the Gemini SDK. */
export function isRateLimitError(err: any): boolean {
  const msg = String(err?.message || err || '')
  return err?.status === 429 || /429|rate limit|quota/i.test(msg)
}

// ---------- Step 1: parse the question paper once, suggest a rubric ----------

export async function generateRubric(opts: {
  questionPaperBase64: string
  mimeType: string
  subjectHint?: string
  totalMarksHint?: number
}): Promise<Rubric & { subjectGuess?: string; titleGuess?: string }> {
  const genAI = client()
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  const prompt = `You are an expert teacher setting up a marking scheme.
I am giving you an image of a printed QUESTION PAPER. Read every question carefully — including any sub-parts — and produce a marking rubric.

${opts.subjectHint ? `Subject: ${opts.subjectHint}` : ''}
${opts.totalMarksHint ? `Total marks for the paper: ${opts.totalMarksHint}` : 'Infer total marks from the paper if marks are printed next to questions; otherwise distribute marks sensibly.'}

STRICT RULES:
- Copy the question text EXACTLY as printed. Do not paraphrase or summarise it.
- If a question has sub-parts (a, b, c), list each sub-part as a separate question row with its own marks.
- "questionText" must always be the verbatim printed question. Never leave it empty or null.
- "correctAnswer" should be the ideal/model answer or key marking points a student must hit.
- "topic" is the concept or chapter being tested (e.g. "Fleming's Left Hand Rule", "Newton's Second Law").

Return ONLY a valid JSON object with no markdown fences, no explanation, nothing before or after the JSON:
{
  "titleGuess": "short title for this paper, e.g. 'Class 10 Physics Mid-Term'",
  "subjectGuess": "subject name",
  "totalMarks": 0,
  "questions": [
    {
      "questionNumber": 1,
      "questionText": "verbatim question text as printed on the paper",
      "correctAnswer": "ideal answer / key marking points",
      "maxMarks": 5,
      "topic": "topic or concept being tested"
    }
  ]
}`

  const result = await model.generateContent([
    { inlineData: { mimeType: opts.mimeType, data: opts.questionPaperBase64 } },
    prompt,
  ])

  const raw = result.response.text()
  const parsed = extractJSON(raw)

  // Defensive normalisation: Gemini sometimes returns 'question' instead of
  // 'questionText', or 'answer' instead of 'correctAnswer'. Fix silently.
  const questions = (parsed.questions || []).map((q: any, i: number) => ({
    questionNumber: q.questionNumber ?? q.number ?? i + 1,
    questionText:
      q.questionText ??
      q.question_text ??
      q.question ??
      q.text ??
      '',
    correctAnswer:
      q.correctAnswer ??
      q.correct_answer ??
      q.answer ??
      q.modelAnswer ??
      q.model_answer ??
      '',
    maxMarks: q.maxMarks ?? q.max_marks ?? q.marks ?? 5,
    topic: q.topic ?? q.concept ?? '',
  }))

  return {
    questions,
    totalMarks:
      parsed.totalMarks ??
      parsed.total_marks ??
      questions.reduce((s: number, q: any) => s + (Number(q.maxMarks) || 0), 0),
    subjectGuess: parsed.subjectGuess ?? parsed.subject ?? undefined,
    titleGuess: parsed.titleGuess ?? parsed.title ?? undefined,
  }
}

// ---------- Step 2: grade one submission against the already-extracted rubric ----------

export async function gradeSubmission(opts: {
  rubric: Rubric
  answerSheetBase64: string
  mimeType: string
  studentName: string
  subject: string
  instructions?: string
}): Promise<GradeReport> {
  const genAI = client()
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  const rubricText = opts.rubric.questions
    .map(
      (q) =>
        `Q${q.questionNumber} [${q.maxMarks} marks, topic: ${q.topic}]:\n  Question: ${q.questionText}\n  Expected answer / key points: ${q.correctAnswer}`
    )
    .join('\n\n')

  const prompt = `You are an expert teacher grading a student's answer sheet.
The marking rubric is already provided below — do NOT ask for the question paper again.
Use the rubric to evaluate the STUDENT ANSWER SHEET image.

MARKING RUBRIC (total ${opts.rubric.totalMarks} marks):
${rubricText}

STUDENT: ${opts.studentName}
SUBJECT: ${opts.subject}
${opts.instructions ? `SPECIAL INSTRUCTIONS: ${opts.instructions}` : ''}

GRADING RULES:
- Match each student answer to the correct question number even if their order on the page differs.
- Award partial credit where the method or reasoning is partially correct.
- If handwriting is illegible for a question, note it in feedback and set the top-level ocrConfidence to "low".
- Be fair but strict — only award marks for content that actually matches the rubric key points.

Return ONLY a valid JSON object with no markdown fences, no preamble, nothing before or after:
{
  "studentName": "${opts.studentName}",
  "subject": "${opts.subject}",
  "totalMarks": ${opts.rubric.totalMarks},
  "obtainedMarks": 0,
  "percentage": 0,
  "grade": "A+|A|B|C|D|F",
  "overallFeedback": "2-3 sentence summary",
  "strengths": ["strength 1", "strength 2"],
  "improvements": ["area to improve 1", "area to improve 2"],
  "ocrConfidence": "high|medium|low",
  "questions": [
    {
      "questionNumber": 1,
      "studentAnswer": "what the student wrote, or 'not attempted' / 'illegible'",
      "correctAnswer": "correct answer from rubric",
      "isCorrect": true,
      "partialCredit": 100,
      "marksAwarded": 5,
      "maxMarks": 5,
      "feedback": "specific feedback on this answer",
      "topic": "topic being tested"
    }
  ],
  "gradedAt": "${new Date().toISOString()}"
}`

  const result = await model.generateContent([
    { inlineData: { mimeType: opts.mimeType, data: opts.answerSheetBase64 } },
    prompt,
  ])

  const raw = result.response.text()
  const parsed = extractJSON(raw)
  return parsed as GradeReport
}
