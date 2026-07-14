import nodemailer from 'nodemailer'
import type { Assignment, Submission } from './types'

function getTransport() {
  if (!process.env.SMTP_HOST) return null
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  })
}

export async function sendReportEmail(to: string, submission: Submission, assignment: Assignment) {
  const transport = getTransport()
  if (!transport) {
    console.warn('[mailer] SMTP not configured, skipping email send')
    return
  }
  const report = submission.report
  if (!report) return

  const reeevalUrl =
    (process.env.APP_URL || 'http://localhost:3000') +
    `/assignments/${assignment.id}/submissions/${submission.id}?reeval=1`

  await transport.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: `Grade report: ${assignment.title} — ${submission.studentName}`,
    html: `
      <h2>${assignment.title}</h2>
      <p>Hi ${submission.studentName},</p>
      <p>Your answer sheet has been graded: <strong>${report.obtainedMarks}/${report.totalMarks}</strong> (${report.grade}, ${report.percentage.toFixed(1)}%).</p>
      <p>${report.overallFeedback}</p>
      <p>If you think there's an error, you can request a re-evaluation here: <a href="${reeevalUrl}">${reeevalUrl}</a></p>
    `,
  })
}
