# OpenAI Pricing Reference

> Last updated: 2026-02-20
> Source: OpenAI pricing page
> Used by: `packages/core/usage-logger.ts` for cost calculation

---

## GPT-5.2

> The best model for coding and agentic tasks across industries.
> Used for: `lesson` generation, `grading` evaluation.

| Token Type     | Price per 1M tokens |
|----------------|---------------------|
| Input          | $1.750              |
| Cached Input   | $0.175              |
| Output         | $14.000             |

---

## GPT-5.2 Pro

> The smartest and most precise model.
> Reserved for: capstone evaluation only.

| Token Type     | Price per 1M tokens |
|----------------|---------------------|
| Input          | $21.00              |
| Cached Input   | —                   |
| Output         | $168.00             |

---

## GPT-5 Mini

> A faster, cheaper version of GPT-5 for well-defined tasks.
> Used for: `summary` generation, `orchestration` text.

| Token Type     | Price per 1M tokens |
|----------------|---------------------|
| Input          | $0.250              |
| Cached Input   | $0.025              |
| Output         | $2.000              |

---

## Task → Model Routing

| Task Type      | Logical Model  | Notes                          |
|----------------|----------------|--------------------------------|
| `lesson`       | gpt-5.2        | Primary reasoning              |
| `grading`      | gpt-5.2        | Primary reasoning              |
| `summary`      | gpt-5-mini     | Lightweight orchestration      |
| `orchestration`| gpt-5-mini     | Lightweight orchestration      |
| `capstone`     | gpt-5.2-pro    | Reserved, not yet implemented  |

---

## Cost Formula

```
inputCost       = (promptTokens - cachedTokens) * (inputPricePerM / 1_000_000)
cachedInputCost = cachedTokens                  * (cachedPricePerM / 1_000_000)
outputCost      = completionTokens              * (outputPricePerM / 1_000_000)
totalCost       = inputCost + cachedInputCost + outputCost
```
