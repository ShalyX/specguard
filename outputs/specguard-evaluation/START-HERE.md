# SpecGuard evaluation — six-run comparison complete

This is a small exploratory evaluation, not a completed product or a statistically validated claim. All source fixtures were authored by Codex and contain synthetic records. Bob completed all six paired review sessions. See [EVALUATION-RESULTS.md](EVALUATION-RESULTS.md) for the results and decision.

## Run order

1. Install [Bob IDE for Windows](https://bob.ibm.com/docs/ide/getting-started/install). Sign in with your IBMid and select the hackathon Enterprise account (`ibm-hackathon-lablab`, 40 Bobcoins initially). Verify the account in Bob before spending credits.
2. Open **only one arm folder** under `review-cases`, never this root or `facilitator`. Each folder contains a standalone Node 24 TypeScript fixture, original source under `baseline`, proposed source under `src`, acceptance criteria, tests, a PowerShell capture script, and its prompt. No npm install is needed. Record checks with `./capture.ps1` or `./capture.ps1 probes/name.test.mjs` in the PowerShell terminal.
3. Use a fresh Bob session for each run, the same model and settings, and Agent mode so tests can execute. Paste that folder's `REVIEW-PROMPT.txt`. Do not give Bob the facilitator answer key or prior run outputs.
4. Suggested order: R17 baseline; R42 structured; R68 baseline; R17 structured; R42 baseline; R68 structured. This alternates arms and separates matching cases, but is only one exploratory run per arm, not a randomized study.
5. Cap each run at 10 minutes or 4 observed Bobcoins, whichever comes first. Six runs have a planned maximum of 24 coins, leaving room for reruns. This is a manual stop rule, not an API-enforced cap; check usage, and do not continue automatically beyond the allocation. If usage cannot be observed, use the time cap and mark coins unavailable.
6. Save review outputs, probes, execution receipts, and actual Bob task-summary screenshots. A fresh output directory means not run; do not fill it with example findings.
7. Open `review-viewer.html` and load the structured review JSON plus its run receipt JSON files. The viewer is a local format prototype; it never executes tests, attests signatures, or claims to call Bob.
8. Use `facilitator/scorecard.csv` and `facilitator/answer-key.md` for assessment. Record false positives and omissions as well as successes.

## What we are comparing

Both arms receive identical implementation, requirements, existing tests, tools, and budget. The baseline asks Bob for its normal actionable review. The structured arm asks for requirement-linked implementation evidence, checks, unresolved decisions, and explicit unassessed scope. The added structure is the intervention, not extra repository access or a hidden answer key.

This first experiment isolates the value of the structured workflow and small evidence viewer. It does not evaluate a deployed GitHub integration, an autonomous MCP pipeline, multi-agent orchestration, or a large-PR product. Raw Bob output quality and viewer usability must be recorded separately.

## Preregistered decision rule

Continue to one realistic PR only if the structured arm correctly handles all three cases, has no unsupported high-severity findings, and provides accurate source/test links without additional facilitator repair. If the baseline achieves the same result with similar effort, the workflow has not demonstrated an advantage. If either arm hits the cap, record an incomplete run rather than interpreting it as a clean review.

For a human usability check, ask a reviewer to state the defect, unresolved decision, and evidence needed for approval. Measure time to a correct answer and number of navigation steps. Do not show the same case's answer key first. A second reviewer should see reversed arm assignments; with only one reviewer, treat times as informal observations affected by learning. A 20% faster median decision time with no lost correctness is a provisional continuation target, not a statistically supported outcome. Fewer output words or clicks alone do not prove lower cognitive load.

With no human reviewer, report only correctness, unsupported assertions, traceability, execution time, and usage. Mark cognitive-load and reviewer-time benefit **unmeasured**. These tiny fixtures cannot validate performance on 800-line PRs.

## Local validation

From this folder: `node --test --test-isolation=none facilitator/validate.mjs`.

The facilitator validation runs all 24 existing tests across six folders and checks the intended fixture behavior separately. The seeded defect is expected to fail a workspace-isolation assertion while existing tests remain green. Passing fixture validation means the experiment is correctly constructed, not that Bob or SpecGuard detected anything.

Execution receipts contain command, exit code, source/test hashes, timestamp, and Node version. They are locally generated records, not cryptographic attestations. An unavailable receipt means an execution claim is not substantiated here. Reference the source hash when evaluating later changes.

## Current status

- Fixture implementation and paired inputs: complete.
- Local fixture validation: see `facilitator/validation.tap` and `oracle-results.json`.
- Six Bob review sessions: complete.
- Scorecard: complete; Bobcoin usage and human-reviewer measures remain unavailable.
- Decision: iterate on schema reliability, then test one realistic pull request.

Official sources: [Bob installation](https://bob.ibm.com/docs/ide/getting-started/install), [custom modes](https://bob.ibm.com/docs/ide/configuration/custom-modes), [hackathon guide](https://lablab-ibm-bob-2-hackathon-guide.s3.us.cloud-object-storage.appdomain.cloud/index.html).

