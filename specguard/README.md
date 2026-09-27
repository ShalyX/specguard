# SpecGuard

SpecGuard turns IBM Bob review output into an evidence-backed merge decision. It keeps three outcomes separate: a requirement is supported, contradicted, or needs a human product decision.

## Why it exists

AI review tools often report plausible concerns without showing which written requirement they violate. In our six-run Bob evaluation, the baseline review made the correct case disposition once out of three and issued three unsupported blockers. The SpecGuard protocol made all three dispositions correctly and issued no unsupported blockers.

## Product flow

1. The project-level Bob skill reads the requirements and proposed code.
2. Bob creates a requirement ledger and runs focused probes.
3. Execution receipts preserve the command, result, and source hashes.
4. The deterministic contract layer normalizes and validates Bob's JSON.
5. The dashboard presents one merge disposition, its evidence, and any question only a human can answer.

The bundled demo uses the actual structured outputs and receipts from R17, R42, and R68. R17 is merge-ready, R42 contains a reproduced workspace-isolation defect, and R68 requires a product decision about pagination.

## Run locally

Requirements: Node.js 22 or newer.

```bash
npm test
npm run build
npm run dev
```

Open `http://127.0.0.1:4173`.

## Use the Bob skill

Open this repository in IBM Bob IDE. The reusable workflow lives at `.bob/skills/specguard-review/SKILL.md`. Ask Bob to use `specguard-review` for the current change. Bob writes `review-results/review.json`; validate and normalize it with:

```bash
node specguard-validate.mjs path/to/review-results/review.json normalized-review.json
```

The web app also accepts a Bob review JSON through **Import Bob review**. Imported reviews are marked as lacking receipts until their captured executions are available.

## Trust model

- Bob proposes findings and requirement statuses.
- SpecGuard validates the output contract and evidence paths.
- A passing receipt supports only the command and scope it records.
- Ambiguous intent remains a human decision.
- “Supported” is bounded by cited checks; it is not a global safety claim.

## Evidence

The complete paired evaluation is in `../outputs/specguard-evaluation`. Its scorecard, fixture oracle, prompts, Bob reviews, probes, and execution receipts are retained for inspection.

## Current scope

This hackathon prototype imports local JSON and uses synthetic review fixtures. It does not claim cryptographic attestation, autonomous GitHub integration, or validation on large pull requests. Bobcoin usage and human reviewer-time improvements were not measured.
