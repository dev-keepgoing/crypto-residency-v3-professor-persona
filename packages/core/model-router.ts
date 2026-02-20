import { TaskType } from "./types";

const MODEL_ROUTING_TABLE: Record<TaskType, string> = {
  lesson: "gpt-4o",        // Map to gpt-4o until gpt-5.2 is available via API
  grading: "gpt-4o",
  summary: "gpt-4o-mini",
  orchestration: "gpt-4o-mini",
};

// Override map — swap in production model names once available
const MODEL_ALIAS_MAP: Record<string, string> = {
  "gpt-5.2": "gpt-4o",
  "gpt-5-mini": "gpt-4o-mini",
  "gpt-5.2-pro": "gpt-4o",
};

export function routeTask(taskType: TaskType): string {
  const model = MODEL_ROUTING_TABLE[taskType];
  if (!model) {
    throw new Error(`Unknown task type for routing: "${taskType}"`);
  }
  return MODEL_ALIAS_MAP[model] ?? model;
}

export function resolveModel(modelAlias: string): string {
  return MODEL_ALIAS_MAP[modelAlias] ?? modelAlias;
}
