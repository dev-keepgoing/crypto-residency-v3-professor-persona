# Lesson prompt variables: sources and example

## Where each value comes from

| Variable | Source | Notes |
|----------|--------|------|
| `{{day}}` | **Caller** (`GenerateLessonParams.day`) | Not from any .md file; passed when triggering generation (e.g. API/CLI). |
| `{{topic}}` | **Caller** (`GenerateLessonParams.topic`) | Not from .md; often set to the day’s topic from curriculum (e.g. from `homework-specs.json`). |
| `{{professorId}}` | **Persona** (loaded from `prompts/personas.md`) | Section heading becomes id (e.g. `## euclid` → `euclid`). The caller passes `professorId` to select which persona to load; the value in the prompt is `persona.id`. |
| `{{personaSignature}}` | **Personas** (`prompts/personas.md`) | From `### signature` for that persona if present; otherwise default: `"<name>: cryptography focus."` (e.g. `Professor Turing: cryptography focus.`). |
| `{{attempt}}` | **Caller** (`GenerateLessonParams.attempt`) | Not from .md; retry count (1, 2, …). |
| `{{specRef}}` | **Computed** in code | `residency/specs/day-<day>` with zero-padded day (e.g. `residency/specs/day-001`). |
| `{{lessonSpecJson}}` | **Curriculum** (`curriculum/homework-specs.json`) | One day’s entry is turned into a **lesson spec view** in `spec-views.ts`: `specRef`, `objectives` (id, category, text), `constraints` (booleans + problemCounts), `passScore`. That object is `JSON.stringify`’d — so the content is from the JSON curriculum file, not from .md. |
| `{{retryNote}}` | **Computed** in code | From `getRetryNote(attempt, "lesson")`: empty if `attempt <= 1`; otherwise a short sentence asking to vary framing and not repeat prior phrasing. |

So: **only `professorId` and `personaSignature`** come from **`prompts/personas.md`**. The **template text** (including the placeholders) comes from **`prompts/lesson-prompts.md`**. The **spec content** in `{{lessonSpecJson}}` comes from **`curriculum/homework-specs.json`** (via the lesson spec view). The rest are either from the **caller** or **computed** in code.

---

## Example: filled Lesson User prompt

Assume:

- **day**: 1  
- **topic**: Finite Fields — Definitions & Axioms  
- **professorId**: turing  
- **personaSignature**: Implementation-first, edge cases, testing, performance.  
- **attempt**: 1  
- **specRef**: residency/specs/day-001  
- **lessonSpecJson**: (one day’s lesson spec view from `homework-specs.json`, pretty-printed below)  
- **retryNote**: (empty for attempt 1)

The **Lesson User** section template in `lesson-prompts.md` is:

```markdown
## Lesson User

Generate the lesson for this day. All variable data is below; keep the system prompt unchanged for caching.

```json
{
  "day": {{day}},
  "topic": "{{topic}}",
  "professorId": "{{professorId}}",
  "personaSignature": "{{personaSignature}}",
  "attempt": {{attempt}},
  "specRef": "{{specRef}}",
  "spec": {{lessonSpecJson}}
}
```
{{retryNote}}
```

After substitution, the **actual user message** sent to the model looks like this (with a realistic `lessonSpecJson` for day 1):

```json
{
  "day": 1,
  "topic": "Finite Fields — Definitions & Axioms",
  "professorId": "turing",
  "personaSignature": "Implementation-first, edge cases, testing, performance.",
  "attempt": 1,
  "specRef": "residency/specs/day-001",
  "spec": {"specRef":"residency/specs/day-001","objectives":[{"id":"O1","category":"concept","text":"Define the core objects, notation, and assumptions for: Finite Fields — Definitions & Axioms."},{"id":"O2","category":"derivation","text":"Derive/prove the key result(s) underlying: Finite Fields — Definitions & Axioms, with no skipped steps."},{"id":"O3","category":"computation","text":"Solve representative computational exercises for: Finite Fields — Definitions & Axioms, and sanity-check results."},{"id":"O4","category":"implementation","text":"Implement a reference algorithm/procedure for: Finite Fields — Definitions & Axioms, including edge cases and input validation."},{"id":"O5","category":"adversarial","text":"Identify common mistakes/pitfalls related to: Finite Fields — Definitions & Axioms, and explain how to avoid them."}],"constraints":{"requiresDerivation":true,"requiresImplementation":true,"adversarialFocus":true,"problemCounts":{"math":3,"implementation":1,"adversarial":1}},"passScore":80}
}
```

(No `{{retryNote}}` text when attempt is 1.)

So the **full prompt** for the lesson call is:

- **System**: entire “Lesson System” section from `lesson-prompts.md` (format contract, JSON metadata block, etc.).
- **User**: the filled “Lesson User” block above (instruction line + JSON + optional retry note).

---

## Token estimate

Rough character counts and token estimates (using ~4 chars/token as a simple heuristic):

| Part | Approx. chars | Est. tokens |
|------|----------------|------------|
| Lesson System section | ~1,100 | ~280 |
| Lesson User (instruction + JSON, day 1 spec) | ~1,050 | ~260 |
| **Total (system + user) per lesson call** | **~2,150** | **~540** |

So for **one lesson generation** you’re in the **~500–600 token** range for the prompt (system + user). The **lessonSpecJson** for one day is typically **~600–900 characters** (~150–225 tokens); it grows if the day has more objectives or longer text. Output is capped at 3500 tokens for the lesson, 1200 for homework, 1200 for rubric, so total **input** for the three calls is on the order of **~1,500–2,000 tokens** (lesson + homework + rubric user prompts and their shared system-size context), with **output** up to ~5,900 tokens across the three steps.
