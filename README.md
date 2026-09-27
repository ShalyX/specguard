# SpecGuard

AI code review gets dangerous when a plausible concern becomes a confident merge blocker without proving which requirement was violated.

SpecGuard gives IBM Bob a stricter review workflow. Every requirement receives a visible status, every blocker must carry source and execution evidence, and unclear product intent returns to a human as a decision instead of being reported as a bug.

[Open the live preview](https://specguard-kswzr9n7f-shalyxs-projects.vercel.app)

## What is in this repository

- [`specguard/`](specguard/) contains the product, Bob skill, validator, tests, and web interface.
- [`outputs/specguard-evaluation/`](outputs/specguard-evaluation/) contains the paired evaluation fixtures, Bob outputs, probes, receipts, oracle, and scorecard.
- [`specguard/bob_sessions/`](specguard/bob_sessions/) is reserved for the Bob task-summary screenshots required by the hackathon.

## Evidence so far

We ran three synthetic review cases through ordinary Bob review and the structured SpecGuard workflow. The baseline made the correct case disposition once out of three and produced three unsupported blockers. SpecGuard made all three dispositions correctly and produced no unsupported blockers.

That result is exploratory. It comes from one run per condition on small fixtures. We retain the limitation because SpecGuard is built around bounded claims.

## Local verification

```bash
cd specguard
npm test
npm run build
npm run dev
```

The application runs at `http://127.0.0.1:4173`.
