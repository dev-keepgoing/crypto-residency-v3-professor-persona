/**
 * OpenAI client: single callOpenAI() that sends system/user prompts, uses max_completion_tokens,
 * retries on transient errors (not on empty content), and logs token usage after each response.
 */
import OpenAI from "openai";
import { OpenAICallParams } from "../core/types";
import { logUsage } from "../core/usage";

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

/** Extract plain text from API content (string or array of content parts). */
function extractTextContent(
  content: string | unknown[] | null | undefined
): string {
  if (content == null) return "";
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";

  const parts: string[] = [];
  for (const part of content) {
    if (part && typeof part === "object" && "text" in part && typeof (part as { text: unknown }).text === "string") {
      parts.push((part as { text: string }).text);
    }
  }
  return parts.join("");
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
        max_completion_tokens: maxTokens,
      });

      // ── Log token usage whenever the API returns it (even if content is empty) ─
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

      const rawContent = response.choices[0]?.message?.content;
      const content = extractTextContent(rawContent);

      if (!content || content.length === 0) {
        const choice = response.choices[0];
        const finishReason = choice?.finish_reason ?? "unknown";
        const logPayload = choice
          ? JSON.stringify({ finish_reason: finishReason, message_role: choice.message?.role })
          : "no choice";
        throw new Error(
          `OpenAI returned empty content. finish_reason=${finishReason} choice=${logPayload}`
        );
      }

      return content.trim();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.error(`  [OpenAI] Error on attempt ${attempt}: ${lastError.message}`);

      // Do not retry on empty content — same prompt would likely fail again; avoid 3x cost
      if (lastError.message.includes("OpenAI returned empty content")) {
        throw lastError;
      }

      if (attempt < MAX_RETRIES) {
        const delay = RETRY_DELAY_MS * attempt;
        console.log(`  [OpenAI] Retrying in ${delay}ms...`);
        await sleep(delay);
      }
    }
  }

  throw new Error(`OpenAI call failed after ${MAX_RETRIES} attempts: ${lastError?.message}`);
}
