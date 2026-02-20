import { CurriculumLesson } from "./types";

export const CURRICULUM: CurriculumLesson[] = [
  {
    lessonId: "FF-001",
    day: 1,
    topic: "Finite Fields — Modular Arithmetic",
    defaultProfessorId: "euclid",
  },
  {
    lessonId: "FF-002",
    day: 2,
    topic: "Modular Inverses",
    defaultProfessorId: "euclid",
  },
  {
    lessonId: "EC-001",
    day: 3,
    topic: "Elliptic Curve Point Addition",
    defaultProfessorId: "goldwasser",
  },
];

export function getLessonByDay(day: number): CurriculumLesson | undefined {
  return CURRICULUM.find((l) => l.day === day);
}

export function getLessonById(lessonId: string): CurriculumLesson | undefined {
  return CURRICULUM.find((l) => l.lessonId === lessonId);
}

export function getNextLesson(currentDay: number): CurriculumLesson | undefined {
  return CURRICULUM.find((l) => l.day === currentDay + 1);
}
