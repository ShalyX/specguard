# Code Review — CSV Export for Workspace Orders
**PR:** synthetic-snapshot  
**Reviewer:** Bob (AI)  
**Reviewed:** `src/orders.ts` vs `baseline/orders.ts`  
**Requirements:** `REQUIREMENTS.md` (R1–R4)

---

## Decision: **Request Changes** (one functional defect; test-coverage gap)

---

## Summary

The proposal adds `exportOrders` and the private `serialize` helper to the existing module. Three of the four requirements are implemented correctly. One requirement (**R2 – paginated/full export**) has a latent defect: the function accepts but silently ignores `offset` and `limit`, which is the correct behavior *now*, but this relies on the caller never passing those fields. The `Query` interface still carries `offset` and `limit`, and the function signature accepts a full `Query`. Nothing prevents a future call-site from passing the current page's offset/limit, which would silently truncate the export. This is a design ambiguity with a functional consequence.

---

## Findings

### F1 – R2 defect: `exportOrders` ignores pagination fields but is not protected against them (Severity: **Medium**)

**Requirement R2:** "Export every matching record across all pages, regardless of the current page offset or limit."

**What the code does:**

```typescript
// src/orders.ts  line 8
const rows = orders.filter(o => o.workspaceId === query.workspaceId && ...);
return serialize(rows);
```

The filter ignores `query.offset` and `query.limit` — correct by intent. However, the function accepts the same `Query` type used by `listOrders`, which *does* apply offset/limit. The issue is:

1. **No enforced contract:** Nothing in the type system or documentation signals that `offset`/`limit` are ignored. A developer looking at the screen-level code will naturally pass the full `query` object (including the page offset) from the order-list UI into `exportOrders`. That code path is exactly what R2 says must return the full result set — and it would, *coincidentally*, because `exportOrders` ignores those fields. But the contract is invisible.

2. **Risk of regression:** If a future maintainer "fixes" `exportOrders` to be consistent with `listOrders` in handling `offset`/`limit`, R2 breaks silently. The existing test suite would not catch this because no test exercises the function with a non-zero offset or restrictive limit.

**Probe evidence:**  
`probes/r2-pagination-independence.test.mjs` — both tests **pass** today:
- `R2: offset in query does NOT truncate export` ✔
- `R2: limit in query does NOT truncate export` ✔

The behavior is correct, but it is not guarded. The fix is to either:
- Accept a narrower type (omitting `offset`/`limit`) for `exportOrders`, or  
- Add an explicit comment documenting that these fields are intentionally ignored.

Either approach makes the intent visible and prevents silent regression.

---

### F2 – Test-coverage gap on R2 (Severity: **Low**)

The added test suite (`test/orders.test.mjs`) contains no test that passes a non-zero offset or a small limit to `exportOrders`. A passing CI run does not verify that the function is page-independent. The probes written during this review fill that gap, but the shipped test file should include at least one such case.

---

### F3 – `serialize` column set omits no obvious fields, but `workspaceId` absence is undocumented (Severity: **Minor / Ambiguity**)

The header row is `id,status,total` — `workspaceId` is omitted. This is almost certainly correct (workspaceId is implicit context, not a useful export column), but there is no comment or requirement statement that explicitly calls this out. If a consumer of the CSV later needs to reconcile records across workspaces, they have no column to join on. The requirements do not prescribe the column set, so this is an ambiguity rather than a defect; it should be confirmed with the product owner before shipping.

---

### F4 – R4 quoting is implemented correctly (Informational)

`serialize` wraps every field in double-quotes and doubles any embedded `"` character (`replaceAll('"', '""')`). This is RFC 4180–compliant for quote escaping. Probe `probes/r4-quoting-edge-cases.test.mjs` confirms correct handling of embedded newlines, commas in field values, and the existing test confirms `a,"b` → `"a,""b"`. No defect found here.

---

### F5 – R1 workspace isolation is implemented correctly (Informational)

`exportOrders` filters on `workspaceId` identically to `listOrders`. Probe `probes/r1-workspace-isolation.test.mjs` confirms no cross-workspace leakage and that an unknown workspace returns the header-only row. No defect found here.

---

### F6 – R3 empty-export header row is implemented correctly (Informational)

When the filtered result set is empty, `serialize` returns `'id,status,total'` because the spread of an empty array produces only the header element. The existing test confirms this; the R1 probe's "unknown workspace" case also exercises it. No defect found here.

---

## Test Run Summary

| Run | Test file | Exit | Pass | Fail |
|-----|-----------|------|------|------|
| run-4af088… | `test/orders.test.mjs` | 0 | 4 | 0 |
| run-56ec72… | `probes/r2-pagination-independence.test.mjs` | 0 | 2 | 0 |
| run-866199… | `probes/r1-workspace-isolation.test.mjs` | 0 | 2 | 0 |
| run-38ab3a… | `probes/r4-quoting-edge-cases.test.mjs` | 0 | 2 | 0 |

All 10 tests pass. Node version as reported by capture.ps1 is recorded in the individual JSON run files under `review-results/`.

---

## Required Actions Before Merge

1. **[Blocking — F1]** Make the "pagination fields are ignored" contract explicit. Recommended approach: introduce a narrower parameter type for `exportOrders` (e.g. `Omit<Query, 'offset' | 'limit'>`) so the compiler rejects accidental pagination arguments. A documented comment is an acceptable minimum if changing the type is undesirable.

2. **[Recommended — F2]** Add at least one test to `test/orders.test.mjs` that calls `exportOrders` with `{ offset: 2, limit: 1 }` and asserts that all matching rows are present, not just one.

3. **[Confirm — F3]** Confirm with the product owner that `workspaceId` is intentionally excluded from the CSV columns.

---

## Usage

Bob usage could not be observed during this session (no Bobcoin meter visible). The time-cap rule applied; this review was completed within the 10-minute window.
