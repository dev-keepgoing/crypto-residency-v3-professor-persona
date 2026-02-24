/**
 * Curriculum loader: reads pre-curriculum.json (days 1–30) and curriculum.json (main, days 31–120).
 * Pre-curriculum must be passed before main; same lesson flow (generate, submit, grade, pass).
 * Unified timeline: global day 1–30 = pre, 31–120 = main.
 */
import fs from "fs";
import path from "path";
import { CurriculumLesson } from "../types";

const PRE_CURRICULUM_PATH = path.resolve(process.cwd(), "curriculum", "pre-curriculum.json");
const CURRICULUM_PATH = path.resolve(process.cwd(), "curriculum", "curriculum.json");

/** Number of days in pre-curriculum when present; main curriculum starts at day PRE_CURRICULUM_DAYS + 1. */
export const PRE_CURRICULUM_DAYS = 30;

/** First global day of main curriculum (31 when pre exists, 1 when pre missing). */
export let MAIN_CURRICULUM_FIRST_DAY = PRE_CURRICULUM_DAYS + 1;

/** Last global day (120 when pre exists, 90 when pre missing). */
export let TOTAL_CURRICULUM_DAYS = 120;

let cachedCurriculum: CurriculumLesson[] | null = null;

type CurriculumFileV2 = {
  curriculumId?: string;
  version?: string;
  totalDays?: number;
  modules?: unknown;
  lessons: CurriculumLesson[];
};

function loadLessonsFromFile(filePath: string): CurriculumLesson[] {
  if (!fs.existsSync(filePath)) return [];
  const raw = fs.readFileSync(filePath, "utf-8");
  const parsed = JSON.parse(raw) as unknown;
  let lessons: CurriculumLesson[];
  if (Array.isArray(parsed)) {
    lessons = parsed as CurriculumLesson[];
  } else if (parsed && typeof parsed === "object" && Array.isArray((parsed as CurriculumFileV2).lessons)) {
    lessons = (parsed as CurriculumFileV2).lessons;
  } else {
    return [];
  }
  lessons.sort((a, b) => a.day - b.day);
  return lessons;
}

/** Returns unified curriculum: pre days 1–30, then main days 31–120. Each lesson has global day. */
function loadCurriculum(): CurriculumLesson[] {
  if (cachedCurriculum) return cachedCurriculum;

  const preLessons = loadLessonsFromFile(PRE_CURRICULUM_PATH);
  const mainLessons = loadLessonsFromFile(CURRICULUM_PATH);

  if (mainLessons.length === 0) {
    throw new Error(
      `Main curriculum not found or empty: ${CURRICULUM_PATH}. Create curriculum/curriculum.json with a "lessons" array.`
    );
  }

  const hasPre = preLessons.length > 0;
  MAIN_CURRICULUM_FIRST_DAY = hasPre ? PRE_CURRICULUM_DAYS + 1 : 1;
  TOTAL_CURRICULUM_DAYS = hasPre ? PRE_CURRICULUM_DAYS + mainLessons.length : mainLessons.length;

  const unified: CurriculumLesson[] = [];
  if (hasPre) {
    for (const l of preLessons) {
      if (l.day >= 1 && l.day <= PRE_CURRICULUM_DAYS) {
        unified.push({ ...l, day: l.day });
      }
    }
  }
  for (const l of mainLessons) {
    const globalDay = MAIN_CURRICULUM_FIRST_DAY + (l.day - 1);
    if (globalDay <= TOTAL_CURRICULUM_DAYS) {
      unified.push({ ...l, day: globalDay });
    }
  }
  unified.sort((a, b) => a.day - b.day);
  cachedCurriculum = unified;
  return unified;
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
  return currentDay > TOTAL_CURRICULUM_DAYS || getLessonByDay(currentDay) === undefined;
}

export function getLastCurriculumDay(): number {
  return TOTAL_CURRICULUM_DAYS;
}

/** True if global day is in pre-curriculum (only when pre exists). */
export function isPreCurriculumDay(day: number): boolean {
  return day >= 1 && day < MAIN_CURRICULUM_FIRST_DAY;
}