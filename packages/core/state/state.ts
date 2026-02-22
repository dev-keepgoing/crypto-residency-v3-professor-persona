/**
 * Residency state machine: load/save state.json, append to state.md,
 * and helpers for history. Tracks current day, lesson, status, attempt, professor, and commit SHA.
 */
import fs from "fs";
import path from "path";
import { ResidencyState, HistoryEntry } from "../types";

const STATE_PATH = path.resolve(process.cwd(), "residency", "state.json");
const STATE_MD_PATH = path.resolve(process.cwd(), "residency", "state.md");

export function loadState(): ResidencyState {
  if (!fs.existsSync(STATE_PATH)) {
    throw new Error(`state.json not found at ${STATE_PATH}. Run init first.`);
  }
  const raw = fs.readFileSync(STATE_PATH, "utf-8");
  return JSON.parse(raw) as ResidencyState;
}

export function saveState(state: ResidencyState): void {
  const dir = path.dirname(STATE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2), "utf-8");
}

export function appendStateSummary(summary: string): void {
  const dir = path.dirname(STATE_MD_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const timestamp = new Date().toISOString();
  const entry = `\n---\n\n**[${timestamp}]**\n\n${summary}\n`;
  fs.appendFileSync(STATE_MD_PATH, entry, "utf-8");
}

export function pushHistoryEntry(state: ResidencyState, entry: HistoryEntry): ResidencyState {
  return {
    ...state,
    history: [...state.history, entry],
  };
}

export function getInitialState(): ResidencyState {
  return {
    currentDay: 1,
    currentLessonId: "FF-001",
    attempt: 1,
    status: "NOT_STARTED",
    professor: "euclid",
    lastCommitSha: null,
    history: [],
  };
}
