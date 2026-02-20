import OpenAI from "openai";
import axios from "axios";

// ─── Result Types ─────────────────────────────────────────────────────────────

export interface ServiceCheckResult {
  service: string;
  ok: boolean;
  message: string;
  latencyMs?: number;
}

export interface PreflightReport {
  allOk: boolean;
  results: ServiceCheckResult[];
}

// ─── OpenAI Health Check ──────────────────────────────────────────────────────
// Uses GET /models — the lightest authenticated endpoint. Consumes zero tokens.

async function checkOpenAI(): Promise<ServiceCheckResult> {
  const service = "OpenAI";
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return {
      service,
      ok: false,
      message: "OPENAI_API_KEY is not set in environment.",
    };
  }

  const start = Date.now();
  try {
    const client = new OpenAI({ apiKey });
    const modelList = await client.models.list();

    // Confirm at least one model is accessible
    const models = modelList.data ?? [];
    if (models.length === 0) {
      return {
        service,
        ok: false,
        message: "API key authenticated but no models returned.",
        latencyMs: Date.now() - start,
      };
    }

    return {
      service,
      ok: true,
      message: `Authenticated. ${models.length} model(s) accessible.`,
      latencyMs: Date.now() - start,
    };
  } catch (err) {
    const raw = err instanceof Error ? err : new Error(String(err));
    return {
      service,
      ok: false,
      message: classifyOpenAIError(raw),
      latencyMs: Date.now() - start,
    };
  }
}

function classifyOpenAIError(err: Error): string {
  const msg = err.message.toLowerCase();
  if (msg.includes("401") || msg.includes("invalid api key") || msg.includes("incorrect api key")) {
    return "Authentication failed — OPENAI_API_KEY is invalid or revoked.";
  }
  if (msg.includes("429")) {
    return "Rate limit exceeded — the account has hit its API quota.";
  }
  if (msg.includes("econnrefused") || msg.includes("enotfound") || msg.includes("network")) {
    return "Network error — cannot reach api.openai.com. Check your internet connection.";
  }
  if (msg.includes("timeout")) {
    return "Request timed out — OpenAI API did not respond in time.";
  }
  return `Unexpected error: ${err.message}`;
}

// ─── GitHub Health Check ──────────────────────────────────────────────────────
// Checks two things:
//   1. GET /repos/{owner}/{repo}    → PAT is valid + repo exists
//   2. GET /repos/{owner}/{repo}/git/refs/heads/main → main branch exists

async function checkGitHub(): Promise<ServiceCheckResult> {
  const service = "GitHub";
  const pat = process.env.GITHUB_PAT;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;

  if (!pat) {
    return { service, ok: false, message: "GITHUB_PAT is not set in environment." };
  }
  if (!owner) {
    return { service, ok: false, message: "GITHUB_OWNER is not set in environment." };
  }
  if (!repo) {
    return { service, ok: false, message: "GITHUB_REPO is not set in environment." };
  }

  const headers = {
    Authorization: `Bearer ${pat}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  const start = Date.now();

  // Step 1: repo access
  try {
    await axios.get(`https://api.github.com/repos/${owner}/${repo}`, { headers });
  } catch (err) {
    return {
      service,
      ok: false,
      message: classifyGitHubError(err, `GET /repos/${owner}/${repo}`),
      latencyMs: Date.now() - start,
    };
  }

  // Step 2: main branch ref
  try {
    await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/main`,
      { headers }
    );

    return {
      service,
      ok: true,
      message: `Authenticated. Repo "${owner}/${repo}" accessible. Branch "main" exists.`,
      latencyMs: Date.now() - start,
    };
  } catch (err) {
    return {
      service,
      ok: false,
      message: classifyGitHubError(err, `GET /repos/${owner}/${repo}/git/refs/heads/main`),
      latencyMs: Date.now() - start,
    };
  }
}

function classifyGitHubError(err: unknown, endpoint: string): string {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status;
    const ghMessage = err.response?.data?.message as string | undefined;

    if (status === 401) {
      return "Authentication failed — GITHUB_PAT is invalid or expired. Verify the token has 'repo' scope.";
    }
    if (status === 403) {
      return `Forbidden (${endpoint}) — PAT lacks the required 'repo' permissions.`;
    }
    if (status === 404) {
      if (endpoint.includes("refs/heads/main")) {
        return (
          `Branch "main" not found in repo. ` +
          `The repository must have at least one commit on the main branch before committing.`
        );
      }
      return (
        `Repository not found (${endpoint}). ` +
        `Check GITHUB_OWNER and GITHUB_REPO, and confirm the repo exists.`
      );
    }
    if (status === 422 && ghMessage?.includes("Git Repository is empty")) {
      return (
        `Repository "${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}" exists but is empty. ` +
        `Push an initial commit to create the "main" branch.`
      );
    }
    if (!err.response) {
      return "Network error — cannot reach api.github.com. Check your internet connection.";
    }
    return `GitHub API error ${status ?? "unknown"}: ${ghMessage ?? err.message}`;
  }

  const raw = err instanceof Error ? err : new Error(String(err));
  return `Unexpected error: ${raw.message}`;
}

// ─── Run All Checks ───────────────────────────────────────────────────────────

export async function runPreflight(): Promise<PreflightReport> {
  console.log("[Preflight] Checking service connectivity...\n");

  // Run both checks in parallel
  const [openaiResult, githubResult] = await Promise.all([
    checkOpenAI(),
    checkGitHub(),
  ]);

  const results = [openaiResult, githubResult];
  const allOk = results.every((r) => r.ok);

  // Print summary table
  for (const r of results) {
    const icon = r.ok ? "✓" : "✗";
    const latency = r.latencyMs !== undefined ? ` (${r.latencyMs}ms)` : "";
    console.log(`  [${icon}] ${r.service.padEnd(8)} ${r.message}${latency}`);
  }

  console.log("");

  return { allOk, results };
}

// ─── Abort Helper ─────────────────────────────────────────────────────────────

export function assertPreflight(report: PreflightReport): void {
  if (report.allOk) return;

  const failures = report.results
    .filter((r) => !r.ok)
    .map((r) => `  • ${r.service}: ${r.message}`)
    .join("\n");

  throw new Error(
    `Preflight checks failed. Resolve the following before running:\n\n${failures}\n`
  );
}
