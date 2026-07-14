// ---------- Grading result shapes (per-question + full report) ----------

export interface QuestionResult {
  questionNumber: number
  questionText?: string
  studentAnswer: string
  correctAnswer: string
  isCorrect: boolean
  partialCredit: number // 0-100
  marksAwarded: number
  maxMarks: number
  feedback: string
  topic: string
}

export interface GradeReport {
  studentName: string
  subject: string
  totalMarks: number
  obtainedMarks: number
  percentage: number
  grade: string
  overallFeedback: string
  strengths: string[]
  improvements: string[]
  questions: QuestionResult[]
  gradedAt: string
  ocrConfidence?: 'high' | 'medium' | 'low'
}

// ---------- Rubric (built once per assignment, reused for every submission) ----------

export interface RubricQuestion {
  questionNumber: number
  questionText: string
  correctAnswer: string
  maxMarks: number
  topic: string
}

export interface Rubric {
  questions: RubricQuestion[]
  totalMarks: number
}

// ---------- Assignment (question paper + rubric, created once) ----------

export interface Assignment {
  id: string
  title: string
  subject: string
  totalMarks: number
  createdAt: string
  questionPaperImage?: string // data URL, optional (rubric can be pasted manually)
  rubric: Rubric | null
  rubricApproved: boolean // teacher must review/edit AI-generated rubric before it's used for grading
  instructions?: string
}

// ---------- Submission (one student's answer sheet against an Assignment) ----------

export type SubmissionStatus =
  | 'not_submitted' // roster placeholder, no answer sheet uploaded yet
  | 'queued'
  | 'grading'
  | 'done'
  | 'failed'
  | 'needs_review' // low OCR confidence, flagged for manual check

export interface Submission {
  id: string
  assignmentId: string
  studentName: string
  rollNumber: string
  email?: string
  status: SubmissionStatus
  answerSheetImage?: string // data URL
  report?: GradeReport
  error?: string
  createdAt: string
  gradedAt?: string
  emailSent?: boolean
  pendingReeval?: boolean
  attempts?: number
}

// ---------- DB shape ----------

export interface Database {
  assignments: Assignment[]
  submissions: Submission[]
}
