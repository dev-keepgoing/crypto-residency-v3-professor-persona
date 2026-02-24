```markdown
# Grading Rubric (specRef: residency/specs/day-001)

**Total:** 100 points  
**Passing:** score ≥ **80** **AND** meet all **dimension minimums** (below).

## Problem Rubric (100 pts)

| Problem | Pts | Full credit | Partial credit | Zero credit |
|---|---:|---|---|---|
| **P1 (derivation): Characteristic of a finite field** | 20 | Correctly proves characteristic is prime; clear use of additive order/field axioms; no logical gaps. | Correct main claim but missing justification steps, unclear structure, or minor algebraic errors not affecting conclusion. | Incorrect claim (e.g., characteristic composite) or argument relies on false statements/circular reasoning. |
| **P2 (derivation): Prime subfield and field size** | 20 | Correctly identifies prime subfield ≅ 𝔽_p; shows field is vector space over 𝔽_p; concludes \|F\| = p^n with coherent reasoning. | Gets p^n form but incomplete vector-space argument, unclear definition of subfield, or minor mistakes. | Fails to relate to prime subfield or gives wrong size characterization. |
| **P3 (derivation): Why ℤ/nℤ fails when n is composite** | 20 | Correctly explains zero divisors/non-invertible nonzero elements when n composite; ties to field axioms; includes a valid example or general proof. | Mentions zero divisors or invertibility but argument is incomplete, example-only without generalization, or minor errors. | Claims ℤ/nℤ is a field for composite n, or provides no valid reason. |
| **P4 (implementation): Implement and test arithmetic mod p** | 20 | Correct modular add/sub/mul/inv (when defined) for prime p; handles normalization; includes meaningful tests incl. edge cases (0, p−1) and inverse checks. | Core ops mostly correct but missing edge cases/tests, occasional bugs, or inverse handling incomplete. | Incorrect arithmetic, missing key operations, or no credible tests. |
| **P5 (attack-analysis): Composite-modulus “field” assumption attack** | 20 | Clearly describes how assuming a field mod composite breaks security/correctness; provides concrete adversarial strategy (e.g., exploiting zero divisors/non-invertibility) and mitigations (prime checks, safe parameter validation). | Identifies issue and some consequences but attack or mitigations are vague/incomplete. | No real attack reasoning, or claims no risk from composite modulus. |

## Dimension Mapping & Minimums (Mastery Gate)

| Dimension | Min | Counts from problems |
|---|---:|---|
| **D1 Mathematical correctness & rigor (45)** | **27** | P1 (20) + P2 (20) + **5** from P3 (rigor component) |
| **D2 Implementation correctness & edge cases (30)** | **18** | P4 (20) + **10** from P3 (edge-case reasoning) |
| **D3 Adversarial analysis & mitigations (25)** | **15** | P5 (20) + **5** from P3 (security implications) |

### Mastery Gate Rule
To pass: **Total ≥ 80** **AND** **D1 ≥ 27, D2 ≥ 18, D3 ≥ 15**.
```