/**
 * Homework specs loader: pre-curriculum uses pre-homework-specs.json (global days 1–30),
 * main curriculum uses homework-specs.json (global days 31–120). Returns governed specs per global day.
 */
import fs from "fs";
import path from "path";
import { StructuredInputsDay, StructuredInputsFile } from "../types";
import { getCurriculum, PRE_CURRICULUM_DAYS, MAIN_CURRICULUM_FIRST_DAY } from "./curriculum";

const PRE_HOMEWORK_SPECS_PATH = path.resolve(process.cwd(), "curriculum", "pre-homework-specs.json");
const HOMEWORK_SPECS_PATH = path.resolve(process.cwd(), "curriculum", "homework-specs.json");
const LEGACY_STRUCTURED_INPUTS_PATH = path.resolve(process.cwd(), "curriculum", "structured-inputs.json");

let cachedPre: StructuredInputsFile | null | undefined = undefined;
let cachedMain: StructuredInputsFile | null | undefined = undefined;

function loadPreHomeworkSpecs(): StructuredInputsFile | null {
  if (cachedPre !== undefined) return cachedPre;
  if (!fs.existsSync(PRE_HOMEWORK_SPECS_PATH)) {
    cachedPre = null;
    return cachedPre;
  }
  const raw = fs.readFileSync(PRE_HOMEWORK_SPECS_PATH, "utf-8");
  const parsed = JSON.parse(raw) as unknown;
  if (!parsed || typeof parsed !== "object") {
    cachedPre = null;
    return cachedPre;
  }
  const file = parsed as StructuredInputsFile;
  cachedPre = Array.isArray(file.days) ? file : null;
  return cachedPre;
}

function loadMainHomeworkSpecs(): StructuredInputsFile | null {
  if (cachedMain !== undefined) return cachedMain;
  const activePath = fs.existsSync(HOMEWORK_SPECS_PATH)
    ? HOMEWORK_SPECS_PATH
    : fs.existsSync(LEGACY_STRUCTURED_INPUTS_PATH)
      ? LEGACY_STRUCTURED_INPUTS_PATH
      : null;
  if (!activePath) {
    cachedMain = null;
    return cachedMain;
  }
  const raw = fs.readFileSync(activePath, "utf-8");
  const parsed = JSON.parse(raw) as unknown;
  if (!parsed || typeof parsed !== "object") {
    cachedMain = null;
    return cachedMain;
  }
  const file = parsed as StructuredInputsFile;
  cachedMain = Array.isArray(file.days) ? file : null;
  return cachedMain;
}

export function getHomeworkSpecsFile(): StructuredInputsFile | null {
  return loadMainHomeworkSpecs();
}

/** Returns governed spec for the given global day (1–30 pre when present, then main). */
export function getHomeworkSpecsByDay(day: number): StructuredInputsDay | null {
  getCurriculum();
  if (day >= 1 && day < MAIN_CURRICULUM_FIRST_DAY) {
    const file = loadPreHomeworkSpecs();
    if (!file) return null;
    const entry = file.days.find((d) => d.day === day);
    return entry ?? null;
  }
  if (day >= MAIN_CURRICULUM_FIRST_DAY) {
    const file = loadMainHomeworkSpecs();
    if (!file) return null;
    const mainDay = day - MAIN_CURRICULUM_FIRST_DAY + 1;
    const entry = file.days.find((d) => d.day === mainDay);
    if (!entry) return null;
    return { ...entry, day };
  }
  return null;
}

export const getStructuredInputsFile = getHomeworkSpecsFile;
export const getStructuredInputsByDay = getHomeworkSpecsByDay;
