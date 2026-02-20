import { GenerateLessonParams, GeneratedLesson, ProfessorPersona } from "./types";
import { routeTask } from "./model-router";
import { callOpenAI } from "../llm/openai-client";

function buildLessonSystemPrompt(persona: ProfessorPersona, attempt: number): string {
  const retryNote =
    attempt > 1
      ? `\n\nIMPORTANT: This is attempt #${attempt}. The student previously failed this lesson. ` +
        `You MUST change your pedagogical framing entirely. Do NOT reuse phrasing, structure, ` +
        `or examples from the prior attempt. Address likely conceptual weaknesses directly. ` +
        `${persona.failureApproach}`
      : "";

  return `You are ${persona.name}, a cryptography professor with the following profile:

TEACHING STYLE:
${persona.teachingStyle}

FOCUS AREAS:
${persona.focusAreas.map((a) => `- ${a}`).join("\n")}

LESSON TONE:
${persona.lessonTone}

STRICTNESS LEVEL: ${persona.strictnessLevel}/10

Your task is to generate a complete cryptography lesson. The lesson MUST be in Markdown format and include ALL of the following sections — do not omit any:

1. **Formal Explanation** — rigorous, complete, and written in your established tone
2. **Derivation Section** — step-by-step mathematical derivation with no skipped steps
3. **Implementation Lab** — pseudocode or Python/TypeScript code with explicit edge cases
4. **Adversarial Thinking Challenge** — a concrete attack scenario the student must analyze
5. **Mastery Requirements** — an explicit list of what the student must demonstrate to pass${retryNote}`;
}

function buildHomeworkSystemPrompt(persona: ProfessorPersona, attempt: number): string {
  const retryNote =
    attempt > 1
      ? `\n\nThis is attempt #${attempt}. Construct entirely new problems. ` +
        `Vary the difficulty distribution and problem types from the prior attempt.`
      : "";

  return `You are ${persona.name}. Generate a homework assignment for the lesson just provided.

The homework must contain:
1. Three rigorous mathematical problems (proof-style or derivation-style)
2. One implementation problem with explicit edge case requirements
3. One adversarial analysis problem — describe a flawed protocol and ask the student to break it

Format as Markdown. Be precise about what constitutes a complete answer.${retryNote}`;
}

function buildRubricSystemPrompt(persona: ProfessorPersona): string {
  return `You are ${persona.name}. Generate a grading rubric for the homework assignment.

GRADING BIAS:
${persona.gradingBias}

The rubric must:
1. Assign point values to each problem (total = 100 points)
2. List explicit criteria for full credit, partial credit, and zero credit for each problem
3. Include a "Mastery Gate" section — the minimum score and conditions required to PASS
4. State the passing threshold: score >= 80 AND no rubric dimension below its minimum threshold

Format as Markdown with clear tables or structured lists.`;
}

export async function generateLessonContent(
  params: GenerateLessonParams,
  persona: ProfessorPersona
): Promise<GeneratedLesson> {
  const model = routeTask("lesson");
  const { day, topic, attempt } = params;

  console.log(`\n[LessonGenerator] Generating lesson — Day ${day}: "${topic}" (attempt ${attempt})`);
  console.log(`[LessonGenerator] Professor: ${persona.name} | Model: ${model}`);

  // Generate lesson.md
  const lessonContent = await callOpenAI({
    model,
    systemPrompt: buildLessonSystemPrompt(persona, attempt),
    userPrompt: `Generate a complete lesson for Day ${day}: **${topic}**.

This lesson is part of an intensive cryptography residency. The student is expected to achieve mastery.`,
    temperature: 0.2,
    maxTokens: 4096,
  });

  // Generate homework.md
  const homeworkContent = await callOpenAI({
    model,
    systemPrompt: buildHomeworkSystemPrompt(persona, attempt),
    userPrompt: `Based on the following lesson on "${topic}", generate the homework assignment:\n\n${lessonContent}`,
    temperature: 0.2,
    maxTokens: 2048,
  });

  // Generate rubric.md
  const rubricContent = await callOpenAI({
    model,
    systemPrompt: buildRubricSystemPrompt(persona),
    userPrompt: `Based on the following homework assignment, generate the grading rubric:\n\n${homeworkContent}`,
    temperature: 0.2,
    maxTokens: 2048,
  });

  return {
    lesson: lessonContent,
    homework: homeworkContent,
    rubric: rubricContent,
  };
}
