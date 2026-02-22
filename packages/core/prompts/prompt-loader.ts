/**
 * Prompt loader: reads prompts/lesson-prompts.md, splits by ## sections,
 * and substitutes {{placeholders}} with persona/context values for lesson, homework, and rubric.
 */
import fs from "fs";
import path from "path";

const PROMPTS_PATH = path.resolve(process.cwd(), "prompts", "lesson-prompts.md");
const GRADING_PROMPTS_PATH = path.resolve(process.cwd(), "prompts", "grading-prompts.md");

let cachedSections: Record<string, string> | null = null;
let cachedGradingSections: Record<string, string> | null = null;

function parseSectionsFromFile(filePath: string): Record<string, string> {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Prompts file not found: ${filePath}`);
  }
  const raw = fs.readFileSync(filePath, "utf-8");
  const sections: Record<string, string> = {};
  const sectionRe = /^##\s+(.+)$/gm;
  let match: RegExpExecArray | null;
  let lastEnd = 0;
  let lastName: string | null = null;

  while ((match = sectionRe.exec(raw)) !== null) {
    if (lastName !== null) {
      const content = raw.slice(lastEnd, match.index).replace(/^\n+/, "").replace(/\n+$/, "");
      sections[lastName] = content;
    }
    lastName = match[1].trim();
    lastEnd = match.index + match[0].length;
  }

  if (lastName !== null) {
    const content = raw.slice(lastEnd).replace(/^\n+/, "").replace(/\n+$/, "");
    sections[lastName] = content;
  }

  return sections;
}

function loadSections(): Record<string, string> {
  if (cachedSections) return cachedSections;
  cachedSections = parseSectionsFromFile(PROMPTS_PATH);
  return cachedSections;
}

function loadGradingSections(): Record<string, string> {
  if (cachedGradingSections) return cachedGradingSections;
  cachedGradingSections = parseSectionsFromFile(GRADING_PROMPTS_PATH);
  return cachedGradingSections;
}

export type PromptSectionName =
  | "Lesson System"
  | "Lesson User"
  | "Homework System"
  | "Homework User"
  | "Rubric System"
  | "Rubric User";

export function getPromptSection(name: PromptSectionName): string {
  const sections = loadSections();
  const content = sections[name];
  if (content === undefined) {
    throw new Error(`Missing prompt section "## ${name}" in ${PROMPTS_PATH}`);
  }
  return content;
}

export type GradingPromptSectionName = "Grading System" | "Grading User";

export function getGradingPromptSection(name: GradingPromptSectionName): string {
  const sections = loadGradingSections();
  const content = sections[name];
  if (content === undefined) {
    throw new Error(`Missing grading prompt section "## ${name}" in ${GRADING_PROMPTS_PATH}`);
  }
  return content;
}

export function substitute(
  template: string,
  vars: Record<string, string | number | undefined>
): string {
  let out = template;
  const placeholderRe = /\{\{(\s*[\w.]+\s*)\}\}/g;

  out = out.replace(placeholderRe, (_, key) => {
    const k = key.trim();
    const value = vars[k];
    if (value === undefined || value === null) return "";
    return String(value);
  });

  return out;
}

export function buildLessonVars(
  persona: { name: string; teachingStyle: string; focusAreas: string[]; lessonTone: string; strictnessLevel: number; gradingBias?: string; failureApproach?: string },
  context: { day: number; topic: string; attempt: number },
  retryNote: string
): Record<string, string> {
  return {
    "persona.name": persona.name,
    "persona.teachingStyle": persona.teachingStyle,
    "persona.focusAreas": persona.focusAreas.map((a) => `- ${a}`).join("\n"),
    "persona.lessonTone": persona.lessonTone,
    "persona.strictnessLevel": String(persona.strictnessLevel),
    "persona.gradingBias": persona.gradingBias ?? "",
    "persona.failureApproach": persona.failureApproach ?? "",
    retryNote,
    day: String(context.day),
    topic: context.topic,
    attempt: String(context.attempt),
  };
}
