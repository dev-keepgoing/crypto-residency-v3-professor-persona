/**
 * Homework specs loader: reads homework-specs.json (or legacy structured-inputs.json)
 * and returns governed specs per day for lesson/homework/rubric prompts.
 */
import fs from "fs";
import path from "path";
import { StructuredInputsDay, StructuredInputsFile } from "../types";

const HOMEWORK_SPECS_PATH = path.resolve(process.cwd(), "curriculum", "homework-specs.json");
const LEGACY_STRUCTURED_INPUTS_PATH = path.resolve(process.cwd(), "curriculum", "structured-inputs.json");

let cachedStructured: StructuredInputsFile | null | undefined = undefined;

function loadStructuredInputsFile(): StructuredInputsFile | null {
  if (cachedStructured !== undefined) return cachedStructured;

  const activePath = fs.existsSync(HOMEWORK_SPECS_PATH)
    ? HOMEWORK_SPECS_PATH
    : fs.existsSync(LEGACY_STRUCTURED_INPUTS_PATH)
      ? LEGACY_STRUCTURED_INPUTS_PATH
      : null;

  if (!activePath) {
    cachedStructured = null;
    return cachedStructured;
  }

  const raw = fs.readFileSync(activePath, "utf-8");
  const parsed = JSON.parse(raw) as unknown;

  if (!parsed || typeof parsed !== "object") {
    throw new Error(`${activePath} must be a JSON object.`);
  }

  const file = parsed as StructuredInputsFile;
  if (!Array.isArray(file.days)) {
    throw new Error(`${activePath} must contain a "days" array.`);
  }

  cachedStructured = file;
  return cachedStructured;
}

export function getHomeworkSpecsFile(): StructuredInputsFile | null {
  return loadStructuredInputsFile();
}

export function getHomeworkSpecsByDay(day: number): StructuredInputsDay | null {
  const file = getHomeworkSpecsFile();
  if (!file) return null;
  const entry = file.days.find((d) => d.day === day);
  return entry ?? null;
}

export const getStructuredInputsFile = getHomeworkSpecsFile;
export const getStructuredInputsByDay = getHomeworkSpecsByDay;
