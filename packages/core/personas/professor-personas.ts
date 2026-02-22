/**
 * Professor persona definitions: euclid, turing, goldwasser, nakamoto.
 * Each defines teaching style, focus areas, strictness, grading bias, tone, and failure approach.
 * Loaded from prompts/personas.md — edit that file to change personas.
 */
import { ProfessorPersona } from "../types";
import { loadPersonas } from "./persona-loader";

export function getProfessorPersona(id: string): ProfessorPersona {
  const personas = loadPersonas();
  const persona = personas[id];
  if (!persona) {
    throw new Error(
      `Professor persona "${id}" not found. Available: ${Object.keys(personas).join(", ")}`
    );
  }
  return persona;
}

/** All personas keyed by id. Loaded from prompts/personas.md on first access. */
export function getProfessorPersonas(): Record<string, ProfessorPersona> {
  return loadPersonas();
}
