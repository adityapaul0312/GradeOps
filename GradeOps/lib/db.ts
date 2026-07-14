import fs from 'fs'
import path from 'path'
import type { Assignment, Submission, Database } from './types'

// Simple file-based JSON store. Good enough for a single teacher / single
// Node process running `next dev` or `next start`. Swap this module out for
// Postgres/Prisma/etc if you deploy to a multi-instance serverless platform
// where the local filesystem isn't persistent or shared across instances.

const DATA_DIR = path.join(process.cwd(), 'data')
const DB_PATH = path.join(DATA_DIR, 'db.json')

function ensureDb(): Database {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
  if (!fs.existsSync(DB_PATH)) {
    const empty: Database = { assignments: [], submissions: [] }
    fs.writeFileSync(DB_PATH, JSON.stringify(empty, null, 2))
    return empty
  }
  const raw = fs.readFileSync(DB_PATH, 'utf-8')
  try {
    return JSON.parse(raw) as Database
  } catch {
    const empty: Database = { assignments: [], submissions: [] }
    fs.writeFileSync(DB_PATH, JSON.stringify(empty, null, 2))
    return empty
  }
}

// Serialize writes so concurrent requests (e.g. queue worker + API route)
// don't stomp on each other's changes to the JSON file.
let writeChain: Promise<void> = Promise.resolve()

function persist(db: Database): Promise<void> {
  writeChain = writeChain.then(
    () =>
      new Promise<void>((resolve, reject) => {
        fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), (err) => {
          if (err) reject(err)
          else resolve()
        })
      })
  )
  return writeChain
}

function read(): Database {
  return ensureDb()
}

// ---------- Assignments ----------

export function listAssignments(): Assignment[] {
  return read().assignments.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function getAssignment(id: string): Assignment | undefined {
  return read().assignments.find((a) => a.id === id)
}

export async function saveAssignment(assignment: Assignment): Promise<void> {
  const db = read()
  const idx = db.assignments.findIndex((a) => a.id === assignment.id)
  if (idx >= 0) db.assignments[idx] = assignment
  else db.assignments.push(assignment)
  await persist(db)
}

export async function deleteAssignment(id: string): Promise<void> {
  const db = read()
  db.assignments = db.assignments.filter((a) => a.id !== id)
  db.submissions = db.submissions.filter((s) => s.assignmentId !== id)
  await persist(db)
}

// ---------- Submissions ----------

export function listSubmissions(assignmentId: string): Submission[] {
  return read()
    .submissions.filter((s) => s.assignmentId === assignmentId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

export function getSubmission(id: string): Submission | undefined {
  return read().submissions.find((s) => s.id === id)
}

export function findSubmissionByRoll(assignmentId: string, rollNumber: string): Submission | undefined {
  return read().submissions.find(
    (s) => s.assignmentId === assignmentId && s.rollNumber.trim().toLowerCase() === rollNumber.trim().toLowerCase()
  )
}

export async function saveSubmission(submission: Submission): Promise<void> {
  const db = read()
  const idx = db.submissions.findIndex((s) => s.id === submission.id)
  if (idx >= 0) db.submissions[idx] = submission
  else db.submissions.push(submission)
  await persist(db)
}

export async function deleteSubmission(id: string): Promise<void> {
  const db = read()
  db.submissions = db.submissions.filter((s) => s.id !== id)
  await persist(db)
}
