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
A lot of cryptography works “mod n” (remainders). A key fact is:

> A number `a` has a multiplicative inverse mod `n` **iff** `gcd(a, n) = 1`.

So if we confuse **prime** with **coprime**, we can accidentally accept values that *don’t have inverses*, breaking protocols.

## Learning goals
By the end, you can:
- State what **“a divides b”** means using an exact definition.
- Explain **prime vs composite vs coprime** (they are different ideas).
- Compute `gcd(a, b)` using **Euclid’s algorithm**.
- Implement `normalizeInt(x)` and `gcd(a, b)` with correct edge-case behavior.

## Core ideas (plain English)
### 1) Divisibility is an “exists a multiple” statement
“`a` divides `b`” means “`b` is some integer multiple of `a`”.

### 2) Prime/composite describe one number; coprime describes two numbers
- **Prime**: a number with no nontrivial factorization.
- **Composite**: a number that *does* factor nontrivially.
- **Coprime**: a *pair* of numbers that share no factor > 1.

### 3) `gcd` tells you when inverses exist mod `n`
If `gcd(a, n) = 1`, then `a` is invertible mod `n`. If `gcd(a, n) ≠ 1`, then it isn’t.

## Definitions (precise but readable)
We work with integers: `ℤ = {..., -2, -1, 0, 1, 2, ...}`.

- **Divides**: for integers `a, b` with `a ≠ 0`, `a | b` means: there exists an integer `k` such that `b = a*k`.
- **Prime**: an integer `p > 1` whose only positive divisors are `1` and `p`.
- **Composite**: an integer `n > 1` that is not prime (so `n = a*b` with `1 < a < n` and `1 < b < n`).
- **Greatest common divisor**: `gcd(a, b)` is the greatest **positive** integer `d` such that `d | a` and `d | b`.
- **Coprime**: integers `a, b` are coprime if `gcd(a, b) = 1`.

## Proof skill: a tiny “closure” fact about divisibility
### Proposition
If `a | b` and `a | c`, then `a | (b + c)` and `a | (b - c)`.

### Proof (no skipped steps)
- `a | b` means: there exists an integer `k` with `b = a*k`.
- `a | c` means: there exists an integer `ℓ` with `c = a*ℓ`.
- Add: `b + c = a*k + a*ℓ = a*(k + ℓ)`. Since `k + ℓ` is an integer, `a | (b + c)`.
- Subtract: `b - c = a*k - a*ℓ = a*(k - ℓ)`. Since `k - ℓ` is an integer, `a | (b - c)`.

### Useful corollary
If `a | b`, then `a | (t*b)` for any integer `t`.

## Computing `gcd`: Euclid’s algorithm
### The idea (one sentence)
`gcd(a, b)` doesn’t change if you replace `a` by the remainder when dividing `a` by `b`.

### Key step (the invariant)
For `b ≠ 0`: `gcd(a, b) = gcd(b, a mod b)`.

## Implementation lab
You will implement:
- `normalizeInt(x)` → returns `|x|` (the nonnegative magnitude)
- `gcd(a, b)` → nonnegative gcd, handles negatives and zeros, defines `gcd(0,0)`

### Required behavior
- Accept any integers, including negative numbers.
- Always return a **nonnegative** gcd.
- Define and document what you do for `gcd(0,0)` (common convention: return `0`).

### Reference pseudocode
```text
normalizeInt(x):
  if x < 0: return -x
  else: return x

gcd(a, b):
  a = normalizeInt(a)
  b = normalizeInt(b)

  if a == 0 and b == 0:
    return 0  # convention; document it
  if b == 0:
    return a

  while b != 0:
    (a, b) = (b, a mod b)
  return a
```

### Quick tests (must pass)
- `gcd(54, 24) = 6`
- `gcd(-54, 24) = 6`
- `gcd(0, 7) = 7` and `gcd(7, 0) = 7`
- `gcd(0, 0) = 0` (by convention)

## Security pitfall (prime vs coprime confusion)
Correct rule:

> `a` has an inverse mod `n` **iff** `gcd(a, n) = 1`.

Common mistake:

> “If some `a` is coprime to `n`, then `n` must be prime.”

That’s false: composite numbers can still have many values coprime to them.

## Mastery checklist (target ≥ 80%)
You can:
- State definitions: divides, prime, composite, gcd, coprime.
- Explain prime vs coprime clearly (one is about one number, the other about a pair).
- Prove: `a|b` and `a|c` ⇒ `a|(b±c)` using the “there exists k” definition.
- Compute gcd using Euclid and verify it divides both numbers.
- Implement `gcd(a,b)` robustly (negatives, zeros, and `gcd(0,0)` documented).
- Spot and correct the prime-vs-coprime logical error in a protocol argument.
