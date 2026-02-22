/**
 * Lesson generator: builds system/user prompts from templates and persona,
 * calls OpenAI for lesson, homework, and rubric in sequence, and returns all three markdown strings.
 */
import { GenerateLessonParams, GeneratedLesson, ProfessorPersona } from "../types";
import { routeTask } from "../routing";
import { callOpenAI } from "../../llm/openai-client";
import { getPromptSection, substitute, buildLessonVars } from "../prompts";
import { getHomeworkSpecsByDay } from "../curriculum/homework-specs";

function getRetryNoteLesson(attempt: number, failureApproach: string): string {
  if (attempt <= 1) return "";
  return (
    `\n\nIMPORTANT: This is attempt #${attempt}. The student previously failed this lesson. ` +
    `You MUST change your pedagogical framing entirely. Do NOT reuse phrasing, structure, ` +
    `or examples from the prior attempt. Address likely conceptual weaknesses directly. ` +
    failureApproach
  );
}

function getRetryNoteHomework(attempt: number): string {
  if (attempt <= 1) return "";
  return (
    `\n\nThis is attempt #${attempt}. Construct entirely new problems. ` +
    `Vary the difficulty distribution and problem types from the prior attempt.`
  );
}

function buildLessonSystemPrompt(persona: ProfessorPersona, attempt: number): string {
  const template = getPromptSection("Lesson System");
  const vars = buildLessonVars(persona, { day: 0, topic: "", attempt }, getRetryNoteLesson(attempt, persona.failureApproach));
  return substitute(template, vars);
}

function buildLessonUserPrompt(day: number, topic: string, governedSpecsJson: string): string {
  const template = getPromptSection("Lesson User");
  return substitute(template, { day: String(day), topic, governedSpecsJson });
}

function buildHomeworkSystemPrompt(persona: ProfessorPersona, attempt: number): string {
  const template = getPromptSection("Homework System");
  const vars = buildLessonVars(persona, { day: 0, topic: "", attempt }, getRetryNoteHomework(attempt));
  return substitute(template, vars);
}

function buildHomeworkUserPrompt(topic: string, lessonContent: string, governedSpecsJson: string): string {
  const template = getPromptSection("Homework User");
  return substitute(template, { topic, lessonContent, governedSpecsJson });
}

function buildRubricSystemPrompt(persona: ProfessorPersona, passScore: number): string {
  const template = getPromptSection("Rubric System");
  const vars = buildLessonVars(persona, { day: 0, topic: "", attempt: 0 }, "");
  return substitute(template, { ...vars, passScore: String(passScore) });
}

function buildRubricUserPrompt(homeworkContent: string, governedSpecsJson: string): string {
  const template = getPromptSection("Rubric User");
  return substitute(template, { homeworkContent, governedSpecsJson });
}

export async function generateLessonContent(
  params: GenerateLessonParams,
  persona: ProfessorPersona
): Promise<GeneratedLesson> {
  const model = routeTask("lesson");
  const { day, topic, attempt } = params;

  const governed = getHomeworkSpecsByDay(day);
  const governedSpecsJson = JSON.stringify(governed ?? {}, null, 2);
  const passScore = governed?.passScore ?? 80;

  console.log(`\n[LessonGenerator] Generating lesson — Day ${day}: "${topic}" (attempt ${attempt})`);
  console.log(`[LessonGenerator] Professor: ${persona.name} | Model: ${model}`);

  const lessonContent = await callOpenAI({
    model,
    systemPrompt: buildLessonSystemPrompt(persona, attempt),
    userPrompt: buildLessonUserPrompt(day, topic, governedSpecsJson),
    temperature: 0.2,
    maxTokens: 4096,
    taskType: "lesson",
  });

  const homeworkContent = await callOpenAI({
    model,
    systemPrompt: buildHomeworkSystemPrompt(persona, attempt),
    userPrompt: buildHomeworkUserPrompt(topic, lessonContent, governedSpecsJson),
    temperature: 0.2,
    maxTokens: 2048,
    taskType: "lesson",
  });

  const rubricContent = await callOpenAI({
    model,
    systemPrompt: buildRubricSystemPrompt(persona, passScore),
    userPrompt: buildRubricUserPrompt(homeworkContent, governedSpecsJson),
    temperature: 0.2,
    maxTokens: 2048,
    taskType: "lesson",
  });

  return {
    lesson: lessonContent,
    homework: homeworkContent,
    rubric: rubricContent,
  };
}
