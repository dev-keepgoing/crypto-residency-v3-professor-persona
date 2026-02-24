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

# Homework: Integers, Divisibility, and Prime vs Composite (75 min)

**Allowed languages:** Python or TypeScript  
**Allowed resources:** today’s lesson + your own notes  
**Disallowed:** copying published solutions; using an LLM to write the solution  
**Submission:** Markdown with LaTeX; code in fenced blocks.

## Objective Mapping
- **P1 → O1**
- **P2 → O2**
- **P3 → O3**
- **P4 → O4**
- **P5 → O5**

---

## P1 (20 pts) — Divisibility closure via existential witnesses (derivation)
Let \(a,b,c\in\mathbb Z\). Assume \(a\mid b\) and \(a\mid c\).

1. Prove \(a\mid (b+c)\) and \(a\mid (b-c)\) using only the definition  
   \[
   a\mid x \iff \exists k\in\mathbb Z\ \text{s.t.}\ x=ak.
   \]
2. State explicitly what the “witness” integers are for each divisibility claim.

**Complete answer:** a proof that introduces witnesses \(k,\ell\in\mathbb Z\) for \(b,c\), constructs witnesses for \(b\pm c\), and concludes divisibility.

---

## P2 (20 pts) — Prime vs composite vs coprime: prove/disprove statements (derivation)
For each statement below, either **prove** it or give a **counterexample** (with justification).

A. If \(p\) is prime and \(p\mid ab\), then \(p\mid a\) or \(p\mid b\).  
B. If \(\gcd(a,b)=1\), then \(a\) and \(b\) are both prime.  
C. If \(n>1\) is composite, then \(n\) has a prime divisor.

**Complete answer:** for each item, clearly label “Proof” or “Counterexample,” and include the minimal argument showing correctness (not just a numeric example without explanation).

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
**Required structure:** show that the set of common divisors of \((a,b)\) equals the set of common divisors of \((b,r)\) by proving both inclusions.

---

## P4 (20 pts) — Implement gcd with normalization and edge cases (implementation)
Implement `normalizeInt(x)` and `gcd(a,b)`.

Requirements:
- `normalizeInt(x)` returns an integer (in your language) and may assume input is already an integer type; document behavior for negative values (e.g., return `abs(x)` or return `x` unchanged—your choice, but be consistent).
- `gcd(a,b)` must return a **nonnegative** integer and satisfy \(\gcd(a,b)=\gcd(|a|,|b|)\).
- Handle edge cases:
  - If \((a,b)=(0,0)\): choose and document a convention (often return \(0\)).
  - If one input is \(0\): return \(|\text{other}|\).
- Use Euclid’s algorithm (iterative or recursive).

**Complete answer:** code + a short test table of at least 6 cases including negatives and zeros, with expected outputs.

---

## P5 (20 pts) — Attack: prime vs coprime confusion in modular protocols (attack-analysis)
A protocol designer says: “Choose a **prime** modulus \(n\), so every nonzero element has an inverse mod \(n\).” An attacker exploits confusion between “prime” and “coprime” to slip a non-invertible element into the protocol.

1. Give a concrete example with a **composite** modulus \(n\) where a nonzero \(x\) has **no** inverse mod \(n\). Prove non-invertibility using \(\gcd(x,n)\neq 1\).
2. Explain (2–4 sentences) the exact confusion: “prime modulus” vs “element coprime to modulus.”
3. State a precise validation rule the protocol should enforce to prevent this (in terms of \(\gcd\)).

**Complete answer:** one explicit \((n,x)\), a gcd-based argument, and a clear mitigation rule.