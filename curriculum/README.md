# Curriculum

Edit `curriculum.json` to change the residency curriculum. The orchestrator runs one day at a time; when there is no lesson for the current day, the residency is considered **complete**.

`curriculum.json` supports either:
- A JSON array of lesson objects (legacy)
- An object with a `"lessons"` array plus metadata (current)

**Schema per lesson (in `lessons`):**
- `lessonId` — unique id (e.g. ALG-001, ECC-001)
- `day` — day number (1, 2, 3, …)
- `topic` — short title used in prompts and commits
- `defaultProfessorId` — one of: euclid, turing, goldwasser, nakamoto
- `difficulty` — (optional) 1–10
- `passScore` — (optional) 0–100

Order in the array defines progression. Do not remove or reorder days if you already have state for them.

## Homework Specs (Governed Specs)

To generate governed specs (objectives + constraints + rubric) per day for the Professor Engine:
- Initialize (won’t overwrite): `npm run homework-specs:init`
- Regenerate (overwrites): `npm run homework-specs:regen`
- Output: `curriculum/homework-specs.json`
