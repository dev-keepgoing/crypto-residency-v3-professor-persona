// ─── Lesson Status ───────────────────────────────────────────────────────────

export type LessonStatus =
  | "NOT_STARTED"
  | "ASSIGNED"
  | "SUBMITTED"
  | "PASS"
  | "FAIL";

// ─── Professor Persona ────────────────────────────────────────────────────────

export interface ProfessorPersona {
  id: string;
  name: string;
  teachingStyle: string;
  focusAreas: string[];
  strictnessLevel: number; // 1–10
  gradingBias: string;
  lessonTone: string;
  failureApproach: string;
}

// ─── Curriculum ───────────────────────────────────────────────────────────────

export interface CurriculumLesson {
  lessonId: string;
  day: number;
  topic: string;
  defaultProfessorId: string;
}

// ─── Residency State ─────────────────────────────────────────────────────────

export interface HistoryEntry {
  day: number;
  lessonId: string;
  attempt: number;
  status: LessonStatus;
  commitSha: string | null;
  timestamp: string;
}

export interface ResidencyState {
  currentDay: number;
  currentLessonId: string;
  attempt: number;
  status: LessonStatus;
  professor: string;
  lastCommitSha: string | null;
  history: HistoryEntry[];
}

// ─── Lesson Generation ───────────────────────────────────────────────────────

export interface GenerateLessonParams {
  day: number;
  topic: string;
  professorId: string;
  attempt: number;
}

export interface GeneratedLesson {
  lesson: string;
  homework: string;
  rubric: string;
}

// ─── Grading ─────────────────────────────────────────────────────────────────

export interface GradeSubmissionParams {
  professorId: string;
  lesson: string;
  rubric: string;
  submissionText: string;
}

export interface GradingResult {
  score: number;
  pass: boolean;
  feedback: string;
}

// ─── GitHub Commit ───────────────────────────────────────────────────────────

export interface CommitFile {
  path: string;
  content: string;
}

export interface CommitResult {
  sha: string;
  url: string;
}

// ─── Model Router ────────────────────────────────────────────────────────────

export type TaskType = "lesson" | "grading" | "summary" | "orchestration";

// ─── OpenAI Client ────────────────────────────────────────────────────────────

export interface OpenAICallParams {
  model: string;
  systemPrompt: string;
  userPrompt: string;
  temperature: number;
  maxTokens?: number;
}
