# Code Review: CSV Export for Workspace Orders

**PR fixture:** `src/orders.ts` vs `baseline/orders.ts`  
**Requirements source:** `REQUIREMENTS.md` (R1–R4)  
**Review date:** 2026-09-26  
**Reviewer:** Bob (IBM)  
**Budget note:** Token/Bobcoin usage is not observable in this environment; time cap applied.

---

## Executed Checks

| Run file | Command | Exit code | Pass / Fail |
|---|---|---|---|
| `review-results/run-e067523dd1364280a66a7e66d5acb9e0.json` | `node --test --test-isolation=none test/orders.test.mjs` | 0 | 4/4 pass |
| `review-results/run-2ab8ff5da28b474aab108e17a6aaedfe.json` | `node --test --test-isolation=none probes/pagination-truncation.test.mjs` | 1 | 2/3 pass — **1 FAIL** |
| `review-results/run-8fb8a910ab3440eebbbafe77a95bea5d.json` | `node --test --test-isolation=none probes/column-format.test.mjs` | 0 | 2/2 pass |

---

## Summary of Changes

`src/orders.ts` adds two functions on top of the unchanged `listOrders` baseline:

```
exportOrders(orders, query)  →  calls listOrders then serialize
serialize(rows)              →  builds header + quoted, escaped CSV lines
```

The `listOrders` function (lines 3-6) is **byte-for-byte identical** to the baseline.

---

## Findings

### DEFECT-1 — Pagination leak in `exportOrders` [**BLOCKER**] (violates R1, R2)

**Location:** `src/orders.ts` line 8 — `exportOrders` delegates directly to `listOrders`.

**What happens:** `listOrders` applies `offset` and `limit` (default `limit: 20`). Because `exportOrders` reuses `listOrders` without stripping or overriding the pagination fields, every export is silently capped to the current page window.

**Reproduction:** A workspace with 25 paid orders, exported with a bare `{workspaceId: 'a', status: 'paid'}` query, yields only 21 CSV lines (header + 20 records) instead of 26 (header + 25 records).

```
AssertionError: Expected 26 lines (header + 25 rows) but got 21.
exportOrders is silently applying the default limit of 20.
  21 !== 26
```
*(from `review-results/run-2ab8ff5da28b474aab108e17a6aaedfe.json`)*

**Why it violates requirements:**
- R1: "Export only records belonging to the active workspace" — a user with 100 orders in workspace A will only ever receive 20 of them.
- R2: "Respect the selected status filter. Export records matching the current view filters." — the *filter* (status) is applied correctly, but *pagination* is not a filter; it is a view cursor. Truncating an export to a page window is not what R2 intends.

**Fix direction (not implemented — review only):** `exportOrders` should filter by workspace and status without applying `offset`/`limit`. It should not call `listOrders` as-is, or it must strip pagination from the query before forwarding.

---

### DEFECT-2 — Tests do not cover the pagination truncation path [**BLOCKER test gap**]

**Location:** `test/orders.test.mjs`

The added test suite only tests a dataset small enough to fit within the default 20-record page. No test exercises more than 2 records, so the silent truncation is never caught by the provided tests. The test suite passes even though the core export contract is broken for realistic datasets.

---

### OBSERVATION-1 — `workspaceId` excluded from CSV output [**Design ambiguity**]

**Location:** `src/orders.ts` line 11 — header is `id,status,total`.

`workspaceId` is present on every `Order` but is not included in the export. This is not explicitly forbidden by the requirements, and one could argue that because the export is scoped to a single workspace the column is redundant. However, the requirements do not specify which columns to include; they only specify filtering and quoting rules.

**Risk:** If the CSV is used downstream to reconcile records across workspaces, the absence of `workspaceId` makes that impossible. A deliberate decision to omit it should be documented.

**Probe result:** Confirmed — `workspaceId` value `ws-secret` does not appear in export output. *(from `review-results/run-8fb8a910ab3440eebbbafe77a95bea5d.json`)*

---

### OBSERVATION-2 — Numeric `total` serialized as quoted string [**Minor / informational**]

**Location:** `src/orders.ts` line 11 — `.map(v => '"' + String(v) + '"')` applies to all columns uniformly, including the numeric `total`.

R4 requires values to be quoted, which this satisfies. However, wrapping a number like `99.5` as `"99.5"` causes spreadsheet applications (Excel, Google Sheets) to import totals as text rather than numbers, breaking SUM/sort operations.

The requirements explicitly state "Order totals and identifiers are supplied by trusted upstream code; this change does not process spreadsheet formulas or calculate totals." This suggests totals should be treated as data, not recalculated — but it does not say they should be quoted as strings. A numeric column without quotes (e.g., `"o1","paid",99.5`) would be the standard CSV approach for numeric fields.

**Probe result:** Confirmed behavior. *(from `review-results/run-8fb8a910ab3440eebbbafe77a95bea5d.json`)*

---

### OBSERVATION-3 — CRLF vs LF line endings [**Minor / informational**]

**Location:** `src/orders.ts` line 11 — `join('\n')`.

[RFC 4180](https://tools.ietf.org/html/rfc4180) specifies CRLF (`\r\n`) as the line terminator for CSV. Many parsers accept LF-only, but the discrepancy may matter for strict consumers (e.g., Excel on Windows opened without import wizard). The requirements do not specify a line-ending format; this is a low-risk note.

---

## R-by-R Compliance Matrix

| Req | Text | Status |
|-----|------|--------|
| R1 | Export only records belonging to the active workspace | ❌ **Violated** — pagination truncates export to one page |
| R2 | Respect the selected status filter | ⚠️ **Partially met** — status filter works; pagination is incorrectly included |
| R3 | Empty exports contain the header row | ✅ Met — confirmed by test and probe |
| R4 | Quote CSV values and escape embedded quotation marks | ✅ Met — `""` doubling works for both quotes and commas-in-values |

---

## Review Decision

**Request Changes — do not merge as-is.**

The single blocking defect (DEFECT-1) is sufficient to block merge: `exportOrders` calls `listOrders` verbatim and therefore silently applies the default 20-record page limit. A workspace with more than 20 matching orders will receive a silently truncated CSV with no error or warning. This directly violates R1 and the practical intent of R2.

DEFECT-2 (missing test coverage) must also be fixed; the provided tests were sized specifically to avoid exposing the pagination bug.

OBSERVATION-1 (missing `workspaceId` column) requires a deliberate decision documented in code or PR comment before merge.

OBSERVATION-2 (numeric totals as strings) and OBSERVATION-3 (LF vs CRLF) are low-risk and can be addressed in follow-up if the maintainer agrees, but should at minimum be acknowledged.
