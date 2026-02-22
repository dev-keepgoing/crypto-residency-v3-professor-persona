/**
 * Persona loader: reads prompts/personas.md, parses ## personaId and ### field blocks,
 * and returns a map of ProfessorPersona for use by professor-engine and grading.
 */
import fs from "fs";
import path from "path";
import { ProfessorPersona } from "../types";

const PERSONAS_PATH = path.resolve(process.cwd(), "prompts", "personas.md");

let cachedPersonas: Record<string, ProfessorPersona> | null = null;

function parsePersonasMarkdown(raw: string): Record<string, ProfessorPersona> {
  const result: Record<string, ProfessorPersona> = {};
  const personaBlocks = raw.split(/\n##\s+/).filter((b) => b.trim());

  for (const block of personaBlocks) {
    const lines = block.split("\n");
    const idLine = lines[0].trim();
    const id = idLine.toLowerCase().replace(/\s+/g, "-");
    if (!id || id.startsWith("#") || id.length > 30) continue;

    const fields: Record<string, string> = {};
    let currentKey: string | null = null;
    let currentLines: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const subMatch = line.match(/^###\s+(.+)$/);
      if (subMatch) {
        if (currentKey) {
          fields[currentKey] = currentLines.join("\n").trim();
        }
        currentKey = subMatch[1].trim().toLowerCase().replace(/\s+/g, "");
        currentLines = [];
      } else if (currentKey) {
        currentLines.push(line);
      }
    }
    if (currentKey) {
      fields[currentKey] = currentLines.join("\n").trim();
    }

    const focusAreasRaw = fields.focusareas ?? "";
    const focusAreas = focusAreasRaw
      .split("\n")
      .map((s) => s.replace(/^\s*-\s*/, "").trim())
      .filter(Boolean);

    const strictnessLevel = parseInt(fields.strictnesslevel ?? "5", 10);
    if (Number.isNaN(strictnessLevel) || strictnessLevel < 1 || strictnessLevel > 10) {
      throw new Error(`personas.md: persona "${id}" has invalid strictnessLevel (must be 1–10).`);
    }

    result[id] = {
      id,
      name: fields.name ?? id,
      teachingStyle: fields.teachingstyle ?? "",
      focusAreas: focusAreas.length ? focusAreas : ["General cryptography"],
      strictnessLevel,
      gradingBias: fields.gradingbias ?? "",
      lessonTone: fields.lessontone ?? "",
      failureApproach: fields.failureapproach ?? "",
    };
  }

  return result;
}

export function loadPersonas(): Record<string, ProfessorPersona> {
  if (cachedPersonas) return cachedPersonas;

  if (!fs.existsSync(PERSONAS_PATH)) {
    throw new Error(
      `Personas file not found: ${PERSONAS_PATH}. Create prompts/personas.md in the project root.`
    );
  }

  const raw = fs.readFileSync(PERSONAS_PATH, "utf-8");
  cachedPersonas = parsePersonasMarkdown(raw);
  return cachedPersonas;
}
