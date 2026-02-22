/**
 * Curriculum loader: reads curriculum.json, resolves lesson by day,
 * and exposes helpers for next lesson, residency complete, and last day.
 */
import fs from "fs";
import path from "path";
import { CurriculumLesson } from "../types";

const CURRICULUM_PATH = path.resolve(process.cwd(), "curriculum", "curriculum.json");

let cachedCurriculum: CurriculumLesson[] | null = null;

type CurriculumFileV2 = {
  curriculumId?: string;
  version?: string;
  totalDays?: number;
  modules?: unknown;
  lessons: CurriculumLesson[];
};

function loadCurriculum(): CurriculumLesson[] {
  if (cachedCurriculum) return cachedCurriculum;

  if (!fs.existsSync(CURRICULUM_PATH)) {
    throw new Error(
      `Curriculum file not found: ${CURRICULUM_PATH}. Create curriculum/curriculum.json in the project root.`
    );
  }

  const raw = fs.readFileSync(CURRICULUM_PATH, "utf-8");
  const parsed = JSON.parse(raw) as unknown;

  let lessons: CurriculumLesson[];
  if (Array.isArray(parsed)) {
    lessons = parsed as CurriculumLesson[];
  } else if (parsed && typeof parsed === "object" && Array.isArray((parsed as CurriculumFileV2).lessons)) {
    lessons = (parsed as CurriculumFileV2).lessons;
  } else {
    throw new Error(
      `${CURRICULUM_PATH} must be either a JSON array of lesson objects ` +
        `or an object with a "lessons" array.`
    );
  }

  lessons.sort((a, b) => a.day - b.day);
  cachedCurriculum = lessons;
  return lessons;
}

export function getCurriculum(): CurriculumLesson[] {
  return loadCurriculum();
}

export function getLessonByDay(day: number): CurriculumLesson | undefined {
  return getCurriculum().find((l) => l.day === day);
}

export function getLessonById(lessonId: string): CurriculumLesson | undefined {
  return getCurriculum().find((l) => l.lessonId === lessonId);
}

export function getNextLesson(currentDay: number): CurriculumLesson | undefined {
  return getCurriculum().find((l) => l.day === currentDay + 1);
}

export function isResidencyComplete(currentDay: number): boolean {
  return getLessonByDay(currentDay) === undefined;
}

export function getLastCurriculumDay(): number {
  const cur = getCurriculum();
  if (cur.length === 0) return 0;
  return cur[cur.length - 1].day;
}
