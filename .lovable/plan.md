# Interactive Coding Practice (Efiwe Challenges)

Add a hands-on coding practice area to the platform, powered by the Efiwe challenge service. Students read a lesson, type code into an editor, submit it, and get instant right/wrong feedback — with their progress saved and visible to teachers and admins.

## What the service gives us

- A list of challenges per track (e.g. HTML), each with a topic, difficulty, lesson text, task, and hints.
- A single challenge with its full lesson content.
- A checker that takes the learner's code and replies "correct" or not, with feedback.

Solutions are never exposed, so the checking always happens on the service side.

## What we build

### 1. Public practice page (`/practice`)
- Track selector (HTML first, plus any other tracks the service exposes).
- Challenge list with topic, difficulty badge and completion ticks.
- Challenge view: lesson text, task, collapsible hints, code editor, Run/Check button, feedback panel, and a live preview pane for HTML.
- Visitors can practise freely; a prompt invites them to sign in so progress is saved.
- Linked from the main navigation so it also works as a marketing draw.

### 2. Student portal integration
- New "Practice" item in the student sidebar at `/student/practice` — same experience, wrapped in the dashboard layout.
- Dashboard card showing challenges completed and current streak-style progress.

### 3. Progress tracking
Every submission is recorded: which track, which challenge, the submitted code, whether it passed, and when. Per challenge we keep a summary row (attempts, first passed date, best status) so progress bars and lists load fast.

### 4. Teacher and admin view
- New page under the teacher portal listing their students with completed/attempted counts per track, expandable to per-challenge detail.
- Same view available to admins across all students, with a CSV export consistent with the existing student export.

## Technical notes

- Calls to `efiwe.com` are proxied through a new edge function `coding-challenges` (actions: `list`, `get`, `validate`). Reasons: avoids CORS issues, keeps the upstream URL in one place, lets us cache challenge lists, and prevents clients from spoofing pass results — the pass flag is written server-side from the upstream response, not from the browser.
- New tables:
  - `coding_challenge_attempts` — id, user_id, track, challenge_id, submitted_code, is_correct, feedback, created_at.
  - `coding_challenge_progress` — id, user_id, track, challenge_id, attempts, is_completed, completed_at, updated_at; unique on (user_id, track, challenge_id).
  - RLS: students read/insert their own rows; teachers and admins read (teachers scoped to students in their batches, matching the existing teacher access pattern); service_role full. Explicit GRANTs included in the migration.
- Anonymous visitors: progress held in local storage only, merged into their account on first sign-in.
- Editor: lightweight textarea-based editor with monospace styling and JetBrains Mono, matching the existing terminal aesthetic — no heavy editor dependency.
- Challenge lesson content arrives as HTML from the service; it is sanitised before rendering.
- Track list is detected at build time by probing the service; unavailable tracks are hidden.

## Out of scope for this pass

- Certificates for challenge completion.
- Authoring our own challenges inside the admin panel.
