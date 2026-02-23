/**
 * CLI: grade a homework submission for a given day.
 * Reads lesson + rubric from residency/day-00X/, calls grading engine,
 * writes residency/day-00X/grading.json. On fail, updates state (attempt + 1, NOT_STARTED)
 * so the next day:run will regenerate lesson/homework/rubric with retry content.
 */
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import { gradeSubmission } from "../../packages/core/grading";
import { loadState, saveState } from "../../packages/core/state";

function dayLabel(day: number): string {
  return `day-${String(day).padStart(3, "0")}`;
}

function parseArgs(argv: string[]): { day: number; submissionPath: string | null } {
  const dayArg = argv[0];
  const submissionPath = argv[1] ?? null;
  if (!dayArg || !/^\d+$/.test(dayArg)) {
    throw new Error("Usage: grade-submission <day> [submission-file]\n  Day: 1-based. Submission: file path or stdin if omitted.");
  }
  const day = parseInt(dayArg, 10);
  return { day, submissionPath };
}

async function main(): Promise<void> {
  const { day, submissionPath } = parseArgs(process.argv.slice(2));

  const label = dayLabel(day);
  const dayDir = path.resolve(process.cwd(), "residency", label);
  const lessonPath = path.join(dayDir, "lesson.md");
  const rubricPath = path.join(dayDir, "rubric.md");

  if (!fs.existsSync(lessonPath)) throw new Error(`Lesson not found: ${lessonPath}`);
  if (!fs.existsSync(rubricPath)) throw new Error(`Rubric not found: ${rubricPath}`);

  const lesson = fs.readFileSync(lessonPath, "utf-8");
  const rubric = fs.readFileSync(rubricPath, "utf-8");

  let submissionText: string;
  if (submissionPath) {
    submissionText = fs.readFileSync(path.resolve(process.cwd(), submissionPath), "utf-8");
  } else {
    submissionText = await new Promise<string>((resolve, reject) => {
      const chunks: Buffer[] = [];
      process.stdin.on("data", (chunk) => chunks.push(chunk));
      process.stdin.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
      process.stdin.on("error", reject);
    });
  }

  if (!submissionText.trim()) throw new Error("Submission content is empty.");

  const state = loadState();
  const professorId = state.professor ?? "euclid";

  console.log(`[GradeSubmission] Day ${day} | Professor: ${professorId}\n`);
  const result = await gradeSubmission({
    professorId,
    lesson,
    rubric,
    submissionText,
  });

  const gradingPath = path.join(dayDir, "grading.json");
  fs.mkdirSync(dayDir, { recursive: true });
  fs.writeFileSync(
    gradingPath,
    JSON.stringify(
      {
        score: result.score,
        pass: result.pass,
        feedback: result.feedback,
        gradedAt: new Date().toISOString(),
      },
      null,
      2
    ),
    "utf-8"
  );
  console.log(`[GradeSubmission] Wrote ${path.relative(process.cwd(), gradingPath)}`);
  console.log(`  Score: ${result.score} | Pass: ${result.pass}\n`);

  if (!result.pass) {
    const updated = {
      ...state,
      attempt: (state.attempt ?? 1) + 1,
      status: "NOT_STARTED" as const,
    };
    saveState(updated);
    console.log(
      `[GradeSubmission] Homework failed. State updated: attempt=${updated.attempt} status=NOT_STARTED.\n` +
        `  Run \`npm run day:run\` to generate a second attempt (new lesson/homework/rubric).\n`
    );
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
