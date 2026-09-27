# Output contract

Save a JSON object with these fields:

```json
{
  "caseId": "PR-123",
  "commit": "commit SHA or unavailable",
  "requirements": [
    {
      "id": "R1",
      "requirement": "Exact requirement text",
      "source": "ISSUE.md:12",
      "status": "supported | contradicted | needs-decision | unassessed",
      "codeReferences": ["src/file.ts:18-24"],
      "evidenceFiles": ["review-results/run-id.json"],
      "observation": "What the cited source and execution establish",
      "humanQuestion": null
    }
  ],
  "findings": [],
  "unassessed": [],
  "recommendation": "Merge recommendation bounded by the ledger"
}
```

`codeReferences` must contain strings in `path:line` or `path:start-end` form. Use repository-relative paths. `needs-decision` entries must include a non-empty `humanQuestion`.
