/**
 * Shared TypeScript types and interfaces for the residency engine:
 * lesson status, professor personas, curriculum, state, lesson generation,
 * grading, GitHub commits, model routing, and OpenAI client params.
 */

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
  /** One-line signature for prompts (cache-friendly). Full fields used for grading. */
  signature?: string;
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
  difficulty?: number;
  passScore?: number;
}

// ─── Governed Specs (Structured Inputs) ─────────────────────────────────────

export type ObjectiveCategory =
  | "concept"
  | "derivation"
  | "computation"
  | "implementation"
  | "adversarial"
  | "review";

export interface GovernedObjective {
  id: string;
  category: ObjectiveCategory;
  text: string;
}

export interface GovernedProblemCounts {
  math: number;
  implementation: number;
  adversarial: number;
}

export interface GovernedConstraints {
  timeboxMinutes?: number;
  problemCounts?: GovernedProblemCounts;
  allowedLanguages?: string[];
  allowedResources?: string[];
  disallowedResources?: string[];
  responseFormat?: {
    requireMarkdown?: boolean;
    requireLatex?: boolean;
    requireCodeFences?: boolean;
  };
}

export interface GovernedRubricDimension {
  id: string;
  name: string;
  points: number;
  minimumPoints: number;
}

export interface GovernedRubricSpec {
  totalPoints: number;
  passingScore: number;
  dimensions: GovernedRubricDimension[];
  masteryGate: string;
}

export interface StructuredInputsDay {
  day: number;
  lessonId: string;
  topic: string;
  moduleId?: string;
  moduleName?: string;
  difficulty?: number;
  passScore?: number;
  objectives: GovernedObjective[];
  constraints: GovernedConstraints;
  rubric: GovernedRubricSpec;
}

export interface StructuredInputsFile {
  curriculumId: string;
  version: string;
  generatedAt: string;
  source: {
    path: string;
    curriculumVersion?: string;
  };
  days: StructuredInputsDay[];
}

// ─── Minimal spec views (ID-based, small payloads) ───────────────────────────

export interface LessonSpecView {
  specRef: string;
  objectives: { id: string; category: string; text: string }[];
  constraints: { requiresDerivation?: boolean; requiresImplementation?: boolean; adversarialFocus?: boolean; problemCounts?: GovernedProblemCounts };
  passScore: number;
}

export interface HomeworkSpecView {
  specRef: string;
  problemCounts: GovernedProblemCounts;
  objectiveIds: string[];
  constraints: GovernedConstraints;
}

export interface RubricSpecView {
  specRef: string;
  problems: { id: string; title?: string; type?: string; points: number }[];
  dimensions: { id: string; name: string; points: number; minimumPoints: number }[];
  passScore: number;
}

// ─── Structured outputs (lesson → homework, homework → rubric) ───────────────

export interface LessonMetadata {
  keyPoints?: string[];
  definitions?: string[];
  coreDerivations?: string[];
  labAPIs?: string[];
  edgeCases?: string[];
  attackScenario?: string;
}

export interface HomeworkProblemItem {
  id: string;
  type: string;
  points: number;
  title?: string;
}

export interface HomeworkProblemList {
  problems: HomeworkProblemItem[];
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
  taskType?: TaskType;
}
