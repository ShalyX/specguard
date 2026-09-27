# SpecGuard

## Short description

SpecGuard turns IBM Bob review output into an evidence-backed merge decision. It makes Bob connect every finding to a written requirement, preserve test evidence, and send ambiguous intent back to a human instead of inventing the answer.

## The problem

An AI reviewer can sound certain even when the requirement is unclear. That creates a specific kind of review noise: clean changes get blocked by speculative risks, observations are presented as defects, and product decisions hide inside technical comments.

The result is more review work, not less. A developer still has to work out which comments matter, what was actually tested, and whether the reviewer assumed behavior that nobody requested.

## What SpecGuard does

SpecGuard adds a decision layer to Bob's review workflow.

For each written requirement, it records one of four states:

- supported by the cited implementation and checks;
- contradicted by specific source or reproduced behavior;
- needs a human decision because the intent is ambiguous;
- unassessed because the available evidence is insufficient.

A blocking finding must identify the requirement it contradicts. Test runs are stored as receipts. Source references are normalized and validated before the result reaches the dashboard.

## How we used IBM Bob

Bob performed the reviews, inspected the implementation, designed focused probes, executed the tests, and produced the requirement ledger. We packaged the workflow as a reusable project skill at `.bob/skills/specguard-review/SKILL.md` so it can be applied consistently to another change.

SpecGuard then validates Bob's structured output and presents it as a merge brief. The interface separates verified blockers from unresolved product decisions and supported requirements.

## The demo

The app includes the actual outputs from three paired Bob review cases:

1. R17 is a correct implementation. The ordinary review incorrectly requested changes. SpecGuard approved it.
2. R42 contains a workspace data leak. Both workflows found it. SpecGuard ties the failure directly to the workspace-isolation requirement and captured probe.
3. R68 has deliberately ambiguous pagination intent. The ordinary review declared one interpretation correct and blocked the change. SpecGuard proved the current behavior and asked the product owner to choose the intended behavior.

The R68 interaction is the core demo. Code can prove what the system does. SpecGuard makes the point where a human must decide what it should do impossible to miss.

## Evidence

Across the six exploratory Bob sessions:

- ordinary review made 1 of 3 correct case dispositions;
- SpecGuard made 3 of 3 correct case dispositions;
- ordinary review produced 3 unsupported high-severity findings;
- SpecGuard produced 0 unsupported high-severity findings;
- all six runs retained execution receipts.

The evaluation uses small synthetic fixtures and one run per condition. It does not establish performance on large pull requests or measure human review-time savings yet. The full fixtures, prompts, outputs, receipts, answer key, and scorecard are included in the repository.

## Technology

- IBM Bob IDE and a reusable Bob project skill
- Node.js contract validation and build pipeline
- Vanilla JavaScript interface with no runtime framework dependency
- Vercel preview deployment

## Live prototype

https://specguard-kswzr9n7f-shalyxs-projects.vercel.app

## Next step

Run the same paired workflow on a medium-sized real pull request, then measure whether a reviewer reaches the correct merge decision faster with SpecGuard's evidence ledger.
