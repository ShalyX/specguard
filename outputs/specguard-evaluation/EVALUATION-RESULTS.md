# SpecGuard exploratory evaluation

Date: 2026-09-27  
System reviewed: IBM Bob  
Design: three paired synthetic code-review cases, one baseline prompt and one structured SpecGuard prompt per case

## Decision

**Iterate once, then test on one realistic pull request. Do not yet treat SpecGuard as validated or submission-ready.**

The structured workflow improved review judgment on all three fixtures. It correctly approved a clean change, blocked a real workspace-isolation defect, and retained an ambiguous pagination requirement for human decision. The baseline review was correct only on the obvious defect case.

The preregistered continuation rule was not fully met. Two of three structured runs wrote `codeReferences` as objects instead of the required strings, so the evidence viewer rejected those outputs without facilitator repair. The third structured run followed the schema. This is a product reliability issue, not a review-accuracy issue.

## Results

| Case | Expected | Baseline | Structured |
|---|---|---|---|
| R17 | Approve clean implementation | Incorrect request-changes verdict; one unsupported blocker | Correct approval |
| R42 | Block workspace data leak | Correct block | Correct block |
| R68 | Ask for product decision on pagination | Incorrectly declared a defect; two unsupported blockers | Correct `needs-decision` outcome |

| Measure | Baseline | Structured |
|---|---:|---:|
| Correct case dispositions | 1/3 | 3/3 |
| Unsupported high-severity findings | 3 | 0 |
| Missed seeded requirements | 0 | 0 |
| Execution receipts present | 3/3 | 3/3 |
| Viewer-compatible structured output | N/A | 1/3 |
| Mean recorded execution time | 109 s | 239 s |
| Bobcoin usage | unavailable | unavailable |

The time comparison is descriptive only. R68 structured spent several minutes designing and running its probe, while session startup and human interaction were not instrumented consistently.

## What the experiment supports

The strongest observed value is **decision discipline**. Requiring a status for each acceptance criterion and providing a separate `needs-decision` state stopped Bob from converting unclear intent into a confident defect. It also prevented speculative future risks from blocking the clean R17 change.

The evidence workflow also produced useful traceability. Every structured run linked requirements to source locations and captured executions. On R42, both arms found the obvious defect, so this experiment does not show that SpecGuard detects simple bugs better than Bob alone.

## What remains unproven

- Human review time and cognitive load were not measured.
- Bobcoin usage was not visible.
- The fixtures are tiny and cannot support claims about large pull requests.
- There was one run per condition, so model variance is unknown.
- The structured prompt increased mean elapsed time in this sample.
- Output-schema reliability failed in two runs.
- The local viewer has not been tested with real reviewers or real repository data.

## Next experiment

Before using a realistic pull request, add deterministic schema validation with one automatic repair attempt. The validator should reject wrong field types, missing requirement IDs, nonexistent evidence files, and invalid source references. Keep the original model output and repaired output separately so failures remain visible.

Then run one medium-sized real pull request with:

1. acceptance criteria from the issue or PR description;
2. a baseline Bob review and a SpecGuard review in fresh sessions;
3. blinded scoring by defect correctness, unsupported blockers, and traceability;
4. one human reviewer answering: what blocks merge, what needs a product decision, and what evidence supports each conclusion;
5. recorded review time, navigation steps, and Bobcoin use.

Proceed to a hackathon product build only if the real-PR run preserves correctness and the evidence view helps a reviewer reach the right decision faster.

## Product implication

A winning version should be presented as a **review decision layer for Bob**, not another AI code reviewer. Its core interaction is a merge brief with three explicit buckets:

- verified blockers;
- product decisions required;
- requirements supported by captured evidence.

The demo should show the same ambiguous change reviewed twice. A normal review confidently blocks it; SpecGuard asks the one question the code cannot answer. Then the reviewer resolves that question and the merge brief updates. That is the clearest proof of differentiated value from this experiment.

## Collision assessment

Collision is **high** for the broad "AI code reviewer" concept. Bob already includes a review workflow, and the hackathon guide itself lists an intelligent code-review coach as an example use case. Established products also cover much of the obvious feature set: [Greptile](https://www.greptile.com/) positions itself as a validation layer that reviews and tests pull requests with repository context; [Qodo](https://www.qodo.ai/) connects review to rules, business requirements, and SDLC governance; and [CodeRabbit](https://coderabbit.app/) provides automated AI code review in developer workflows.

The defensible wedge is narrower: **requirement-grounded adjudication of review claims**. SpecGuard should make Bob prove which written requirement a blocker contradicts, preserve ambiguous intent as a human decision, and attach reproducible execution evidence. The experiment directly supports that wedge: the baseline invented blockers in R17 and R68, while the structured workflow made the correct decision in both.

This aligns well with the official challenge, which asks for a working Bob-centered prototype that improves a specific multi-step developer workflow and demonstrates reduced errors or rework. It will still look generic if the submission leads with bug detection, generated tests, or review summaries. Lead with preventing false merge blocks and silent interpretation of ambiguous requirements.

