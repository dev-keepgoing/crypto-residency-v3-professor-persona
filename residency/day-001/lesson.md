```json
{
  "keyPoints": [
    "Divisibility is an existential statement: a|b ⇔ ∃k∈ℤ with b=ak; use it to prove closure properties.",
    "Prime vs composite is about nontrivial factorization; coprime is about gcd=1 (not the same as prime).",
    "gcd can be computed efficiently via Euclid’s algorithm with careful normalization and edge cases."
  ],
  "definitions": [
    "a divides b (a|b): ∃k∈ℤ such that b=ak",
    "prime p: integer p>1 whose only positive divisors are 1 and p",
    "composite n: integer n>1 that is not prime",
    "gcd(a,b): greatest positive integer d such that d|a and d|b"
  ],
  "coreDerivations": [
    "From a|b and a|c, write b=ak and c=aℓ, then b±c=a(k±ℓ), hence a|(b±c).",
    "Euclid step: gcd(a,b)=gcd(b, a mod b) by showing common divisors are preserved."
  ],
  "labAPIs": [
    "gcd(a, b)",
    "normalizeInt(x)"
  ],
  "edgeCases": [
    "gcd(0,0) is undefined by the usual definition; choose a convention (often 0) and document it",
    "handle negative inputs: gcd should be nonnegative; gcd(a,b)=gcd(|a|,|b|)"
  ],
  "attackScenario": "An attacker exploits confusion between “prime” and “coprime” to slip a non-invertible element into a modular arithmetic protocol."
}
```

## Formal Explanation

### Core objects and notation (O1)
- **Integers**: ℤ = {..., −2, −1, 0, 1, 2, ...}.
- **Divisibility**: for integers \(a,b\), with \(a\neq 0\),
  - \(a \mid b \iff \exists k\in\mathbb{Z}\) such that \(b = ak\).
- **Prime**: integer \(p>1\) with exactly two positive divisors: 1 and \(p\).
- **Composite**: integer \(n>1\) that is not prime (i.e., \(n=ab\) with \(1<a<n\), \(1<b<n\)).
- **Coprime**: integers \(a,b\) are coprime if \(\gcd(a,b)=1\). (They need not be prime.)
- **gcd intuition**: \(\gcd(a,b)\) is the “largest shared divisor”; it controls invertibility mod \(n\): \(a\) has an inverse mod \(n\) iff \(\gcd(a,n)=1\).

### Computation goals (O3)
- **Prime factorization**: write \(n>1\) as \(n=\prod p_i^{e_i}\).
- **gcd from factorization**: if
  - \(a=\prod p^{\alpha_p}\), \(b=\prod p^{\beta_p}\),
  - then \(\gcd(a,b)=\prod p^{\min(\alpha_p,\beta_p)}\).

---

## Derivation

### Divisibility closure (O2)
Proposition: If \(a\mid b\) and \(a\mid c\), then \(a\mid (b+c)\) and \(a\mid (b-c)\).

- Assume \(a\mid b\). Then \(\exists k\in\mathbb{Z}\) with \(b=ak\).
- Assume \(a\mid c\). Then \(\exists \ell\in\mathbb{Z}\) with \(c=a\ell\).
- Add:
  - \(b+c = ak + a\ell = a(k+\ell)\).
  - Since \(k+\ell\in\mathbb{Z}\), by definition \(a\mid (b+c)\).
- Subtract:
  - \(b-c = ak - a\ell = a(k-\ell)\).
  - Since \(k-\ell\in\mathbb{Z}\), by definition \(a\mid (b-c)\).

Corollary (useful): If \(a\mid b\), then \(a\mid tb\) for any \(t\in\mathbb{Z}\).
- \(b=ak \Rightarrow tb = a(tk)\), and \(tk\in\mathbb{Z}\).

### Euclid’s algorithm invariant (O4 core idea)
Claim: For integers \(a,b\) with \(b\neq 0\),
\[
\gcd(a,b)=\gcd(b, a\bmod b).
\]

- Let \(r = a \bmod b\). Then by division algorithm: \(a = qb + r\) for some \(q\in\mathbb{Z}\), with \(0\le r<|b|\).
- If \(d\mid a\) and \(d\mid b\), then \(d\mid (a-qb)=r\). So any common divisor of \((a,b)\) is a common divisor of \((b,r)\).
- If \(d\mid b\) and \(d\mid r\), then \(d\mid (qb+r)=a\). So any common divisor of \((b,r)\) is a common divisor of \((a,b)\).
- Therefore the sets of common divisors match, hence the greatest positive one matches.

---

## Implementation Lab

### Task (O4): Implement `gcd(a,b)` with normalization and edge cases
Requirements:
- Accept any integers (including negatives).
- Return a **nonnegative** gcd.
- Define behavior for \(\gcd(0,0)\) explicitly.

#### Reference pseudocode
```text
normalizeInt(x):
  if x < 0: return -x
  else: return x

gcd(a, b):
  a = normalizeInt(a)
  b = normalizeInt(b)

  if a == 0 and b == 0:
    return 0   # convention; document it
  if b == 0:
    return a

  while b != 0:
    (a, b) = (b, a mod b)
  return a
```

#### Quick tests (must pass)
- `gcd(54, 24) = 6`
- `gcd(-54, 24) = 6`
- `gcd(0, 7) = 7`, `gcd(7, 0) = 7`
- `gcd(0, 0) = 0` (by chosen convention)

### Math exercises (O3) — 3 problems
1) **Factorization + reconstruction**  
   Compute the prime factorization of \(840\). Then multiply factors to reconstruct \(840\).

2) **gcd via factorization**  
   Let \(a=360\), \(b=840\). Compute \(\gcd(a,b)\) using prime factorizations and the \(\min\) exponent rule. Sanity-check by verifying the gcd divides both.

3) **Divisibility proof drill**  
   Prove: if \(a\mid b\) and \(b\mid c\), then \(a\mid c\). (Use only the definition \(x\mid y \iff \exists k: y=xk\).)

---

## Adversarial Thinking Challenge

### Scenario (O5) — 1 challenge
A protocol designer says: “Pick a **prime** number \(p\). Then any nonzero \(a<p\) is **coprime** to \(p\), so it has an inverse mod \(p\). Therefore, if \(a\) is coprime to \(n\), \(n\) must be prime.”

- Identify the logical error precisely.
- Provide a counterexample where \(a\) is coprime to \(n\) but \(n\) is composite.
- Explain the safe rule you should use instead (state it in one sentence).

Pitfalls to watch:
- Confusing “\(n\) is prime” with “some \(a\) is coprime to \(n\)”.
- Assuming “coprime” implies “prime”.

---

## Mastery Requirements

To pass (target ≥ 80%):
- **Concept (O1)**: Correctly state definitions of \(a\mid b\), prime, composite, gcd, coprime; distinguish prime vs coprime.
- **Derivation (O2)**: Produce a complete, step-by-step proof of the closure property \(a\mid b, a\mid c \Rightarrow a\mid (b\pm c)\) (no skipped existential steps).
- **Computation (O3)**: Correct prime factorization for given integers; compute gcd and verify by division/reconstruction.
- **Implementation (O4)**: Working `gcd(a,b)` with normalization; handles negatives, zeros, and documents \(\gcd(0,0)\).
- **Adversarial (O5)**: Clearly articulate the prime-vs-coprime pitfall and give a valid counterexample and corrected rule.