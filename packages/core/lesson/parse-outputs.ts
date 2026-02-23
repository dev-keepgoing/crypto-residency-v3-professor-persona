/**
 * Parse structured outputs from lesson and homework markdown (suggestion 3).
 * Extracts JSON from fenced ```json ... ``` blocks at the start of the content.
 */
import { LessonMetadata, HomeworkProblemList } from "../types";

const JSON_FENCE_RE = /^```(?:json)?\s*\n([\s\S]*?)\n```/m;

export function parseLessonMetadata(lessonMarkdown: string): LessonMetadata | null {
  const match = lessonMarkdown.trim().match(JSON_FENCE_RE);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[1].trim()) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    const o = parsed as Record<string, unknown>;
    return {
      keyPoints: Array.isArray(o.keyPoints) ? (o.keyPoints as string[]) : undefined,
      definitions: Array.isArray(o.definitions) ? (o.definitions as string[]) : undefined,
      coreDerivations: Array.isArray(o.coreDerivations) ? (o.coreDerivations as string[]) : undefined,
      labAPIs: Array.isArray(o.labAPIs) ? (o.labAPIs as string[]) : undefined,
      edgeCases: Array.isArray(o.edgeCases) ? (o.edgeCases as string[]) : undefined,
      attackScenario: typeof o.attackScenario === "string" ? o.attackScenario : undefined,
    };
  } catch {
    return null;
  }
}

export function parseHomeworkProblemList(homeworkMarkdown: string): HomeworkProblemList | null {
  const match = homeworkMarkdown.trim().match(JSON_FENCE_RE);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[1].trim()) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    const o = parsed as Record<string, unknown>;
    if (!Array.isArray(o.problems)) return null;
    const problems = o.problems
      .filter((p): p is Record<string, unknown> => p != null && typeof p === "object")
      .map((p) => ({
        id: String(p.id ?? ""),
        type: String(p.type ?? "problem"),
        points: typeof p.points === "number" ? p.points : 0,
        title: p.title != null ? String(p.title) : undefined,
      }));
    return { problems };
  } catch {
    return null;
  }
}

/** Strip the leading JSON fenced block from markdown so the rest is the main content. */
export function stripLeadingJsonBlock(markdown: string): string {
  const trimmed = markdown.trim();
  const match = trimmed.match(JSON_FENCE_RE);
  if (!match) return trimmed;
  const after = trimmed.slice(match.index! + match[0].length).replace(/^\n+/, "");
  return after.trim();
}
