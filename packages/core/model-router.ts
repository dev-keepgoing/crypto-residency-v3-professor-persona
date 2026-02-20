import { TaskType } from "./types";

const MODEL_ROUTING_TABLE: Record<TaskType, string> = {
  lesson: "gpt-5.2",
  grading: "gpt-5.2",
  summary: "gpt-5-mini",
  orchestration: "gpt-5-mini",
};

export function routeTask(taskType: TaskType): string {
  const model = MODEL_ROUTING_TABLE[taskType];
  if (!model) {
    throw new Error(`Unknown task type for routing: "${taskType}"`);
  }
  return model;
}

export function resolveModel(modelAlias: string): string {
  return modelAlias;
}
