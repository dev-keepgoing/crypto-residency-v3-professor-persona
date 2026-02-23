/**
 * Lesson generator: static system prompts (cache-friendly), minimal user payload (spec views,
 * persona signature). Passes structured lesson metadata → homework, problem list → rubric (suggestions 1–5, 7).
 */
import { GenerateLessonParams, GeneratedLesson, ProfessorPersona } from "../types";
import { routeTask } from "../routing";
import { callOpenAI } from "../../llm/openai-client";
import { getPromptSection, substitute } from "../prompts";
import { getHomeworkSpecsByDay, getLessonSpecView, getHomeworkSpecView, getRubricSpecView } from "../curriculum";
import { parseLessonMetadata, parseHomeworkProblemList } from "./parse-outputs";

function getRetryNote(attempt: number, kind: "lesson" | "homework"): string {
  if (attempt <= 1) return "";
  if (kind === "lesson") {
    return '\n\nRetry note: This is attempt ' + attempt + '. Vary pedagogical framing; address likely weaknesses; do not repeat prior phrasing.';
  }
  return '\n\nRetry note: This is attempt ' + attempt + '. Construct entirely new problems; vary difficulty and types.';
}

function buildLessonUserPrompt(
  day: number,
  topic: string,
  professorId: string,
  personaSignature: string,
  attempt: number,
  specRef: string,
  lessonSpecJson: string,
  retryNote: string
): string {
  const template = getPromptSection("Lesson User");
  return substitute(template, {
    day: String(day),
    topic,
    professorId,
    personaSignature,
    attempt: String(attempt),
    specRef,
    lessonSpecJson,
    retryNote,
  });
}

function buildHomeworkUserPrompt(
  topic: string,
  professorId: string,
  personaSignature: string,
  attempt: number,
  specRef: string,
  homeworkSpecJson: string,
  lessonMetadataJson: string,
  retryNote: string
): string {
  const template = getPromptSection("Homework User");
  return substitute(template, {
    topic,
    professorId,
    personaSignature,
    attempt: String(attempt),
    specRef,
    homeworkSpecJson,
    lessonMetadataJson,
    retryNote,
  });
}

function buildRubricUserPrompt(
  specRef: string,
  rubricSpecJson: string,
  homeworkProblemListJson: string,
  passScore: number
): string {
  const template = getPromptSection("Rubric User");
  return substitute(template, {
    specRef,
    rubricSpecJson,
    homeworkProblemListJson,
    passScore: String(passScore),
  });
}

export async function generateLessonContent(
  params: GenerateLessonParams,
  persona: ProfessorPersona
): Promise<GeneratedLesson> {
  const model = routeTask("lesson");
  const { day, topic, attempt } = params;

  const governed = getHomeworkSpecsByDay(day);
  const lessonView = getLessonSpecView(day, governed);
  const homeworkView = getHomeworkSpecView(day, governed);
  const rubricView = getRubricSpecView(day, governed);
  const passScore = governed?.passScore ?? governed?.rubric?.passingScore ?? 80;

  const specRef = lessonView.specRef;
  const personaSignature = persona.signature ?? `${persona.name}: cryptography focus.`;
  const retryLesson = getRetryNote(attempt, "lesson");
  const retryHomework = getRetryNote(attempt, "homework");

  console.log(`\n[LessonGenerator] Generating lesson — Day ${day}: "${topic}" (attempt ${attempt})`);
  console.log(`[LessonGenerator] Professor: ${persona.name} | Model: ${model} | specRef: ${specRef}`);

  // Static system prompts (no persona injection — cache-friendly)
  const lessonSystemPrompt = getPromptSection("Lesson System");
  const homeworkSystemPrompt = getPromptSection("Homework System");
  const rubricSystemPrompt = getPromptSection("Rubric System");

  const lessonContent = await callOpenAI({
    model,
    systemPrompt: lessonSystemPrompt,
    userPrompt: buildLessonUserPrompt(
      day,
      topic,
      persona.id,
      personaSignature,
      attempt,
      specRef,
      JSON.stringify(lessonView),
      retryLesson
    ),
    temperature: 0.2,
    maxTokens: 3500,
    taskType: "lesson",
  });

  const lessonMetadata = parseLessonMetadata(lessonContent);
  const lessonMetadataJson = lessonMetadata
    ? JSON.stringify(lessonMetadata)
    : JSON.stringify({ keyPoints: [], definitions: [], coreDerivations: [], labAPIs: [], edgeCases: [], attackScenario: "" });

  const homeworkContent = await callOpenAI({
    model,
    systemPrompt: homeworkSystemPrompt,
    userPrompt: buildHomeworkUserPrompt(
      topic,
      persona.id,
      personaSignature,
      attempt,
      specRef,
      JSON.stringify(homeworkView),
      lessonMetadataJson,
      retryHomework
    ),
    temperature: 0.2,
    maxTokens: 1200,
    taskType: "lesson",
  });

  const homeworkProblemList = parseHomeworkProblemList(homeworkContent);
  const homeworkProblemListJson = homeworkProblemList
    ? JSON.stringify(homeworkProblemList)
    : JSON.stringify({ problems: [] });

  const rubricContent = await callOpenAI({
    model,
    systemPrompt: rubricSystemPrompt,
    userPrompt: buildRubricUserPrompt(
      specRef,
      JSON.stringify(rubricView),
      homeworkProblemListJson,
      passScore
    ),
    temperature: 0.2,
    maxTokens: 1200,
    taskType: "lesson",
  });

  return {
    lesson: lessonContent,
    homework: homeworkContent,
    rubric: rubricContent,
  };
}
