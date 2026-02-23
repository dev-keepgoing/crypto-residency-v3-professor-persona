/**
 * Lesson generator: static system prompts (cache-friendly), minimal user payload (spec views,
 * persona signature). Passes structured lesson metadata → homework, problem list → rubric (suggestions 1–5, 7).
 * When outputDir is set: reads existing lesson/homework/rubric from disk when present (skips OpenAI);
 * writes each artifact to disk as soon as it is generated.
 */
import fs from "fs";
import path from "path";
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
  const { day, topic, attempt, outputDir } = params;

  if (outputDir) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const governed = getHomeworkSpecsByDay(day);
  const lessonView = getLessonSpecView(day, governed);
  const homeworkView = getHomeworkSpecView(day, governed);
  const rubricView = getRubricSpecView(day, governed);
  const passScore = governed?.passScore ?? governed?.rubric?.passingScore ?? 80;

  const specRef = lessonView.specRef;
  const personaSignature = persona.signature ?? `${persona.name}: cryptography focus.`;
  const retryLesson = getRetryNote(attempt, "lesson");
  const retryHomework = getRetryNote(attempt, "homework");

  const lessonPath = outputDir ? path.join(outputDir, "lesson.md") : null;
  const homeworkPath = outputDir ? path.join(outputDir, "homework.md") : null;
  const rubricPath = outputDir ? path.join(outputDir, "rubric.md") : null;

  console.log(`\n[LessonGenerator] Generating lesson — Day ${day}: "${topic}" (attempt ${attempt})`);
  console.log(`[LessonGenerator] Professor: ${persona.name} | Model: ${model} | specRef: ${specRef}`);

  const lessonSystemPrompt = getPromptSection("Lesson System");
  const homeworkSystemPrompt = getPromptSection("Homework System");
  const rubricSystemPrompt = getPromptSection("Rubric System");

  // Lesson: use existing file if present, else generate and write
  let lessonContent: string;
  if (lessonPath && fs.existsSync(lessonPath)) {
    lessonContent = fs.readFileSync(lessonPath, "utf-8");
    console.log(`[LessonGenerator] Using existing lesson (${lessonPath})`);
  } else {
    lessonContent = await callOpenAI({
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
    if (lessonPath) {
      fs.writeFileSync(lessonPath, lessonContent, "utf-8");
      console.log(`[LessonGenerator] Wrote ${lessonPath}`);
    }
  }

  const lessonMetadata = parseLessonMetadata(lessonContent);
  const lessonMetadataJson = lessonMetadata
    ? JSON.stringify(lessonMetadata)
    : JSON.stringify({ keyPoints: [], definitions: [], coreDerivations: [], labAPIs: [], edgeCases: [], attackScenario: "" });

  // Homework: use existing file if present, else generate and write
  let homeworkContent: string;
  if (homeworkPath && fs.existsSync(homeworkPath)) {
    homeworkContent = fs.readFileSync(homeworkPath, "utf-8");
    console.log(`[LessonGenerator] Using existing homework (${homeworkPath})`);
  } else {
    homeworkContent = await callOpenAI({
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
      maxTokens: 2400,
      taskType: "lesson",
    });
    if (homeworkPath) {
      fs.writeFileSync(homeworkPath, homeworkContent, "utf-8");
      console.log(`[LessonGenerator] Wrote ${homeworkPath}`);
    }
  }

  const homeworkProblemList = parseHomeworkProblemList(homeworkContent);
  const homeworkProblemListJson = homeworkProblemList
    ? JSON.stringify(homeworkProblemList)
    : JSON.stringify({ problems: [] });

  // Rubric: use existing file if present, else generate and write
  let rubricContent: string;
  if (rubricPath && fs.existsSync(rubricPath)) {
    rubricContent = fs.readFileSync(rubricPath, "utf-8");
    console.log(`[LessonGenerator] Using existing rubric (${rubricPath})`);
  } else {
    rubricContent = await callOpenAI({
      model,
      systemPrompt: rubricSystemPrompt,
      userPrompt: buildRubricUserPrompt(
        specRef,
        JSON.stringify(rubricView),
        homeworkProblemListJson,
        passScore
      ),
      temperature: 0.2,
      maxTokens: 1600,
      taskType: "lesson",
    });
    if (rubricPath) {
      fs.writeFileSync(rubricPath, rubricContent, "utf-8");
      console.log(`[LessonGenerator] Wrote ${rubricPath}`);
    }
  }

  return {
    lesson: lessonContent,
    homework: homeworkContent,
    rubric: rubricContent,
  };
}

/**
 * Generate only homework for a retry (same lesson + rubric). Uses existing lesson to get metadata;
 * generates new problems that match the same spec so the existing rubric still applies.
 */
export async function generateHomeworkOnly(
  params: Pick<GenerateLessonParams, "day" | "topic" | "professorId" | "attempt">,
  persona: ProfessorPersona,
  existingLessonPath: string,
  outputDir: string
): Promise<string> {
  const model = routeTask("lesson");
  const { day, topic, professorId, attempt } = params;

  if (!fs.existsSync(existingLessonPath)) {
    throw new Error(`Existing lesson not found: ${existingLessonPath}`);
  }

  const lessonContent = fs.readFileSync(existingLessonPath, "utf-8");
  const lessonMetadata = parseLessonMetadata(lessonContent);
  const lessonMetadataJson = lessonMetadata
    ? JSON.stringify(lessonMetadata)
    : JSON.stringify({ keyPoints: [], definitions: [], coreDerivations: [], labAPIs: [], edgeCases: [], attackScenario: "" });

  const governed = getHomeworkSpecsByDay(day);
  const homeworkView = getHomeworkSpecView(day, governed);
  const specRef = homeworkView.specRef;
  const personaSignature = persona.signature ?? `${persona.name}: cryptography focus.`;
  const retryHomework = getRetryNote(attempt, "homework");

  const homeworkPath = path.join(outputDir, "homework.md");
  fs.mkdirSync(outputDir, { recursive: true });

  console.log(`\n[LessonGenerator] Generating homework only (retry attempt ${attempt}) — Day ${day}: "${topic}"`);
  console.log(`[LessonGenerator] Professor: ${persona.name} | Model: ${model} | specRef: ${specRef}`);

  const homeworkSystemPrompt = getPromptSection("Homework System");
  const homeworkContent = await callOpenAI({
    model,
    systemPrompt: homeworkSystemPrompt,
    userPrompt: buildHomeworkUserPrompt(
      topic,
      professorId,
      personaSignature,
      attempt,
      specRef,
      JSON.stringify(homeworkView),
      lessonMetadataJson,
      retryHomework
    ),
    temperature: 0.2,
    maxTokens: 2400,
    taskType: "lesson",
  });

  fs.writeFileSync(homeworkPath, homeworkContent, "utf-8");
  console.log(`[LessonGenerator] Wrote ${homeworkPath}`);

  return homeworkContent;
}
