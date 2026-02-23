/**
 * Grading engine: static system prompt (cache-friendly), variable data in user message.
 * Loads persona for gradingBias and strictness; outputs JSON score/pass/feedback; enforces passing rule.
 */
import { GradeSubmissionParams, GradingResult } from "../types";
import { getProfessorPersona } from "../personas";
import { routeTask } from "../routing";
import { getGradingPromptSection, substitute } from "../prompts";
import { callOpenAI } from "../../llm/openai-client";

const PASSING_SCORE = 80;

function strictnessLevelDescription(level: number): string {
  if (level >= 9) return "near-zero tolerance for gaps — only exceptional work passes";
  if (level >= 7) return "high standards — minor hand-waving will cost significant points";
  if (level >= 5) return "moderate standards — clear understanding required for passing";
  return "accessible standards — good faith effort with correct core ideas can pass";
}

export async function gradeSubmission(params: GradeSubmissionParams): Promise<GradingResult> {
  const { professorId, lesson, rubric, submissionText } = params;

  const persona = getProfessorPersona(professorId);
  const model = routeTask("grading");

  console.log(`\n[GradingEngine] Grading submission — Professor: ${persona.name} | Model: ${model}`);

  const systemPrompt = getGradingPromptSection("Grading System");

  const userPrompt = substitute(
    getGradingPromptSection("Grading User"),
    {
      lesson,
      rubric,
      submissionText,
      professorId: persona.id,
      gradingBias: persona.gradingBias,
      passingScore: String(PASSING_SCORE),
      strictnessLevel: String(persona.strictnessLevel),
      strictnessDescription: strictnessLevelDescription(persona.strictnessLevel),
    }
  );

  const raw = await callOpenAI({
    model,
    systemPrompt,
    userPrompt,
    temperature: 0.1,
    maxTokens: 900,
    taskType: "grading",
  });

  let parsed: { score: number; pass: boolean; feedback: string };

  try {
    const cleaned = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(`GradingEngine: Failed to parse grading response as JSON.\nRaw: ${raw}`);
  }

  if (
    typeof parsed.score !== "number" ||
    typeof parsed.pass !== "boolean" ||
    typeof parsed.feedback !== "string"
  ) {
    throw new Error(`GradingEngine: Malformed grading JSON structure.\nRaw: ${raw}`);
  }

  const enforced: GradingResult = {
    score: parsed.score,
    pass: parsed.score >= PASSING_SCORE && parsed.pass,
    feedback: parsed.feedback,
  };

  console.log(
    `[GradingEngine] Result — score=${enforced.score} pass=${enforced.pass}`
  );

  return enforced;
}
