```json
{
  "problems": [
    {"id": "P1", "type": "derivation", "points": 20, "title": "Characteristic of a finite field"},
    {"id": "P2", "type": "derivation", "points": 20, "title": "Prime subfield and field size"},
    {"id": "P3", "type": "derivation", "points": 20, "title": "Why Z/nZ fails when n is composite"},
    {"id": "P4", "type": "implementation", "points": 20, "title": "Implement and test arithmetic mod p"},
    {"id": "P5", "type": "attack-analysis", "points": 20, "title": "Composite-modulus “field” assumption attack"}
  ]
}
```

# Homework: Finite Fields — Definitions & Axioms (90 minutes)

**Allowed resources:** generated lesson, your notes.  
**Disallowed:** copying published solutions; using an LLM to write the solution.  
**Languages (P4):** Python or TypeScript.  
**Submission:** Markdown with LaTeX; code in fenced blocks.

## Problems

### P1 (Derivation, 20 pts): Characteristic of a finite field
Let \(F\) be a finite field with multiplicative identity \(1\). Define \(\mathrm{char}(F)\) as the least positive integer \(m\) such that \(m\cdot 1=0\).

1. Prove \(\mathrm{char}(F)\neq 0\) (i.e., such an \(m\) exists).
2. Prove \(\mathrm{char}(F)=p\) is prime.

**Complete answer:** a logically complete proof using only field axioms and finiteness; explicitly show why composite \(m\) contradicts “no zero divisors” in a field.

---

### P2 (Derivation, 20 pts): Prime subfield and field size
Let \(F\) be a finite field and let \(p=\mathrm{char}(F)\).

1. Define the map \(\varphi:\mathbb{Z}\to F\) by \(\varphi(k)=k\cdot 1\). Prove \(\ker(\varphi)=p\mathbb{Z}\) and conclude the image is isomorphic to \(\mathrm{GF}(p)\) (the **prime subfield**).
2. Prove \(F\) is a finite-dimensional vector space over \(\mathrm{GF}(p)\).
3. Conclude \(|F|=p^n\) for some integer \(n\ge 1\).

**Complete answer:** must state the vector space structure (scalar multiplication) and justify finiteness of dimension; final cardinality argument must be explicit.

---

### P3 (Derivation, 20 pts): Why \(\mathbb{Z}/n\mathbb{Z}\) fails when \(n\) is composite
Assume \(n\) is composite. Prove \(\mathbb{Z}/n\mathbb{Z}\) is **not** a field by exhibiting nonzero zero divisors and concluding some nonzero element has no multiplicative inverse.

**Complete answer:** must provide explicit nonzero classes \(\bar a,\bar b\neq \bar 0\) with \(\bar a\bar b=\bar 0\), and a short argument why that prevents inverses.

---

### P4 (Implementation, 20 pts): Implement and test arithmetic mod \(p\)
Implement the following APIs:

- `mod_add(a,b,p)`
- `mod_mul(a,b,p)`
- `mod_inv(a,p)` (must error/return `None` on \(a\equiv 0\pmod p\))
- `is_field_mod_p(p)` (returns true iff \(\mathbb{Z}/p\mathbb{Z}\) is a field)

**Requirements:**
- `mod_inv` must succeed for all \(a\in\{1,\dots,p-1\}\) when `p` is prime.
- Include tests showing:
  1. For a prime \(p\), every nonzero element has an inverse.
  2. For a composite \(p\), `is_field_mod_p(p)` is false and at least one nonzero element lacks an inverse.
  3. Inverse of \(0\) is handled per edge case.

---

### P5 (Attack-analysis, 20 pts): Composite-modulus “field” assumption attack
A developer assumes arithmetic mod \(n\) (composite) forms a field and uses `mod_inv` inside a cryptographic proof/verification step.

1. Explain precisely what goes wrong when inverses are assumed to exist (connect to zero divisors / non-invertible nonzero elements).
2. Give a concrete example with a small composite \(n\) showing a step that “cancels” a factor illegitimately (i.e., \(ax=ay\) but \(x\neq y\) due to non-invertible \(a\)).
3. State one robust mitigation (e.g., enforce prime modulus via `is_field_mod_p`, or work in a known field \(\mathrm{GF}(p^n)\)).

**Complete answer:** must include an explicit numeric example and a clear statement of the invalid inference.

---

## Objective Mapping
- **P1 → O1, O2**
- **P2 → O1, O3**
- **P3 → O2, O4**
- **P4 → O4, O5**
- **P5 → O4, O5**