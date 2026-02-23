/**
 * Builds minimal spec views per stage (lesson / homework / rubric) from full
 * StructuredInputsDay. Used for ID-based, small prompt payloads (suggestions 1–2).
 */
import {
  StructuredInputsDay,
  LessonSpecView,
  HomeworkSpecView,
  RubricSpecView,
} from "../types";

function daySpecRef(day: number): string {
  return `residency/specs/day-${String(day).padStart(3, "0")}`;
}

export function getLessonSpecView(day: number, spec: StructuredInputsDay | null): LessonSpecView {
  const specRef = daySpecRef(day);
  if (!spec) {
    return {
      specRef,
      objectives: [],
      constraints: {},
      passScore: 80,
    };
  }
  const pc = spec.constraints?.problemCounts;
  return {
    specRef,
    objectives: spec.objectives.map((o) => ({ id: o.id, category: o.category, text: o.text })),
    constraints: {
      requiresDerivation: (pc?.math ?? 0) > 0,
      requiresImplementation: (pc?.implementation ?? 0) > 0,
      adversarialFocus: (pc?.adversarial ?? 0) > 0,
      problemCounts: pc ?? undefined,
    },
    passScore: spec.passScore ?? spec.rubric?.passingScore ?? 80,
  };
}

export function getHomeworkSpecView(day: number, spec: StructuredInputsDay | null): HomeworkSpecView {
  const specRef = daySpecRef(day);
  if (!spec) {
    return {
      specRef,
      problemCounts: { math: 3, implementation: 1, adversarial: 1 },
      objectiveIds: [],
      constraints: {},
    };
  }
  return {
    specRef,
    problemCounts: spec.constraints?.problemCounts ?? { math: 3, implementation: 1, adversarial: 1 },
    objectiveIds: spec.objectives.map((o) => o.id),
    constraints: spec.constraints,
  };
}

export function getRubricSpecView(day: number, spec: StructuredInputsDay | null): RubricSpecView {
  const specRef = daySpecRef(day);
  if (!spec) {
    return {
      specRef,
      problems: [],
      dimensions: [],
      passScore: 80,
    };
  }
  const dims = spec.rubric?.dimensions ?? [];
  const problems = dims.map((d, i) => ({
    id: d.id,
    title: d.name,
    type: "problem",
    points: d.points,
  }));
  return {
    specRef,
    problems,
    dimensions: dims.map((d) => ({
      id: d.id,
      name: d.name,
      points: d.points,
      minimumPoints: d.minimumPoints,
    })),
    passScore: spec.passScore ?? spec.rubric?.passingScore ?? 80,
  };
}
