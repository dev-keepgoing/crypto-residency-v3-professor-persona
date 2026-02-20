import { GenerateLessonParams, GeneratedLesson } from "./types";
import { getProfessorPersona } from "./professor-personas";
import { generateLessonContent } from "./lesson-generator";

export async function generateLesson(params: GenerateLessonParams): Promise<GeneratedLesson> {
  const { professorId, day, topic, attempt } = params;

  console.log(`\n[ProfessorEngine] Activating Professor: ${professorId}`);

  const persona = getProfessorPersona(professorId);

  const result = await generateLessonContent(params, persona);

  console.log(
    `[ProfessorEngine] Lesson generated — Day ${day} | ${topic} | ` +
      `attempt=${attempt} | professor=${persona.name}`
  );

  return result;
}
