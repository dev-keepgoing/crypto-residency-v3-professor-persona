import fs from "fs";
import path from "path";
import { TaskType } from "./types";

// ─── Pricing Table ────────────────────────────────────────────────────────────
// Matches docs/pricing.md — update both if pricing changes.

interface ModelPricing {
  inputPerM: number;
  cachedInputPerM: number | null;
  outputPerM: number;
}

const PRICING: Record<string, ModelPricing> = {
  "gpt-5.2": {
    inputPerM: 1.75,
    cachedInputPerM: 0.175,
    outputPerM: 14.0,
  },
  "gpt-5.2-pro": {
    inputPerM: 21.0,
    cachedInputPerM: null,
    outputPerM: 168.0,
  },
  "gpt-5-mini": {
    inputPerM: 0.25,
    cachedInputPerM: 0.025,
    outputPerM: 2.0,
  },
};

// ─── Task → Logical Model ─────────────────────────────────────────────────────

const TASK_TO_LOGICAL_MODEL: Record<TaskType, string> = {
  lesson: "gpt-5.2",
  grading: "gpt-5.2",
  summary: "gpt-5-mini",
  orchestration: "gpt-5-mini",
};

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TokenUsage {
  promptTokens: number;
  cachedTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface CostBreakdown {
  inputCostUSD: number;
  cachedInputCostUSD: number;
  outputCostUSD: number;
  totalCostUSD: number;
}

export interface UsageEntry {
  timestamp: string;
  taskType: TaskType;
  logicalModel: string;
  apiModel: string;
  usage: TokenUsage;
  cost: CostBreakdown;
}

// ─── Paths ────────────────────────────────────────────────────────────────────

const USAGE_JSON_PATH = path.resolve(process.cwd(), "residency", "usage.json");
const USAGE_MD_PATH = path.resolve(process.cwd(), "residency", "usage.md");

// ─── Cost Calculator ──────────────────────────────────────────────────────────

export function calculateCost(logicalModel: string, usage: TokenUsage): CostBreakdown {
  const pricing = PRICING[logicalModel];
  if (!pricing) {
    console.warn(`[UsageLogger] No pricing found for model "${logicalModel}" — cost recorded as $0.`);
    return { inputCostUSD: 0, cachedInputCostUSD: 0, outputCostUSD: 0, totalCostUSD: 0 };
  }

  const nonCachedInputTokens = usage.promptTokens - usage.cachedTokens;
  const inputCostUSD = nonCachedInputTokens * (pricing.inputPerM / 1_000_000);
  const cachedInputCostUSD =
    pricing.cachedInputPerM !== null
      ? usage.cachedTokens * (pricing.cachedInputPerM / 1_000_000)
      : 0;
  const outputCostUSD = usage.completionTokens * (pricing.outputPerM / 1_000_000);
  const totalCostUSD = inputCostUSD + cachedInputCostUSD + outputCostUSD;

  return {
    inputCostUSD: round(inputCostUSD),
    cachedInputCostUSD: round(cachedInputCostUSD),
    outputCostUSD: round(outputCostUSD),
    totalCostUSD: round(totalCostUSD),
  };
}

function round(n: number): number {
  return Math.round(n * 1_000_000) / 1_000_000;
}

// ─── Load / Save JSON Log ─────────────────────────────────────────────────────

function loadUsageLog(): UsageEntry[] {
  if (!fs.existsSync(USAGE_JSON_PATH)) return [];
  try {
    return JSON.parse(fs.readFileSync(USAGE_JSON_PATH, "utf-8")) as UsageEntry[];
  } catch {
    return [];
  }
}

function saveUsageLog(entries: UsageEntry[]): void {
  const dir = path.dirname(USAGE_JSON_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(USAGE_JSON_PATH, JSON.stringify(entries, null, 2), "utf-8");
}

// ─── Render Markdown ──────────────────────────────────────────────────────────

function renderUsageMd(entries: UsageEntry[]): string {
  const header = [
    "# OpenAI API Usage Log",
    "",
    "> Auto-generated. Do not edit manually.",
    "> Pricing based on `docs/pricing.md`.",
    "",
    "---",
    "",
    "## Call History",
    "",
    "| # | Timestamp | Task | Logical Model | API Model | Prompt Tokens | Cached Tokens | Completion Tokens | Total Tokens | Cost (USD) |",
    "|---|-----------|------|---------------|-----------|---------------|---------------|-------------------|--------------|------------|",
  ];

  const rows = entries.map((e, i) => {
    const ts = e.timestamp.replace("T", " ").replace(/\.\d+Z$/, " UTC");
    return (
      `| ${i + 1} ` +
      `| ${ts} ` +
      `| ${e.taskType} ` +
      `| ${e.logicalModel} ` +
      `| ${e.apiModel} ` +
      `| ${e.usage.promptTokens.toLocaleString()} ` +
      `| ${e.usage.cachedTokens.toLocaleString()} ` +
      `| ${e.usage.completionTokens.toLocaleString()} ` +
      `| ${e.usage.totalTokens.toLocaleString()} ` +
      `| $${e.cost.totalCostUSD.toFixed(6)} |`
    );
  });

  // Totals
  const totals = entries.reduce(
    (acc, e) => ({
      promptTokens: acc.promptTokens + e.usage.promptTokens,
      cachedTokens: acc.cachedTokens + e.usage.cachedTokens,
      completionTokens: acc.completionTokens + e.usage.completionTokens,
      totalTokens: acc.totalTokens + e.usage.totalTokens,
      inputCostUSD: acc.inputCostUSD + e.cost.inputCostUSD,
      cachedInputCostUSD: acc.cachedInputCostUSD + e.cost.cachedInputCostUSD,
      outputCostUSD: acc.outputCostUSD + e.cost.outputCostUSD,
      totalCostUSD: acc.totalCostUSD + e.cost.totalCostUSD,
    }),
    {
      promptTokens: 0,
      cachedTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      inputCostUSD: 0,
      cachedInputCostUSD: 0,
      outputCostUSD: 0,
      totalCostUSD: 0,
    }
  );

  const summary = [
    "",
    "---",
    "",
    "## Totals",
    "",
    `| Metric | Value |`,
    `|--------|-------|`,
    `| Total API calls | ${entries.length} |`,
    `| Total prompt tokens | ${totals.promptTokens.toLocaleString()} |`,
    `| Total cached tokens | ${totals.cachedTokens.toLocaleString()} |`,
    `| Total completion tokens | ${totals.completionTokens.toLocaleString()} |`,
    `| **Total tokens** | **${totals.totalTokens.toLocaleString()}** |`,
    `| Input cost | $${totals.inputCostUSD.toFixed(6)} |`,
    `| Cached input cost | $${totals.cachedInputCostUSD.toFixed(6)} |`,
    `| Output cost | $${totals.outputCostUSD.toFixed(6)} |`,
    `| **Total cost** | **$${totals.totalCostUSD.toFixed(6)}** |`,
    "",
    "---",
    "",
    "## Cost by Model",
    "",
  ];

  // Per-model breakdown
  const byModel: Record<string, typeof totals> = {};
  for (const e of entries) {
    if (!byModel[e.logicalModel]) {
      byModel[e.logicalModel] = {
        promptTokens: 0, cachedTokens: 0, completionTokens: 0, totalTokens: 0,
        inputCostUSD: 0, cachedInputCostUSD: 0, outputCostUSD: 0, totalCostUSD: 0,
      };
    }
    const m = byModel[e.logicalModel];
    m.promptTokens += e.usage.promptTokens;
    m.cachedTokens += e.usage.cachedTokens;
    m.completionTokens += e.usage.completionTokens;
    m.totalTokens += e.usage.totalTokens;
    m.inputCostUSD += e.cost.inputCostUSD;
    m.cachedInputCostUSD += e.cost.cachedInputCostUSD;
    m.outputCostUSD += e.cost.outputCostUSD;
    m.totalCostUSD += e.cost.totalCostUSD;
  }

  const modelRows = [
    "| Logical Model | Calls | Total Tokens | Input Cost | Cached Cost | Output Cost | Total Cost |",
    "|---------------|-------|--------------|------------|-------------|-------------|------------|",
    ...Object.entries(byModel).map(([model, m]) => {
      const calls = entries.filter((e) => e.logicalModel === model).length;
      return (
        `| ${model} | ${calls} | ${m.totalTokens.toLocaleString()} ` +
        `| $${m.inputCostUSD.toFixed(6)} | $${m.cachedInputCostUSD.toFixed(6)} ` +
        `| $${m.outputCostUSD.toFixed(6)} | $${m.totalCostUSD.toFixed(6)} |`
      );
    }),
  ];

  return [...header, ...rows, ...summary, ...modelRows, ""].join("\n");
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function logUsage(
  taskType: TaskType,
  apiModel: string,
  usage: TokenUsage
): UsageEntry {
  const logicalModel = TASK_TO_LOGICAL_MODEL[taskType] ?? apiModel;
  const cost = calculateCost(logicalModel, usage);

  const entry: UsageEntry = {
    timestamp: new Date().toISOString(),
    taskType,
    logicalModel,
    apiModel,
    usage,
    cost,
  };

  const entries = loadUsageLog();
  entries.push(entry);
  saveUsageLog(entries);
  fs.writeFileSync(USAGE_MD_PATH, renderUsageMd(entries), "utf-8");

  console.log(
    `  [UsageLogger] ${taskType} | ${logicalModel} | ` +
      `${entry.usage.totalTokens} tokens | $${cost.totalCostUSD.toFixed(6)}`
  );

  return entry;
}
