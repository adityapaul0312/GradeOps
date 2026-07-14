import { getAssignment, getSubmission, saveSubmission } from './db'
import { gradeSubmission, isRateLimitError } from './gemini'
import { sendReportEmail } from './mailer'

// A single, process-wide, sequential queue. This matters because the
// natural throttling of "one teacher uploading one sheet at a time" is not
// guaranteed once multi-upload / bulk-import is used — everything funnels
// through this one worker so we never fire two Gemini calls concurrently
// and blow through the rate limit.
//
// NOTE: this is in-memory and lives inside one Node process. It's the right
// fit for `next dev` / `next start` on a single machine. It will NOT survive
// across multiple serverless function instances — if you deploy to that kind
// of platform, replace this with a real queue (e.g. BullMQ + Redis).

type Job = { submissionId: string; attempt: number }

const queue: Job[] = []
let processing = false

const MAX_ATTEMPTS = 4
const BASE_DELAY_MS = 2000

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function enqueueGrading(submissionId: string) {
  queue.push({ submissionId, attempt: 0 })
  void processQueue()
}

async function processQueue() {
  if (processing) return
  processing = true
  try {
    while (queue.length > 0) {
      const job = queue.shift()!
      await runJob(job)
    }
  } finally {
    processing = false
  }
}

async function runJob(job: Job) {
  const submission = getSubmission(job.submissionId)
  if (!submission) return

  const assignment = getAssignment(submission.assignmentId)
  if (!assignment || !assignment.rubric) {
    submission.status = 'failed'
    submission.error = 'Assignment has no approved rubric yet.'
    await saveSubmission(submission)
    return
  }

  submission.status = 'grading'
  submission.attempts = job.attempt + 1
  await saveSubmission(submission)

  try {
    const report = await gradeSubmission({
      rubric: assignment.rubric,
      answerSheetBase64: (submission.answerSheetImage || '').split(',').pop() || '',
      mimeType: extractMime(submission.answerSheetImage) || 'image/jpeg',
      studentName: submission.studentName,
      subject: assignment.subject,
      instructions: assignment.instructions,
    })

    const fresh = getSubmission(job.submissionId)
    if (!fresh) return
    fresh.report = report
    fresh.gradedAt = new Date().toISOString()
    fresh.status = report.ocrConfidence === 'low' ? 'needs_review' : 'done'
    await saveSubmission(fresh)

    if (fresh.email) {
      try {
        await sendReportEmail(fresh.email, fresh, assignment)
        fresh.emailSent = true
        await saveSubmission(fresh)
      } catch (mailErr) {
        console.error('[queue] email send failed', mailErr)
      }
    }
  } catch (err: any) {
    if (isRateLimitError(err) && job.attempt < MAX_ATTEMPTS - 1) {
      const backoff = BASE_DELAY_MS * Math.pow(2, job.attempt)
      await delay(backoff)
      queue.unshift({ submissionId: job.submissionId, attempt: job.attempt + 1 })
      return
    }

    const fresh = getSubmission(job.submissionId)
    if (!fresh) return
    fresh.status = 'failed'
    fresh.error = err?.message || 'Grading failed'
    await saveSubmission(fresh)
  }
}

function extractMime(dataUrl?: string): string | undefined {
  if (!dataUrl) return undefined
  const match = dataUrl.match(/^data:([^;]+);base64,/)
  return match?.[1]
}

export function queueLength(): number {
  return queue.length
}
