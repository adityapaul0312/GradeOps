# GradeOps

Assignment-based AI grading. Create an **Assignment** once (question paper + rubric),
then grade many **Submissions** (one per student) against it. Each submission is a
small, cheap Gemini call that reuses the already-extracted rubric instead of
re-sending the question paper every time — this is also what keeps you well clear
of Gemini rate limits.

## How it works

1. **Create an assignment** (`/assignments/new`) — upload the question paper, optionally
   paste a rubric, or click "Generate rubric with AI" to have Gemini read the paper once
   and draft one. You always review/edit the rubric before saving — an unreviewed AI
   rubric is never used for grading.
2. **Grade submissions** (`/assignments/[id]`, Grade tab) — pick a student from the roster
   or type a new one, upload their answer sheet, and grade. Submissions are added to that
   assignment's roster so you build a gradebook over time. Batch upload is supported too —
   files still go through the same sequential grading queue, just with a progress list.
3. **Roster tab** — see every student's status (queued → grading → done/needs review/failed),
   import a class roster from CSV, export the whole gradebook as CSV, and approve re-grades
   for students who requested a re-evaluation.
4. **Analytics tab** — class average, score distribution, and question-wise weak spots
   ("Q3 is where everyone lost marks").

## Rate limits & the grading queue

`lib/queue.ts` is a single, process-wide, sequential queue. Every grading job funnels
through it, so Gemini calls never run concurrently — even if you fire off a batch upload
of 40 sheets at once. On a 429 it backs off exponentially and retries (up to 4 attempts)
before marking a submission `failed`. Submission status is visible per-student in the
Roster tab, so nothing fails silently.

This queue is in-memory and lives inside a single Node process — it's the right fit for
`next dev` / `next start` on one machine. If you deploy to a platform that spins up
multiple serverless instances, swap it for a real queue (e.g. BullMQ + Redis), since an
in-memory array won't be shared across instances.

## Data storage

`lib/db.ts` is a small JSON-file-backed store (`data/db.json`) — good enough for a single
teacher on a single machine, with writes serialized to avoid corruption. It is **not**
suitable for multi-instance serverless deployments (no shared/persistent filesystem) or
for large-scale use — swap in Postgres/Prisma or similar for that. Answer sheet and
question paper images are stored as base64 data URLs inline in that JSON file for
simplicity; move these to real object storage (S3, etc.) if your classes are large or you
plan to keep years of gradebooks around.

## Other things worth knowing

- **Duplicate guard**: re-submitting the same roll number for an assignment warns you
  instead of silently creating a second graded entry; you have to explicitly confirm
  "grade again anyway".
- **Confidence flagging**: if Gemini reports low OCR confidence on a sheet, the submission
  is marked `needs_review` instead of silently trusted.
- **Re-evaluation loop**: students can request a re-eval (via the emailed link or the
  submission page); requests show up in the Roster tab for the teacher to approve, which
  re-runs grading on the same answer sheet.

## Setup

```bash
npm install
cp .env.example .env
# fill in GEMINI_API_KEY (required) and SMTP_* (optional, for auto-emailing reports)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

See `.env.example`. Only `GEMINI_API_KEY` is required — without SMTP configured, grading
still works, emails are just skipped (logged to console instead).
