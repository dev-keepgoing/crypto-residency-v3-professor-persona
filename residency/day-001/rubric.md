## Grading Rubric (specRef: `residency/specs/day-001`) — Total 100 pts

**Passing threshold:** score ≥ **80** **AND** no dimension below its minimum:  
- **D1** ≥ 30/50, **D2** ≥ 18/30, **D3** ≥ 12/20

### Point Allocation by Problem (maps to dimensions)
| Problem | Title | Type | Points | Dimension |
|---|---|---:|---:|---|
| P1 | Divisibility closure via existential witnesses | derivation | 20 | D1 |
| P2 | Prime vs composite vs coprime: prove/disprove statements | derivation | 20 | D1 |
| P3 | Euclid step: why gcd(a,b)=gcd(b,a mod b) | derivation | 20 | D1 |
| P4 | Implement gcd with normalization and edge cases | implementation | 20 | D2 |
| P5 | Attack: prime vs coprime confusion in modular protocols | attack-analysis | 20 | D3 |

---

## Per-Problem Criteria

### P1 (20 pts, D1)
- **Full (18–20):** Correct use of existential witnesses; closure argument is valid, complete, and clearly structured.
- **Partial (8–17):** Right idea but missing/incorrect witness construction, unclear quantifiers, or gaps in algebraic steps.
- **Zero (0–7):** Incorrect claim, circular reasoning, or no meaningful witness-based proof.

### P2 (20 pts, D1)
- **Full (18–20):** Correctly proves true statements and provides valid counterexamples for false ones; definitions (prime/composite/coprime) used precisely.
- **Partial (8–17):** Mixes definitions, incomplete counterexample, or proof works only for a subset of cases.
- **Zero (0–7):** Major definitional confusion; no valid proof/counterexample.

### P3 (20 pts, D1)
- **Full (18–20):** Correct Euclidean argument showing both directions (divisor sets or linear combination reasoning); handles modulo remainder properly.
- **Partial (8–17):** States theorem with limited justification; one direction missing; remainder/mod notation errors.
- **Zero (0–7):** Incorrect equality or reasoning unrelated to Euclid’s step.

### P4 (20 pts, D2)
- **Full (18–20):** Correct gcd implementation; normalizes signs; handles edge cases (0 inputs, equal inputs); terminates; returns nonnegative gcd.
- **Partial (8–17):** Works on typical cases but fails on some edge cases, sign normalization, or has minor termination/logic issues.
- **Zero (0–7):** Incorrect outputs broadly, crashes, or non-terminating.

### P5 (20 pts, D3)
- **Full (18–20):** Clearly identifies prime-vs-coprime confusion; explains exploit conditions, impact, and mitigation; reasoning is adversarial and concrete.
- **Partial (8–17):** Identifies issue but attack path/conditions vague; mitigation incomplete.
- **Zero (0–7):** No real adversarial analysis or incorrect security claim.

---

## Mastery Gate (must satisfy all)
- **D1:** ≥ 30/50 (P1–P3 combined)  
- **D2:** ≥ 18/30 (P4)  
- **D3:** ≥ 12/20 (P5)