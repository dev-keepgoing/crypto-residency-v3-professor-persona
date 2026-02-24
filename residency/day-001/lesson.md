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

# Day 001 — Divisibility, Primes vs Coprime, and `gcd`

## Why we care (crypto connection)
In cryptography you constantly work “mod n” (remainders). You can only “divide by `a` mod `n`” if `a` has an inverse mod `n`, and that happens **exactly when** `gcd(a, n) = 1`. If you confuse *prime* with *coprime*, you can accept a value that is not invertible and either break correctness (wrong results) or open an attack surface (forced failures / bypasses).

## Learning goals
- State the definition of `a | b` using an explicit “there exists an integer k” statement.
- Explain the difference between **prime**, **composite**, and **coprime** (and give examples).
- Prove a basic closure property of divisibility using only the definition.
- Compute `gcd(a, b)` using Euclid’s algorithm.
- Implement `normalizeInt(x)` and `gcd(a, b)` with correct sign/zero behavior.

## Core ideas (plain English)
1. `a | b` means “`b` is a whole-number multiple of `a`”.
2. “Prime vs composite” describes **one** integer; “coprime” describes a **pair** of integers.
3. `gcd(a, b)` is the “largest shared divisor”, and `gcd(a, n) = 1` is the test for invertibility mod `n`.
4. Euclid’s algorithm finds a gcd quickly by repeatedly replacing a pair `(a, b)` with `(b, a mod b)`.

## Definitions (precise but readable)
- Integers `ℤ`: `{..., -2, -1, 0, 1, 2, ...}`.
- Divides (`a | b`): for integers `a, b` with `a ≠ 0`, `a | b` means `∃k ∈ ℤ` such that `b = a*k`.
- Prime (`p`): an integer `p > 1` whose only positive divisors are `1` and `p`.
- Composite (`n`): an integer `n > 1` that is not prime (equivalently, `n = a*b` for some integers `a, b` with `1 < a < n` and `1 < b < n`).
- Greatest common divisor (`gcd(a, b)`): the greatest positive integer `d` such that `d | a` and `d | b`.
- Coprime: integers `a, b` are coprime if `gcd(a, b) = 1`.

## Proof skill
### Proposition
If `a | b` and `a | c`, then `a | (b + c)` and `a | (b - c)`.

### Proof (showing the ∃k steps)
1. Assume `a | b`. By definition, `∃k ∈ ℤ` such that `b = a*k`.
2. Assume `a | c`. By definition, `∃ℓ ∈ ℤ` such that `c = a*ℓ`.
3. Consider `b + c`. Substitute the equalities from (1) and (2):
   - `b + c = a*k + a*ℓ = a*(k + ℓ)`.
   - Since `k + ℓ ∈ ℤ`, by definition `a | (b + c)`.
4. Consider `b - c`. Substitute again:
   - `b - c = a*k - a*ℓ = a*(k - ℓ)`.
   - Since `k - ℓ ∈ ℤ`, by definition `a | (b - c)`.

## Computing / Algorithm (Euclid’s gcd)
Euclid’s algorithm is fast because it replaces a hard problem (“what divides both `a` and `b`?”) with a smaller one using remainders. Intuitively: any number that divides both `a` and `b` also divides `a - q*b`, and `a - q*b` is exactly the remainder `a mod b`.

**Invariant step:** for `b ≠ 0`, `gcd(a, b) = gcd(b, a mod b)`.

**Why it works (intuition):** the set of common divisors of `(a, b)` is the same as the set of common divisors of `(b, a mod b)`, so the *greatest* common divisor is the same.

**Reference pseudocode**
```text
normalizeInt(x):
  if x < 0: return -x
  else: return x

gcd(a, b):
  a = normalizeInt(a)
  b = normalizeInt(b)

  if a == 0 and b == 0:
    return 0  # convention; document it

  while b != 0:
    (a, b) = (b, a mod b)

  return a
```

## Implementation lab
Implement these two functions:
- `normalizeInt(x)`
- `gcd(a, b)`

**Required behavior (edge cases):**
- Accept negative inputs.
- Return a nonnegative result.
- Define `gcd(0, 0)` explicitly (use `0` as a convention unless your codebase requires otherwise).
- Ensure `gcd(a, b) = gcd(|a|, |b|)` by normalizing inputs first.

**Quick tests (must pass):**
- `gcd(54, 24) = 6`
- `gcd(-54, 24) = 6`
- `gcd(0, 7) = 7` and `gcd(7, 0) = 7`
- `gcd(0, 0) = 0` (by convention)

## Security pitfall
**Common mistake:** “If `a` is coprime to `n`, then `n` must be prime.”

**Correct rule:** `a` has an inverse mod `n` **iff** `gcd(a, n) = 1` (this says nothing about whether `n` is prime).

Concrete counterexample: `gcd(2, 15) = 1`, but `15` is composite.

## Mastery checklist (target ≥ 80%)
- [ ] I can state the definitions of `a | b`, prime, composite, gcd, and coprime.
- [ ] I can give an example of two numbers that are coprime even though neither is prime (e.g., `8` and `15`).
- [ ] I can prove: `a|b` and `a|c` ⇒ `a|(b±c)` without skipping the `∃k` step.
- [ ] I can compute `gcd(a, b)` by hand using Euclid’s algorithm.
- [ ] I can implement `normalizeInt(x)` and `gcd(a, b)` that handle negatives and zeros correctly.
- [ ] I can explain why “coprime ⇒ n is prime” is false and produce a counterexample.
