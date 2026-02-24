# Run the first lesson

The residency has a **pre-curriculum** (days 1–30, math foundations) that must be passed before the **main curriculum** (days 31–120, crypto). Same flow for both: generate lesson, homework, rubric; submit; grade; pass to advance. Day 1 is pre day 1; after passing day 30 you advance to day 31 (main day 1).

To run **Day 001** (first lesson), use the orchestrator. It generates the lesson, homework, and rubric, then commits them to GitHub and updates residency state.

## 1. Prerequisites

- **Node 20+** and **npm**
- **OpenAI API key** (for lesson/homework/rubric generation)
- **GitHub**: PAT with `repo` scope, and a repo with a `main` branch and at least one commit (the orchestrator commits the generated files there)

## 2. Install

```bash
npm install
```

## 3. Environment

Create a `.env` in the project root (or copy from `.env.example` if it exists) with:

```env
OPENAI_API_KEY=sk-...
GITHUB_PAT=ghp_...
GITHUB_OWNER=your-github-username
GITHUB_REPO=your-repo-name
```

Preflight checks will fail if any of these are missing or invalid.

## 4. Required files (you already have these)

| Path | Purpose |
|------|--------|
| `curriculum/curriculum.json` | Lesson list; orchestrator uses it for day 1 topic and lesson id |
| `curriculum/homework-specs.json` | Governed specs per day; lesson generator uses it for prompts |
| `prompts/lesson-prompts.md` | System/user prompt templates for lesson, homework, rubric |
| `prompts/personas.md` | Professor personas (e.g. euclid, turing) |
| `residency/state.json` | Residency state; must have `"status": "NOT_STARTED"` to run |

Your `residency/state.json` is already set to day 1, attempt 1, status `NOT_STARTED`, professor `euclid`.

## 5. Run the first lesson

```bash
npm run day:run
```

This will:

1. **Preflight** — Check `OPENAI_API_KEY` and GitHub (PAT, repo, `main` branch).
2. **Load state** — Read `residency/state.json` (day 1, NOT_STARTED).
3. **Resolve curriculum** — Get topic and lesson id for day 1 from `curriculum/curriculum.json`.
4. **Generate** — Call the lesson generator (lesson + homework + rubric) using the selected professor persona and day 1 spec.
5. **Commit** — Push `residency/day-001/lesson.md`, `homework.md`, and `rubric.md` to GitHub.
6. **Update state** — Set status to `ASSIGNED`, append history, write a short summary to `residency/state.md`.

After a successful run, status becomes `ASSIGNED`, so the orchestrator will do nothing on the next `npm run day:run` until you change state (e.g. for day 2 or a retry).

## Grading and retry (failed homework)

1. **Grade a submission** (writes `residency/day-00X/grading.json`):
   ```bash
   npm run grade -- <day> <submission-file>
   # e.g. npm run grade -- 1 ./my-homework.md
   # Or pipe submission: cat my-homework.md | npm run grade -- 1
   ```
2. If the student **fails** (score &lt; 80 or rubric gate), the script updates state: `attempt` is incremented and `status` is set to `NOT_STARTED`, and `grading.json` is written with `pass: false`.
3. **Next `npm run day:run`**: The orchestrator checks for `residency/day-00X/grading.json` with `pass === false`. If found (and `lesson.md` + `rubric.md` exist), it increments `attempt` and generates **only a new homework** (overwrites `homework.md`). Lesson and rubric are left unchanged so the same rubric is used to grade the second attempt. The new homework is generated from the same lesson metadata and spec so it aligns with the existing rubric.

## Other scripts

| Script | What it does |
|--------|----------------|
| `npm run day:run` | Run one day: generate + commit (when NOT_STARTED). If failed grading exists for that day, generates new homework only (same lesson + rubric). |
| `npm run grade -- <day> [file]` | Grade a submission for `<day>`; writes `grading.json`; on fail, updates state for retry. |
| `npm run homework-specs:init` | Generate `curriculum/homework-specs.json` from main curriculum if missing. |
| `npm run homework-specs:regen` | Regenerate `homework-specs.json` (with `--force`). |
| `npm run pre-homework-specs:init` | Generate `curriculum/pre-homework-specs.json` from `curriculum/pre-curriculum.json` (required for pre-curriculum days 1–30). |
| `npm run pre-homework-specs:regen` | Regenerate pre-homework-specs (with `--force`). |
| `npm run build` | TypeScript compile. |
| `npm run typecheck` | Type-check only. |

There is no separate script that only generates the lesson locally without GitHub; the intended flow is `day:run` (generate + commit).
