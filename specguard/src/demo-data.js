export const demoCases = [
  {
    "id": "R17",
    "title": "Clean export",
    "subtitle": "All requirements supported",
    "baseline": "Incorrectly blocked",
    "path": "outputs/specguard-evaluation/review-cases/R17/structured",
    "disposition": "ready",
    "review": {
      "caseId": "R17",
      "commit": "synthetic-snapshot",
      "requirements": [
        {
          "id": "R1",
          "requirement": "Export only records belonging to the active workspace.",
          "source": "REQUIREMENTS.md:5",
          "status": "supported",
          "codeReferences": [
            "src/orders.ts:8"
          ],
          "evidenceFiles": [
            "review-results/run-b8a7db82474e401eae08093293d0483a.json"
          ],
          "observation": "The filter in exportOrders (src/orders.ts:8) exactly mirrors the workspace-scope guard already present in listOrders (src/orders.ts:4). The test 'CSV contains matching rows and header' supplies two orders belonging to workspace 'a' with different statuses and one status filter; the returned CSV contains only one row, confirming cross-workspace leakage is absent for that fixture. No explicit cross-workspace isolation test exists (e.g. two orders from different workspaces), but the filter logic is straightforward and the structural argument is strong.",
          "humanQuestion": null
        },
        {
          "id": "R2",
          "requirement": "Respect the selected status filter. Export every matching record across all pages, regardless of the current page offset or limit.",
          "source": "REQUIREMENTS.md:6",
          "status": "supported",
          "codeReferences": [
            "src/orders.ts:7-10"
          ],
          "evidenceFiles": [
            "review-results/run-b8a7db82474e401eae08093293d0483a.json",
            "review-results/run-57f543d4aa83436fb5485393949a14dd.json"
          ],
          "observation": "exportOrders (src/orders.ts:7-10) applies only the workspace+status filter and then serialises all results. It never calls slice() and never reads query.offset or query.limit, so pagination constraints from the screen are correctly discarded. The status-filter path is exercised by the existing test 'CSV contains matching rows and header'. The existing tests do not pass offset/limit in the query object; probe probes/r2-pagination-ignored.test.mjs was added and executed — both tests pass (offset=2/limit=1 yielded all 3 matching rows), confirming the all-pages requirement is met.",
          "humanQuestion": null
        },
        {
          "id": "R3",
          "requirement": "Empty exports contain the header row.",
          "source": "REQUIREMENTS.md:7",
          "status": "supported",
          "codeReferences": [
            "src/orders.ts:11-13"
          ],
          "evidenceFiles": [
            "review-results/run-b8a7db82474e401eae08093293d0483a.json"
          ],
          "observation": "serialize() (src/orders.ts:11-13) uses ['id,status,total', ...rows.map(...)].join('\\n'). When rows is empty the spread contributes nothing, so the result is exactly 'id,status,total'. The test 'empty export retains header' asserts this directly and passes.",
          "humanQuestion": null
        },
        {
          "id": "R4",
          "requirement": "Quote CSV values and escape embedded quotation marks.",
          "source": "REQUIREMENTS.md:8",
          "status": "supported",
          "codeReferences": [
            "src/orders.ts:12"
          ],
          "evidenceFiles": [
            "review-results/run-b8a7db82474e401eae08093293d0483a.json"
          ],
          "observation": "serialize() maps each field with: '\"' + String(v).replaceAll('\"', '\"\"') + '\"'. This produces RFC-4180-compatible quoting: all values are quoted and any embedded double-quote is doubled. The test 'CSV escapes quotes and commas' uses id 'a,\"b' and expects '\"a,\"\"b\"' — it passes. Note that total (a number) is passed through String() then quoted as a string; this is consistent with the requirement as written (requirements explicitly state totals are supplied by trusted upstream code and no formula processing is required).",
          "humanQuestion": null
        }
      ],
      "findings": [
        {
          "id": "F1",
          "requirement": "R2",
          "title": "R2 pagination-bypass not covered by existing test suite",
          "severity": "low",
          "evidence": "review-results/run-b8a7db82474e401eae08093293d0483a.json",
          "observation": "The existing test 'CSV contains matching rows and header' (test/orders.test.mjs:6) calls exportOrders with a Query that omits offset and limit entirely. The requirement explicitly mandates that offset/limit are ignored; the implementation is correct but this property was not verified by the shipped tests. Probe probes/r2-pagination-ignored.test.mjs was written and confirms the behavior (review-results/run-57f543d4aa83436fb5485393949a14dd.json, exitCode 0).",
          "requirementId": "R2"
        }
      ],
      "unassessed": [
        {
          "id": "U1",
          "note": "No test asserts that orders from a different workspaceId are excluded while orders from the target workspace are present in the same input array (cross-workspace isolation). The existing tests use either a single-workspace fixture or an empty array. The filter logic is straightforward and the risk is low, but the gap exists.",
          "requirement": "R1"
        },
        {
          "id": "U2",
          "note": "The workspaceId column is not included in the CSV output. This is consistent with the field list in serialize() (id, status, total) and is not contradicted by any requirement, but the requirements do not explicitly enumerate which columns to export. Noted as an out-of-scope omission rather than a defect.",
          "requirement": "R1"
        }
      ],
      "recommendation": "Approve with low-severity note. All four stated requirements are structurally met and executable evidence confirms R2, R3, and R4 directly. R1 is structurally sound but lacks a cross-workspace isolation test. Consider adding a test that mixes records from two workspaces to make R1 regression-proof. The missing pagination probe for R2 has been added under probes/.",
      "assumptions": [
        "The 'commit' field is 'synthetic-snapshot' because no git remote is present; capture.ps1 hard-codes this value.",
        "No bobcoin usage tracking is available in this environment; the time cap was the operative constraint.",
        "The review covers only the TypeScript source and the test file as directed; no build step was required because node --test loaded the .ts file directly via Node 24's native TypeScript strip-types support."
      ],
      "omittedScope": [
        "No review of build, bundling, or integration with the order-list screen — only the exported functions are in scope.",
        "No security review of CSV injection; requirements explicitly exclude formula/spreadsheet processing.",
        "No performance or scalability assessment of loading all orders into memory for export."
      ]
    },
    "receipts": {
      "run-b8a7db82474e401eae08093293d0483a.json": {
        "capturedAt": "2026-09-27T06:41:29.1689941Z",
        "commit": "synthetic-snapshot",
        "node": "v24.14.0",
        "command": [
          "node",
          "--test",
          "--test-isolation=none",
          "test/orders.test.mjs"
        ],
        "exitCode": 0,
        "elapsedMilliseconds": 356,
        "sourceHash": "A9F586BF52847E36F84C37ED7E840874706550A4845AF0B178D5CDC9970DA663",
        "testHash": "E426386CD9106C9F4F1B033FDE243682DF822649BD276A4F266EC14B14F805FC",
        "requirementsHash": "8FA334D8285188A277DF679B612B8B9C62BEE424B3922FEE4D2CEE810531293D",
        "sourceUnchangedDuringRun": true,
        "testUnchangedDuringRun": true,
        "output": "Γ£ö list is scoped and paginated (1.8303ms)\r\nΓ£ö CSV contains matching rows and header (0.4119ms)\r\nΓ£ö empty export retains header (0.1725ms)\r\nΓ£ö CSV escapes quotes and commas (0.2486ms)\r\nΓä╣ tests 4\r\nΓä╣ suites 0\r\nΓä╣ pass 4\r\nΓä╣ fail 0\r\nΓä╣ cancelled 0\r\nΓä╣ skipped 0\r\nΓä╣ todo 0\r\nΓä╣ duration_ms 190.6348\r\n"
      },
      "run-57f543d4aa83436fb5485393949a14dd.json": {
        "capturedAt": "2026-09-27T06:43:43.9482310Z",
        "commit": "synthetic-snapshot",
        "node": "v24.14.0",
        "command": [
          "node",
          "--test",
          "--test-isolation=none",
          "probes/r2-pagination-ignored.test.mjs"
        ],
        "exitCode": 0,
        "elapsedMilliseconds": 217,
        "sourceHash": "A9F586BF52847E36F84C37ED7E840874706550A4845AF0B178D5CDC9970DA663",
        "testHash": "7C2607F2FF80D32788B6503E95ED0369E57EC6BFCE16DC7A04D005477A6ADA39",
        "requirementsHash": "8FA334D8285188A277DF679B612B8B9C62BEE424B3922FEE4D2CEE810531293D",
        "sourceUnchangedDuringRun": true,
        "testUnchangedDuringRun": true,
        "output": "Γ£ö R2: export ignores offset ΓÇö all matching records returned even when offset=2 (1.3123ms)\r\nΓ£ö R2: export ignores limit ΓÇö all matching records returned even when limit=1 (0.2463ms)\r\nΓä╣ tests 2\r\nΓä╣ suites 0\r\nΓä╣ pass 2\r\nΓä╣ fail 0\r\nΓä╣ cancelled 0\r\nΓä╣ skipped 0\r\nΓä╣ todo 0\r\nΓä╣ duration_ms 104.8778\r\n"
      }
    }
  },
  {
    "id": "R42",
    "title": "Workspace leak",
    "subtitle": "Tenant boundary violated",
    "baseline": "Correctly blocked",
    "path": "outputs/specguard-evaluation/review-cases/R42/structured",
    "disposition": "blocked",
    "review": {
      "caseId": "R42",
      "commit": "synthetic-snapshot",
      "requirements": [
        {
          "id": "R1",
          "requirement": "Export only records belonging to the active workspace.",
          "source": "REQUIREMENTS.md:5",
          "status": "contradicted",
          "codeReferences": [
            "src/orders.ts:8"
          ],
          "evidenceFiles": [
            "review-results/run-f1a73ac7480f42b79d18cf02d76b44db.json"
          ],
          "observation": "The exportOrders function at src/orders.ts:8 omits the workspaceId predicate present in listOrders (src/orders.ts:4 / baseline/orders.ts:4). The R1 probe (probes/r1-workspace-scope.test.mjs) reproduces the defect: calling exportOrders with workspaceId:'a' against a dataset containing both workspace-a and workspace-b records returns rows from both workspaces. Actual output: 'id,status,total\\n\"a1\",\"paid\",\"10\"\\n\"b1\",\"paid\",\"99\"'. Both probe tests fail (exit code 1).",
          "humanQuestion": null
        },
        {
          "id": "R2",
          "requirement": "Respect the selected status filter. Export every matching record across all pages, regardless of the current page offset or limit.",
          "source": "REQUIREMENTS.md:6",
          "status": "supported",
          "codeReferences": [
            "src/orders.ts:8",
            "test/orders.test.mjs:6"
          ],
          "evidenceFiles": [
            "review-results/run-a44579fe333f4250a3eb3d3036beacb0.json"
          ],
          "observation": "exportOrders iterates the full input array and applies the status predicate without calling slice or consulting offset/limit. The existing test suite passes (4/4 green). This is limited to the checks shown; no cross-page boundary test exists, but the implementation structure is consistent with the requirement. Note: R2 evidence is partially undermined by R1 being violated — once workspace scoping is added the status test may need to be re-checked.",
          "humanQuestion": null
        },
        {
          "id": "R3",
          "requirement": "Empty exports contain the header row.",
          "source": "REQUIREMENTS.md:7",
          "status": "supported",
          "codeReferences": [
            "src/orders.ts:12",
            "test/orders.test.mjs:9"
          ],
          "evidenceFiles": [
            "review-results/run-a44579fe333f4250a3eb3d3036beacb0.json"
          ],
          "observation": "serialize() uses ['id,status,total', ...rows.map(…)].join('\\n'); when rows is empty the spread contributes nothing and the output is the header only. Dedicated test passes. Supported, limited to the checks shown.",
          "humanQuestion": null
        },
        {
          "id": "R4",
          "requirement": "Quote CSV values and escape embedded quotation marks.",
          "source": "REQUIREMENTS.md:8",
          "status": "supported",
          "codeReferences": [
            "src/orders.ts:12",
            "test/orders.test.mjs:10"
          ],
          "evidenceFiles": [
            "review-results/run-a44579fe333f4250a3eb3d3036beacb0.json"
          ],
          "observation": "All values are unconditionally double-quoted and embedded double-quote characters are replaced with double-double-quote per RFC 4180. The escape test passes. Supported, limited to the checks shown.",
          "humanQuestion": null
        }
      ],
      "findings": [
        {
          "id": "F1",
          "requirement": "R1",
          "title": "exportOrders does not filter by workspaceId",
          "severity": "critical",
          "evidence": [
            "src/orders.ts:8 — predicate is '!query.status || o.status === query.status'; query.workspaceId is never referenced",
            "probes/r1-workspace-scope.test.mjs — two tests both fail; actual output includes rows from a different workspace",
            "review-results/run-f1a73ac7480f42b79d18cf02d76b44db.json — captured exit code 1, 0 pass, 2 fail"
          ],
          "detail": "By contrast, listOrders (src/orders.ts:4 and baseline/orders.ts:4) correctly includes 'o.workspaceId === query.workspaceId' in its filter. The fix is to add the same predicate to the filter in exportOrders at src/orders.ts:8. The existing test suite does not cover this case: test/orders.test.mjs:6 supplies a dataset where all rows share the same workspaceId:'a', so cross-workspace leakage is never exercised.",
          "requirementId": "R1"
        }
      ],
      "unassessed": [
        "Header column order is fixed to 'id,status,total'; no requirement specifies column order — not assessed.",
        "Behaviour when query.workspaceId is an empty string or undefined — out of scope per requirements.",
        "Performance with very large order datasets — out of scope per requirements.",
        "Integration with the order-list screen's Query object construction — not represented in this file set."
      ],
      "recommendation": "Do not merge. R1 is reproducibly violated: exportOrders leaks orders from all workspaces. The fix is a single-line change to add the workspaceId predicate to the filter in exportOrders (src/orders.ts:8), matching the predicate already present in listOrders. After fixing, add a test that mixes orders from multiple workspaces to prevent regression. R2, R3, and R4 are supported by the existing tests."
    },
    "receipts": {
      "run-f1a73ac7480f42b79d18cf02d76b44db.json": {
        "capturedAt": "2026-09-27T06:54:04.7727571Z",
        "commit": "synthetic-snapshot",
        "node": "v24.14.0",
        "command": [
          "node",
          "--test",
          "--test-isolation=none",
          "probes/r1-workspace-scope.test.mjs"
        ],
        "exitCode": 1,
        "elapsedMilliseconds": 193,
        "sourceHash": "B895DF133BBA63879CF6ECC423FD9B295DD20D93E289E2C4C10795DA379D7024",
        "testHash": "C958DB688BFF9144FD60D43FE757AB450041F7C1DD40477319C71D71DE63D44C",
        "requirementsHash": "8FA334D8285188A277DF679B612B8B9C62BEE424B3922FEE4D2CEE810531293D",
        "sourceUnchangedDuringRun": true,
        "testUnchangedDuringRun": true,
        "output": "Γ£û R1: exportOrders excludes orders from other workspaces (5.0727ms)\r\nΓ£û R1: exportOrders with status filter still excludes other workspaces (0.4657ms)\r\nΓä╣ tests 2\r\nΓä╣ suites 0\r\nΓä╣ pass 0\r\nΓä╣ fail 2\r\nΓä╣ cancelled 0\r\nΓä╣ skipped 0\r\nΓä╣ todo 0\r\nΓä╣ duration_ms 97.8776\r\n\r\nΓ£û failing tests:\r\n\r\ntest at probes\\r1-workspace-scope.test.mjs:8:1\r\nΓ£û R1: exportOrders excludes orders from other workspaces (5.0727ms)\r\n  AssertionError [ERR_ASSERTION]: exportOrders must filter by workspaceId; b1 (workspace b) must not appear in workspace a export\r\n  + actual - expected\r\n  \r\n  + 'id,status,total\\n\"a1\",\"paid\",\"10\"\\n\"b1\",\"paid\",\"99\"'\r\n  - 'id,status,total\\n\"a1\",\"paid\",\"10\"'\r\n  \r\n      at TestContext.<anonymous> (file:///C:/Users/USER/Documents/Codex/2026-09-26/https-lablab-ai-ai-hackathons-ibm/outputs/specguard-evaluation/review-cases/R42/structured/probes/r1-workspace-scope.test.mjs:15:10)\r\n      at Test.runInAsyncScope (node:async_hooks:228:14)\r\n      at Test.run (node:internal/test_runner/test:1118:25)\r\n      at Test.start (node:internal/test_runner/test:1015:17)\r\n      at startSubtestAfterBootstrap (node:internal/test_runner/harness:358:17) {\r\n    generatedMessage: false,\r\n    code: 'ERR_ASSERTION',\r\n    actual: 'id,status,total\\n\"a1\",\"paid\",\"10\"\\n\"b1\",\"paid\",\"99\"',\r\n    expected: 'id,status,total\\n\"a1\",\"paid\",\"10\"',\r\n    operator: 'strictEqual',\r\n    diff: 'simple'\r\n  }\r\n\r\ntest at probes\\r1-workspace-scope.test.mjs:19:1\r\nΓ£û R1: exportOrders with status filter still excludes other workspaces (0.4657ms)\r\n  AssertionError [ERR_ASSERTION]: status-filtered export must still be scoped to workspaceId\r\n  + actual - expected\r\n  \r\n  + 'id,status,total\\n\"a1\",\"paid\",\"5\"\\n\"b1\",\"paid\",\"7\"'\r\n  - 'id,status,total\\n\"a1\",\"paid\",\"5\"'\r\n  \r\n      at TestContext.<anonymous> (file:///C:/Users/USER/Documents/Codex/2026-09-26/https-lablab-ai-ai-hackathons-ibm/outputs/specguard-evaluation/review-cases/R42/structured/probes/r1-workspace-scope.test.mjs:25:10)\r\n      at Test.runInAsyncScope (node:async_hooks:228:14)\r\n      at Test.run (node:internal/test_runner/test:1118:25)\r\n      at Test.processPendingSubtests (node:internal/test_runner/test:787:18)\r\n      at Test.postRun (node:internal/test_runner/test:1247:19)\r\n      at Test.run (node:internal/test_runner/test:1175:12)\r\n      at async startSubtestAfterBootstrap (node:internal/test_runner/harness:358:3) {\r\n    generatedMessage: false,\r\n    code: 'ERR_ASSERTION',\r\n    actual: 'id,status,total\\n\"a1\",\"paid\",\"5\"\\n\"b1\",\"paid\",\"7\"',\r\n    expected: 'id,status,total\\n\"a1\",\"paid\",\"5\"',\r\n    operator: 'strictEqual',\r\n    diff: 'simple'\r\n  }\r\n"
      },
      "run-a44579fe333f4250a3eb3d3036beacb0.json": {
        "capturedAt": "2026-09-27T06:52:54.9305555Z",
        "commit": "synthetic-snapshot",
        "node": "v24.14.0",
        "command": [
          "node",
          "--test",
          "--test-isolation=none",
          "test/orders.test.mjs"
        ],
        "exitCode": 0,
        "elapsedMilliseconds": 193,
        "sourceHash": "B895DF133BBA63879CF6ECC423FD9B295DD20D93E289E2C4C10795DA379D7024",
        "testHash": "E426386CD9106C9F4F1B033FDE243682DF822649BD276A4F266EC14B14F805FC",
        "requirementsHash": "8FA334D8285188A277DF679B612B8B9C62BEE424B3922FEE4D2CEE810531293D",
        "sourceUnchangedDuringRun": true,
        "testUnchangedDuringRun": true,
        "output": "Γ£ö list is scoped and paginated (1.1524ms)\r\nΓ£ö CSV contains matching rows and header (0.3794ms)\r\nΓ£ö empty export retains header (0.173ms)\r\nΓ£ö CSV escapes quotes and commas (0.2187ms)\r\nΓä╣ tests 4\r\nΓä╣ suites 0\r\nΓä╣ pass 4\r\nΓä╣ fail 0\r\nΓä╣ cancelled 0\r\nΓä╣ skipped 0\r\nΓä╣ todo 0\r\nΓä╣ duration_ms 96.1275\r\n"
      }
    }
  },
  {
    "id": "R68",
    "title": "Pagination intent",
    "subtitle": "Product decision required",
    "baseline": "Incorrectly blocked",
    "path": "outputs/specguard-evaluation/review-cases/R68/structured",
    "disposition": "decision",
    "review": {
      "caseId": "R68",
      "commit": "synthetic-snapshot",
      "requirements": [
        {
          "id": "R1",
          "requirement": "Export only records belonging to the active workspace.",
          "source": "REQUIREMENTS.md:5",
          "status": "supported",
          "codeReferences": [
            "src/orders.ts:4",
            "src/orders.ts:7-8"
          ],
          "evidenceFiles": [
            "review-results/run-4e117328dd2a486981c8a90f25d91c4e.json"
          ],
          "observation": "exportOrders delegates to listOrders which applies a strict equality filter on workspaceId (src/orders.ts:4). The test 'list is scoped and paginated' passes a record with workspaceId 'b' while querying 'a' and confirms zero rows are returned. The CSV test also verifies that only records for workspaceId 'a' appear. Evidence is limited to the four supplied tests; no additional probe was needed.",
          "humanQuestion": null
        },
        {
          "id": "R2",
          "requirement": "Respect the selected status filter. Export records matching the current view filters.",
          "source": "REQUIREMENTS.md:6",
          "status": "needs-decision",
          "codeReferences": [
            "src/orders.ts:4",
            "src/orders.ts:7-8"
          ],
          "evidenceFiles": [
            "review-results/run-4e117328dd2a486981c8a90f25d91c4e.json",
            "review-results/run-897570e5939d447b816aefc17bd93a45.json"
          ],
          "observation": "Status filtering is correctly applied: exportOrders passes the full Query (including status) to listOrders (src/orders.ts:7-8), and listOrders applies the status predicate (src/orders.ts:4). The test 'CSV contains matching rows and header' confirms only the 'paid' row appears when status:'paid'. However, exportOrders also inherits the offset/limit pagination from listOrders. A probe (probes/r2-pagination-export.test.mjs) confirmed that with 25 matching records and no explicit limit, the export returns only 20 rows (the default limit in listOrders baseline:5 / src:5). If 'current view filters' is intended to include only status (and workspace), pagination should be stripped from the export query. If the intent is to export exactly the visible page, the current behaviour is correct. This ambiguity cannot be resolved from the issue text alone.",
          "humanQuestion": "Should exportOrders export ALL records matching the workspace/status filters regardless of offset/limit, or should it honour the same pagination as the list view? Currently it applies the default limit of 20 via listOrders. For datasets exceeding 20 orders, the export will be silently truncated unless the caller passes a sufficiently large limit."
        },
        {
          "id": "R3",
          "requirement": "Empty exports contain the header row.",
          "source": "REQUIREMENTS.md:7",
          "status": "supported",
          "codeReferences": [
            "src/orders.ts:10-11"
          ],
          "evidenceFiles": [
            "review-results/run-4e117328dd2a486981c8a90f25d91c4e.json"
          ],
          "observation": "serialize always prepends the literal header string 'id,status,total' as the first element of the joined array (src/orders.ts:11). When the rows array is empty the spread contributes nothing and the result is the bare header. The test 'empty export retains header' explicitly asserts this and passes.",
          "humanQuestion": null
        },
        {
          "id": "R4",
          "requirement": "Quote CSV values and escape embedded quotation marks.",
          "source": "REQUIREMENTS.md:8",
          "status": "supported",
          "codeReferences": [
            "src/orders.ts:11"
          ],
          "evidenceFiles": [
            "review-results/run-4e117328dd2a486981c8a90f25d91c4e.json"
          ],
          "observation": "Every field value is individually wrapped in double-quotes and any embedded double-quote character is doubled using replaceAll('\"','\"\"') before wrapping (src/orders.ts:11). The test 'CSV escapes quotes and commas' uses an id containing both a comma and a double-quote and confirms the output is '\"a,\"\"b\"'. All four field positions (id, status, total) are consistently quoted, even numeric values. Newlines embedded in values are not tested; however, the requirement mentions only quotation marks, and the issue context states totals/ids come from trusted upstream code, so embedded newlines are considered out of scope per the requirement text.",
          "humanQuestion": null
        }
      ],
      "findings": [
        {
          "id": "F1",
          "requirementId": "R2",
          "title": "exportOrders inherits pagination from listOrders, silently truncating exports larger than the default limit",
          "severity": "needs-decision",
          "evidence": "review-results/run-897570e5939d447b816aefc17bd93a45.json",
          "detail": "Probe r2-pagination-export.test.mjs demonstrates that calling exportOrders with 25 matching records and no explicit limit returns only 20 rows (header + 20 data lines = 21 lines total, not 26). This is caused by exportOrders passing the Query unmodified to listOrders, which applies a default limit of 20 (src/orders.ts:5, baseline/orders.ts:5). A user exporting orders to CSV may not realise the file is paginated. Whether this is the intended behaviour depends on the meaning of 'current view filters' in R2 — see humanQuestion on R2.",
          "codeReference": "src/orders.ts:7-8"
        },
        {
          "id": "F2",
          "requirementId": null,
          "title": "workspaceId column is excluded from CSV output",
          "severity": "observation",
          "evidence": "src/orders.ts:11",
          "detail": "The serialize function emits three columns: id, status, total. The workspaceId field present on every Order is omitted from the header and from each row. The requirements do not specify which columns must appear, so this may be intentional. No test checks for the presence or absence of workspaceId in the output.",
          "codeReference": "src/orders.ts:10-11"
        }
      ],
      "unassessed": [],
      "assumptions": [
        "Node v24.14.0 with --test-isolation=none was used; test results are reproducible for the same node version.",
        "The issue text is the sole source of intent; no linked ticket or design doc was available.",
        "Newlines embedded within field values are considered out of scope per the requirement wording and the note about trusted upstream inputs.",
        "Column selection for the CSV (which fields appear) is considered outside scope since the requirements are silent on it.",
        "Bobcoin budget usage could not be observed; time cap applied."
      ],
      "recommendation": "The change satisfies R1, R3, and R4 as written and tested. R2 is partially satisfied (status filter works correctly) but there is an unresolved ambiguity: exportOrders silently inherits pagination from listOrders, which means exports for workspaces with more than 20 orders will be truncated by default. A human decision is required on whether 'current view filters' encompasses offset/limit or only workspace/status. If exports should be exhaustive, exportOrders must bypass or override the pagination parameters before delegating to listOrders (or use a separate query path). No source repairs were made during this review."
    },
    "receipts": {
      "run-4e117328dd2a486981c8a90f25d91c4e.json": {
        "capturedAt": "2026-09-27T11:09:16.8513991Z",
        "commit": "synthetic-snapshot",
        "node": "v24.14.0",
        "command": [
          "node",
          "--test",
          "--test-isolation=none",
          "test/orders.test.mjs"
        ],
        "exitCode": 0,
        "elapsedMilliseconds": 766,
        "sourceHash": "99D92853FDC5AA1DA05CEAE538DBDBCC1BFAFE33C8F52ACF6675FF173E186529",
        "testHash": "E426386CD9106C9F4F1B033FDE243682DF822649BD276A4F266EC14B14F805FC",
        "requirementsHash": "1E155A32041993865E40D4E95A25562BC13B792127B89ADCB8A76C9CB2D785AF",
        "sourceUnchangedDuringRun": true,
        "testUnchangedDuringRun": true,
        "output": "Γ£ö list is scoped and paginated (3.5431ms)\r\nΓ£ö CSV contains matching rows and header (0.6284ms)\r\nΓ£ö empty export retains header (0.1982ms)\r\nΓ£ö CSV escapes quotes and commas (0.2019ms)\r\nΓä╣ tests 4\r\nΓä╣ suites 0\r\nΓä╣ pass 4\r\nΓä╣ fail 0\r\nΓä╣ cancelled 0\r\nΓä╣ skipped 0\r\nΓä╣ todo 0\r\nΓä╣ duration_ms 265.8216\r\n"
      },
      "run-897570e5939d447b816aefc17bd93a45.json": {
        "capturedAt": "2026-09-27T11:15:22.7037168Z",
        "commit": "synthetic-snapshot",
        "node": "v24.14.0",
        "command": [
          "node",
          "--test",
          "--test-isolation=none",
          "probes/r2-pagination-export.test.mjs"
        ],
        "exitCode": 1,
        "elapsedMilliseconds": 427,
        "sourceHash": "99D92853FDC5AA1DA05CEAE538DBDBCC1BFAFE33C8F52ACF6675FF173E186529",
        "testHash": "20E02F109D9AD8E67536B837394A6C47AE4FBBA5F3A4D6F5CFD58C3ACBD709D1",
        "requirementsHash": "1E155A32041993865E40D4E95A25562BC13B792127B89ADCB8A76C9CB2D785AF",
        "sourceUnchangedDuringRun": true,
        "testUnchangedDuringRun": true,
        "output": "Γ£û R2-probe: export without limit returns all 25 matching rows (7.6491ms)\r\nΓ£ö R2-probe: export with limit:5 returns only 5 rows (pagination leaks into export) (0.941ms)\r\nΓä╣ tests 2\r\nΓä╣ suites 0\r\nΓä╣ pass 1\r\nΓä╣ fail 1\r\nΓä╣ cancelled 0\r\nΓä╣ skipped 0\r\nΓä╣ todo 0\r\nΓä╣ duration_ms 268.6612\r\n\r\nΓ£û failing tests:\r\n\r\ntest at probes\\r2-pagination-export.test.mjs:14:1\r\nΓ£û R2-probe: export without limit returns all 25 matching rows (7.6491ms)\r\n  AssertionError [ERR_ASSERTION]: expected 26 lines (header + 25 rows), got 21\r\n  \r\n  21 !== 26\r\n  \r\n      at TestContext.<anonymous> (file:///C:/Users/USER/Documents/Codex/2026-09-26/https-lablab-ai-ai-hackathons-ibm/outputs/specguard-evaluation/review-cases/R68/structured/probes/r2-pagination-export.test.mjs:18:10)\r\n      at Test.runInAsyncScope (node:async_hooks:228:14)\r\n      at Test.run (node:internal/test_runner/test:1118:25)\r\n      at Test.start (node:internal/test_runner/test:1015:17)\r\n      at startSubtestAfterBootstrap (node:internal/test_runner/harness:358:17) {\r\n    generatedMessage: false,\r\n    code: 'ERR_ASSERTION',\r\n    actual: 21,\r\n    expected: 26,\r\n    operator: 'strictEqual',\r\n    diff: 'simple'\r\n  }\r\n"
      }
    }
  }
];
