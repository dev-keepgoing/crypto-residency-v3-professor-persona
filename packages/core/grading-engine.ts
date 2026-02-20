import { GradeSubmissionParams, GradingResult } from "./types";
import { getProfessorPersona } from "./professor-personas";
import { routeTask } from "./model-router";
import { callOpenAI } from "../llm/openai-client";

const PASSING_SCORE = 80;

function buildGradingSystemPrompt(
  professorName: string,
  strictnessLevel: number,
  gradingBias: string
): string {
  return `You are ${professorName}, grading a student submission for a cryptography lesson.

GRADING BIAS:
${gradingBias}

STRICTNESS LEVEL: ${strictnessLevel}/10

You must evaluate the submission against:
1. Mathematical correctness — are all proofs and derivations valid?
2. Conceptual depth — does the student demonstrate genuine understanding vs. surface recall?
3. Implementation reasoning — is the student's computational thinking sound?
4. Adversarial awareness — does the student identify security assumptions and failure modes?

You MUST respond with ONLY a valid JSON object in exactly this format (no markdown, no extra text):
{
  "score": <integer 0-100>,
  "pass": <true|false>,
  "feedback": "<detailed multi-line feedback string>"
}

Passing rule: score >= ${PASSING_SCORE} AND no rubric dimension below its minimum threshold.
If the student passes, set pass: true. If the student fails, set pass: false.
Be consistent with your strictness level. Level ${strictnessLevel}/10 means ${strictnessLevelDescription(strictnessLevel)}.`;
}

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

  const systemPrompt = buildGradingSystemPrompt(
    persona.name,
    persona.strictnessLevel,
    persona.gradingBias
  );

  const userPrompt = `LESSON:
${lesson}

RUBRIC:
${rubric}

STUDENT SUBMISSION:
${submissionText}

Grade this submission according to the rubric and your grading standards.`;

  const raw = await callOpenAI({
    model,
    systemPrompt,
    userPrompt,
    temperature: 0.1,
    maxTokens: 1024,
    taskType: "grading",
  });

  let parsed: { score: number; pass: boolean; feedback: string };

  try {
    // Strip potential markdown code fences if model wraps JSON
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

  // Enforce passing rule independently of model judgment
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
