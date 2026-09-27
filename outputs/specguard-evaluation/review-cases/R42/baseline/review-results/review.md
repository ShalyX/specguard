# Code Review — CSV Export for Workspace Orders

**Source under review:** `src/orders.ts`  
**Baseline:** `baseline/orders.ts`  
**Requirements:** `REQUIREMENTS.md`  
**Review date:** 2026-09-26  
**Reviewer:** Bob (automated review agent)

---

## Decision: **REQUEST CHANGES** — do not merge

One confirmed requirement defect (R1) is present. All other requirements are satisfied. The test suite shipped with the PR does not catch the defect.

---

## Findings

### DEFECT-1 · Critical · R1 violated — workspace filter missing from `exportOrders`

**Requirement R1:** *Export only records belonging to the active workspace.*

**Location:** [`src/orders.ts` line 8](../src/orders.ts)

```typescript
// src/orders.ts — proposed
export function exportOrders(orders: Order[], query: Query): string {
  const rows = orders.filter(o => !query.status || o.status === query.status);
  //                                ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  //                                workspaceId is never checked
  return serialize(rows);
}
```

**Baseline comparison:** `listOrders` (unchanged, line 4) correctly filters by `workspaceId`:

```typescript
// baseline/orders.ts — correct pattern
orders.filter(o => o.workspaceId === query.workspaceId && (!query.status || o.status === query.status));
```

`exportOrders` omits the `o.workspaceId === query.workspaceId` predicate. Any order belonging to a **different** workspace that matches the status filter (or when no status filter is set) is included in the export. This is a data-isolation bug; in a multi-tenant system this constitutes information leakage between workspaces.

**Proof — probe run (`probes/workspace-filter.test.mjs`):**

Recorded in `review-results/run-ea74b2ee7cec49eda84e82e1df9e8c4f.json` — exit code 1, 2 of 3 assertions fail:

```
✖ R1: exportOrders excludes records from other workspaces
  AssertionError: ws-B record "b1" leaked into ws-A export:
  id,status,total
  "a1","paid","10"
  "b1","paid","99"   ← record belonging to ws-B appears in ws-A export

✖ R1+R2: exportOrders with status filter excludes other-workspace records
  AssertionError: ws-B record "b1" leaked into ws-A status-filtered export
```

**Fix required:** add `o.workspaceId === query.workspaceId &&` to the `filter` predicate in `exportOrders`, mirroring `listOrders`.

---

### FINDING-2 · Minor · Test coverage gap — PR tests do not catch DEFECT-1

The four tests in `test/orders.test.mjs` all pass against the broken implementation (recorded in `review-results/run-2e0c33a7ca6846e7986183065a608fcf.json` — exit code 0).

The test at line 6 calls `exportOrders` with a single-workspace fixture (`workspaceId: 'a'` for all input records), so the missing workspace filter is never exercised. No test passes a mix of records from different workspaces to `exportOrders`. The test suite therefore provides **false confidence** about R1 compliance.

**Recommendation:** add a test with records from at least two workspaces and assert that only the queried workspace's records appear in the output.

---

### FINDING-3 · Informational · `workspaceId` column absent from CSV output

**Requirement context:** R1 defines workspace-scoping as a correctness property; the requirements do not enumerate CSV columns explicitly.

`serialize` emits `id,status,total` — the `workspaceId` field is omitted. For a same-workspace export this is defensible (all rows share the same value), but the omission is undocumented. Maintainers should confirm this is the intended column set.

---

### FINDING-4 · Informational · R2 pagination bypass — correctly implemented, test is weak

R2 requires the export to ignore pagination. `exportOrders` correctly does **not** call `.slice()`, so pagination offset/limit do not limit the export. The probe confirms this passes (`R2: exportOrders ignores pagination offset/limit — ✔`).

However, none of the PR tests explicitly check the pagination-bypass property with a non-zero offset or limit. The existing test at line 6 supplies `status: 'paid'` but no `offset`/`limit`, so the property is tested only by the probe.

---

## Test Run Summary

| Run | File | Exit code | Pass | Fail | Record |
|-----|------|-----------|------|------|--------|
| Existing PR tests | `test/orders.test.mjs` | 0 | 4 | 0 | `run-2e0c33a7ca6846e7986183065a608fcf.json` |
| Probe (workspace filter) | `probes/workspace-filter.test.mjs` | 1 | 1 | 2 | `run-ea74b2ee7cec49eda84e82e1df9e8c4f.json` |

---

## Checklist Against Requirements

| Req | Description | Status | Notes |
|-----|-------------|--------|-------|
| R1 | Export scoped to active workspace | ❌ FAIL | `workspaceId` predicate missing — see DEFECT-1 |
| R2 | Status filter respected; all pages exported | ✅ PASS | `exportOrders` filters by status and ignores pagination |
| R3 | Empty export contains header row | ✅ PASS | `serialize([])` returns `'id,status,total'` |
| R4 | Values quoted; embedded quotes escaped | ✅ PASS | `replaceAll('"', '""')` with surrounding `"` quotes |

---

## Required Action

The PR must not be merged in its current state. Before re-review:

1. **Fix `exportOrders`** — add `o.workspaceId === query.workspaceId` to the filter predicate (DEFECT-1).
2. **Add a cross-workspace test** — include at least one test that passes orders from multiple workspaces and asserts isolation (FINDING-2).
3. *(Optional)* Confirm the intended CSV column set and document it (FINDING-3).
