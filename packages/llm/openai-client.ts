import OpenAI from "openai";
import { OpenAICallParams } from "../core/types";
import { logUsage } from "../core/usage-logger";

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

let clientInstance: OpenAI | null = null;

function getClient(): OpenAI {
  if (!clientInstance) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not set in environment.");
    }
    clientInstance = new OpenAI({ apiKey });
  }
  return clientInstance;
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function callOpenAI(params: OpenAICallParams): Promise<string> {
  const { model, systemPrompt, userPrompt, temperature, maxTokens = 4096, taskType } = params;
  const client = getClient();

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`  [OpenAI] model=${model} attempt=${attempt}/${MAX_RETRIES}`);

      const response = await client.chat.completions.create({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature,
        max_tokens: maxTokens,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("OpenAI returned empty content.");
      }

      // ── Log token usage ────────────────────────────────────────────────────
      if (taskType && response.usage) {
        const cachedTokens =
          (response.usage as unknown as { prompt_tokens_details?: { cached_tokens?: number } })
            .prompt_tokens_details?.cached_tokens ?? 0;

        logUsage(taskType, model, {
          promptTokens: response.usage.prompt_tokens,
          cachedTokens,
          completionTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens,
        });
      }

      return content.trim();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.error(`  [OpenAI] Error on attempt ${attempt}: ${lastError.message}`);

      if (attempt < MAX_RETRIES) {
        const delay = RETRY_DELAY_MS * attempt;
        console.log(`  [OpenAI] Retrying in ${delay}ms...`);
        await sleep(delay);
      }
    }
  }

  throw new Error(`OpenAI call failed after ${MAX_RETRIES} attempts: ${lastError?.message}`);
}
