import dotenv from "dotenv";
import path from "path";

// Load environment variables before any module that reads them
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import { loadState, saveState, appendStateSummary, pushHistoryEntry } from "../../packages/core/state";
import { getLessonByDay, isResidencyComplete, getLastCurriculumDay } from "../../packages/core/curriculum";
import { generateLesson } from "../../packages/core/personas";
import { commitFiles } from "../../packages/github/github-client";
import { routeTask } from "../../packages/core/routing";
import { callOpenAI } from "../../packages/llm/openai-client";
import { runPreflight, assertPreflight } from "../../packages/core/preflight";
import { ResidencyState, HistoryEntry } from "../../packages/core/types";

function dayLabel(day: number): string {
  return `day-${String(day).padStart(3, "0")}`;
}

async function generateSummary(
  day: number,
  topic: string,
  professor: string,
  commitUrl: string
): Promise<string> {
  const model = routeTask("summary");
  return callOpenAI({
    model,
    systemPrompt:
      "You are a concise academic coordinator. Generate a 2-3 sentence status summary " +
      "for the residency log in Markdown. Be factual and professional.",
    userPrompt: `Day ${day} lesson generated on topic "${topic}" by Professor ${professor}. ` +
      `Committed to GitHub: ${commitUrl}. Status: ASSIGNED.`,
    temperature: 0.3,
    maxTokens: 200,
    taskType: "summary",
  });
}

async function run(): Promise<void> {
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  AUTONOMOUS CRYPTOGRAPHIC RESIDENCY ENGINE");
  console.log("═══════════════════════════════════════════════════════════\n");

  // ── 0. Preflight Checks ──────────────────────────────────────────────────
  const preflight = await runPreflight();
  assertPreflight(preflight);

  // ── 1. Load State ────────────────────────────────────────────────────────
  const state: ResidencyState = loadState();
  console.log(`[Orchestrator] Current state:`);
  console.log(`  Day: ${state.currentDay} | Lesson: ${state.currentLessonId}`);
  console.log(`  Status: ${state.status} | Attempt: ${state.attempt}`);
  console.log(`  Professor: ${state.professor}\n`);

  // ── 2. Guard: Only run if NOT_STARTED ────────────────────────────────────
  if (state.status !== "NOT_STARTED") {
    console.log(
      `[Orchestrator] Status is "${state.status}" — nothing to do.\n` +
        `  To regenerate: set status to "NOT_STARTED" in residency/state.json`
    );
    process.exit(0);
  }

  // ── 3. Resolve curriculum lesson (or exit if residency complete) ────────
  if (isResidencyComplete(state.currentDay)) {
    const lastDay = getLastCurriculumDay();
    console.log(
      `[Orchestrator] Residency complete — no lesson for Day ${state.currentDay}.\n` +
        `  Curriculum has ${lastDay} day(s). Nothing left to run.\n`
    );
    process.exit(0);
  }

  const curriculumLesson = getLessonByDay(state.currentDay);
  if (!curriculumLesson) {
    throw new Error(`No curriculum lesson found for Day ${state.currentDay}`);
  }

  const professorId = state.professor || curriculumLesson.defaultProfessorId;

  console.log(`[Orchestrator] Lesson resolved:`);
  console.log(`  ID: ${curriculumLesson.lessonId}`);
  console.log(`  Topic: ${curriculumLesson.topic}`);
  console.log(`  Professor: ${professorId}\n`);

  // ── 4. Generate Lesson ───────────────────────────────────────────────────
  const generated = await generateLesson({
    day: state.currentDay,
    topic: curriculumLesson.topic,
    professorId,
    attempt: state.attempt,
  });

  // ── 5. Commit to GitHub ──────────────────────────────────────────────────
  const label = dayLabel(state.currentDay);
  console.log(`\n[Orchestrator] Committing files to GitHub (${label})...`);

  const commitResult = await commitFiles(
    [
      { path: `residency/${label}/lesson.md`, content: generated.lesson },
      { path: `residency/${label}/homework.md`, content: generated.homework },
      { path: `residency/${label}/rubric.md`, content: generated.rubric },
    ],
    `[Residency] Day ${state.currentDay}: ${curriculumLesson.topic} — ${professorId} (attempt ${state.attempt})`
  );

  // ── 6. Update State ──────────────────────────────────────────────────────
  const historyEntry: HistoryEntry = {
    day: state.currentDay,
    lessonId: curriculumLesson.lessonId,
    attempt: state.attempt,
    status: "ASSIGNED",
    commitSha: commitResult.sha,
    timestamp: new Date().toISOString(),
  };

  const updatedState: ResidencyState = pushHistoryEntry(
    {
      ...state,
      status: "ASSIGNED",
      lastCommitSha: commitResult.sha,
      professor: professorId,
    },
    historyEntry
  );

  saveState(updatedState);
  console.log(`\n[Orchestrator] State saved → status=ASSIGNED`);

  // ── 7. Append Summary to state.md ────────────────────────────────────────
  const summary = await generateSummary(
    state.currentDay,
    curriculumLesson.topic,
    professorId,
    commitResult.url
  );

  const stateMdEntry =
    `## Day ${state.currentDay} — ${curriculumLesson.topic}\n\n` +
    `- **Professor:** ${professorId}\n` +
    `- **Attempt:** ${state.attempt}\n` +
    `- **Status:** ASSIGNED\n` +
    `- **Commit:** [${commitResult.sha.slice(0, 7)}](${commitResult.url})\n\n` +
    `### Summary\n\n${summary}\n`;

  appendStateSummary(stateMdEntry);

  // ── 8. Final Log ─────────────────────────────────────────────────────────
  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("  DAY 001 COMPLETE");
  console.log("═══════════════════════════════════════════════════════════");
  console.log(`\n  Commit URL: ${commitResult.url}\n`);
  console.log(`  Files committed:`);
  console.log(`    residency/${label}/lesson.md`);
  console.log(`    residency/${label}/homework.md`);
  console.log(`    residency/${label}/rubric.md`);
  console.log(`\n  State: ASSIGNED | Professor: ${professorId}`);
  console.log("\n  Next step: Submit homework → grade → advance to Day 002");
  console.log("═══════════════════════════════════════════════════════════\n");
}

run().catch((err) => {
  console.error("\n[Orchestrator] FATAL ERROR:", err instanceof Error ? err.message : err);
  process.exit(1);
});
