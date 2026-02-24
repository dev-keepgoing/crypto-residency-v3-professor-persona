```json
{
  "problems": [
    {"id": "P1", "type": "derivation", "points": 20, "title": "Divisibility closure via existential witnesses"},
    {"id": "P2", "type": "derivation", "points": 20, "title": "Prime vs composite vs coprime: prove/disprove statements"},
    {"id": "P3", "type": "derivation", "points": 20, "title": "Euclid step: why gcd(a,b)=gcd(b,a mod b)"},
    {"id": "P4", "type": "implementation", "points": 20, "title": "Implement gcd with normalization and edge cases"},
    {"id": "P5", "type": "attack-analysis", "points": 20, "title": "Attack: prime vs coprime confusion in modular protocols"}
  ]
}
```

# Day 001 — Homework: Integers, Divisibility, and Prime vs Composite (75 min)

## Rules
- **Allowed languages:** Python or TypeScript
- **Allowed resources:** today’s lesson + your own notes
- **Disallowed:** copying published solutions; using an LLM to write the solution
- **Submission format:** Markdown (LaTeX allowed); put code in fenced code blocks

## Objective mapping
- **P1 → O1** (divisibility definition + witnesses)
- **P2 → O2** (prime vs composite vs coprime reasoning)
- **P3 → O3** (Euclid invariant proof structure)
- **P4 → O4** (robust gcd implementation)
- **P5 → O5** (security pitfall + mitigation)

---

## P1 (20 pts) — Divisibility closure via existential witnesses (derivation)
Let \(a,b,c\in\mathbb Z\). Assume \(a\mid b\) and \(a\mid c\).

**Goal:** practice using the definition of divisibility as an “exists a witness” statement.

Use only this definition:
\[
a\mid x \iff \exists k\in\mathbb Z\ \text{s.t.}\ x=ak.
\]

**Task:** Prove \(a\mid (b+c)\) and \(a\mid (b-c)\). State the witness integers explicitly.

**Complete answer checklist:**
- Introduce witnesses \(k,\ell\in\mathbb Z\) such that \(b=ak\) and \(c=a\ell\).
- Build explicit witnesses for \(b+c\) and \(b-c\) (you should end up with expressions involving \(k\pm \ell\)).
- Conclude \(a\mid(b+c)\) and \(a\mid(b-c)\) by pointing back to the definition.

---

## P2 (20 pts) — Prime vs composite vs coprime: prove/disprove statements (derivation)
For each statement below, either **prove** it or give a **counterexample** (with justification). Be explicit about which one you are doing.

A. If \(p\) is prime and \(p\mid ab\), then \(p\mid a\) or \(p\mid b\).  
B. If \(\gcd(a,b)=1\), then \(a\) and \(b\) are both prime.  
C. If \(n>1\) is composite, then \(n\) has a prime divisor.

**Complete answer checklist (for each of A/B/C):**
- Label your response as **Proof** or **Counterexample**.
- If **Proof**: give a short argument that establishes the statement for all allowed values.
- If **Counterexample**: provide specific values, then explain clearly why they satisfy the assumptions but violate the conclusion.

---

## P3 (20 pts) — Euclid step: why \(\gcd(a,b)=\gcd(b,a\bmod b)\) (derivation)
Let \(a,b\in\mathbb Z\) with \(b\neq 0\). Write the division algorithm:
\[
a = qb + r,\quad 0\le r < |b|,\quad r = a \bmod b.
\]
Prove:
\[
\gcd(a,b)=\gcd(b,r).
\]

**Required structure:** prove both directions by showing the sets of common divisors are the same.
- If \(d\mid a\) and \(d\mid b\), show \(d\mid r\).
- If \(d\mid b\) and \(d\mid r\), show \(d\mid a\).
- Conclude the greatest positive common divisor is the same.

---

## P4 (20 pts) — Implement gcd with normalization and edge cases (implementation)
Implement `normalizeInt(x)` and `gcd(a,b)`.

**Requirements:**
- `normalizeInt(x)` returns an integer (in your language). You may assume the input is already an integer type.
  - Document what you do for negative values (e.g., return `abs(x)` or return `x` unchanged). Pick one and be consistent.
- `gcd(a,b)` must return a **nonnegative** integer and satisfy \(\gcd(a,b)=\gcd(|a|,|b|)\).
- Handle edge cases:
  - If \((a,b)=(0,0)\): choose and document a convention (often return \(0\)).
  - If one input is \(0\): return \(|\text{other}|\).
- Use Euclid’s algorithm (iterative or recursive).

**Complete answer checklist:**
- Code for `normalizeInt` and `gcd` in Python or TypeScript.
- A test table of **at least 6** cases, including negatives and zeros, with expected outputs.

---

## P5 (20 pts) — Attack: prime vs coprime confusion in modular protocols (attack-analysis)
A protocol designer says: “Choose a **prime** modulus \(n\), so every nonzero element has an inverse mod \(n\).” An attacker exploits confusion between “prime” and “coprime” to slip a non-invertible element into the protocol.

1. Give a concrete example with a **composite** modulus \(n\) where a nonzero \(x\) has **no** inverse mod \(n\). Prove non-invertibility using \(\gcd(x,n)\neq 1\).
2. Explain (2–4 sentences) the exact confusion: “prime modulus” vs “element coprime to modulus.”
3. State a precise validation rule the protocol should enforce to prevent this (in terms of \(\gcd\)).

**Complete answer checklist:**
- One explicit pair \((n,x)\) with \(n\) composite, \(x\neq 0\), and \(\gcd(x,n)\neq 1\).
- A short gcd-based argument showing \(x\) is not invertible mod \(n\).
- A 2–4 sentence explanation of the exact confusion.
- A precise mitigation rule stated using \(\gcd(\cdot,\cdot)\).
