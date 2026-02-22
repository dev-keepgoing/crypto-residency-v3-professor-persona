/**
 * CLI tool: reads curriculum.json and generates curriculum/homework-specs.json
 * with governed objectives and rubric dimensions per day for use in lesson/homework prompts.
 */
import fs from "fs";
import path from "path";
import {
  CurriculumLesson,
  GovernedObjective,
  GovernedRubricDimension,
  StructuredInputsDay,
  StructuredInputsFile,
} from "@core/types";

type CurriculumModule = {
  moduleId: string;
  moduleName: string;
  days: number[];
};

type CurriculumFileV2 = {
  curriculumId: string;
  version: string;
  totalDays: number;
  modules: CurriculumModule[];
  lessons: CurriculumLesson[];
};

const CURRICULUM_PATH = path.resolve(process.cwd(), "curriculum", "curriculum.json");
const DEFAULT_OUT_PATH = path.resolve(process.cwd(), "curriculum", "homework-specs.json");

function parseArgs(argv: string[]): { outPath: string; pretty: boolean; force: boolean } {
  const outIdx = argv.indexOf("--out");
  const outPath = outIdx >= 0 && argv[outIdx + 1] ? path.resolve(process.cwd(), argv[outIdx + 1]) : DEFAULT_OUT_PATH;
  const pretty = argv.includes("--pretty") || !argv.includes("--minify");
  const force = argv.includes("--force");
  return { outPath, pretty, force };
}

function readCurriculum(): {
  curriculumId: string;
  curriculumVersion: string;
  modules: CurriculumModule[];
  lessons: CurriculumLesson[];
} {
  if (!fs.existsSync(CURRICULUM_PATH)) {
    throw new Error(`Missing curriculum file: ${CURRICULUM_PATH}`);
  }

  const raw = fs.readFileSync(CURRICULUM_PATH, "utf-8");
  const parsed = JSON.parse(raw) as unknown;

  if (Array.isArray(parsed)) {
    const lessons = parsed as CurriculumLesson[];
    return {
      curriculumId: "legacy-curriculum",
      curriculumVersion: "unknown",
      modules: [],
      lessons,
    };
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error(`${CURRICULUM_PATH} must be either an array of lessons or an object with lessons.`);
  }

  const v2 = parsed as CurriculumFileV2;
  if (!Array.isArray(v2.lessons)) {
    throw new Error(`${CURRICULUM_PATH} is missing "lessons" array.`);
  }

  return {
    curriculumId: v2.curriculumId ?? "unknown-curriculum",
    curriculumVersion: v2.version ?? "unknown",
    modules: Array.isArray(v2.modules) ? v2.modules : [],
    lessons: v2.lessons,
  };
}

function normalizeTopic(topic: string): string {
  return topic.replace(/\s+/g, " ").trim();
}

function isExamLesson(lessonId: string, topic: string): boolean {
  return /-EX\d+/i.test(lessonId) || /\bexam\b/i.test(topic);
}

function isReviewLesson(topic: string): boolean {
  return /\breview\b/i.test(topic) || /\bmastery\b/i.test(topic);
}

function buildObjectives(topic: string, difficulty?: number): GovernedObjective[] {
  const t = normalizeTopic(topic);
  const hard = (difficulty ?? 5) >= 7;

  const objectives: GovernedObjective[] = [
    { id: "O1", category: "concept", text: `Define the core objects, notation, and assumptions for: ${t}.` },
    { id: "O2", category: "derivation", text: `Derive/prove the key result(s) underlying: ${t}, with no skipped steps.` },
    { id: "O3", category: "computation", text: `Solve representative computational exercises for: ${t}, and sanity-check results.` },
    { id: "O4", category: "implementation", text: `Implement a reference algorithm/procedure for: ${t}, including edge cases and input validation.` },
    {
      id: "O5",
      category: "adversarial",
      text: hard
        ? `Analyze a realistic attack/failure mode related to: ${t}, and propose concrete mitigations.`
        : `Identify common mistakes/pitfalls related to: ${t}, and explain how to avoid them.`,
    },
  ];

  return objectives;
}

function buildRubricDimensions(): GovernedRubricDimension[] {
  return [
    { id: "D1", name: "Mathematical correctness & rigor", points: 45, minimumPoints: 27 },
    { id: "D2", name: "Implementation correctness & edge cases", points: 30, minimumPoints: 18 },
    { id: "D3", name: "Adversarial analysis & mitigations", points: 25, minimumPoints: 15 },
  ];
}

function buildDaySpec(params: {
  lesson: CurriculumLesson;
  module?: { moduleId: string; moduleName: string };
}): StructuredInputsDay {
  const { lesson, module } = params;
  const topic = normalizeTopic(lesson.topic);
  const passScore = lesson.passScore ?? 80;

  const exam = isExamLesson(lesson.lessonId, topic);
  const review = isReviewLesson(topic);

  const timeboxMinutes = exam ? 180 : review ? 120 : 90;

  return {
    day: lesson.day,
    lessonId: lesson.lessonId,
    topic,
    moduleId: module?.moduleId,
    moduleName: module?.moduleName,
    difficulty: lesson.difficulty,
    passScore,
    objectives: buildObjectives(topic, lesson.difficulty),
    constraints: {
      timeboxMinutes,
      problemCounts: { math: 3, implementation: 1, adversarial: 1 },
      allowedLanguages: ["TypeScript", "Python"],
      allowedResources: ["The generated lesson for this day", "Your own notes"],
      disallowedResources: ["Copying published solutions", "Using an LLM to write the solution"],
      responseFormat: { requireMarkdown: true, requireLatex: true, requireCodeFences: true },
    },
    rubric: {
      totalPoints: 100,
      passingScore: passScore,
      dimensions: buildRubricDimensions(),
      masteryGate:
        `PASS requires score >= ${passScore} AND each rubric dimension score >= its minimumPoints.`,
    },
  };
}

async function main(): Promise<void> {
  const { outPath, pretty, force } = parseArgs(process.argv.slice(2));
  const { curriculumId, curriculumVersion, modules, lessons } = readCurriculum();

  if (fs.existsSync(outPath) && !force) {
    throw new Error(
      `[HomeworkSpecs] Refusing to overwrite existing file: ${path.relative(process.cwd(), outPath)} ` +
        `(pass --force to overwrite)`
    );
  }

  const moduleByDay = new Map<number, { moduleId: string; moduleName: string }>();
  for (const m of modules) {
    if (!m || typeof m !== "object") continue;
    if (!Array.isArray(m.days)) continue;
    for (const day of m.days) moduleByDay.set(day, { moduleId: m.moduleId, moduleName: m.moduleName });
  }

  const days: StructuredInputsDay[] = lessons
    .slice()
    .sort((a, b) => a.day - b.day)
    .map((lesson) => buildDaySpec({ lesson, module: moduleByDay.get(lesson.day) }));

  const file: StructuredInputsFile = {
    curriculumId,
    version: "0.1.0",
    generatedAt: new Date().toISOString(),
    source: { path: "curriculum/curriculum.json", curriculumVersion },
    days,
  };

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(file, null, pretty ? 2 : 0) + "\n", "utf-8");
  console.log(`[HomeworkSpecs] Wrote ${days.length} day specs → ${path.relative(process.cwd(), outPath)}`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
