---
name: specguard-review
description: Review a code change against written requirements, reproduce material behavior, and produce an evidence-backed merge decision without inventing product intent.
---

# SpecGuard review

Use this skill when the user asks to review a change, assess merge readiness, validate a pull request, or compare implementation behavior with acceptance criteria.

## Workflow

1. Identify the written requirements from the issue, task, or requirement document. Treat them as the source of product intent.
2. Create one ledger entry per requirement. Never omit a requirement silently.
3. Cite the implementation with repository-relative, one-based line references.
4. Run the existing checks. Add a focused probe when a material behavior is not established. Do not change production source during review.
5. Attach only execution receipts that exist. A claimed run without a receipt is unverified.
6. Use exactly one status per requirement:
   - `supported`: the cited implementation and checks support the requirement, limited to the evidence shown;
   - `contradicted`: specific source or reproduced behavior conflicts with the requirement;
   - `needs-decision`: the implementation is understood but the written intent does not select one correct behavior;
   - `unassessed`: the available context or checks do not establish the result.
7. A blocking finding must name the requirement it contradicts. Keep test gaps and observations separate from current defects.
8. When intent is ambiguous, ask one concrete human question. Do not convert ambiguity into a defect.
9. Write `review-results/review.json` using `output-schema.md`.
10. Run `node specguard-validate.mjs review-results/review.json` when the validator is available. Repair format errors once without changing the substantive verdict.

Stop when every requirement has a status, every blocking claim has evidence, and unresolved intent is visible to the reviewer.
