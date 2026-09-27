# Facilitator only — never open this folder as Bob's workspace

These are synthetic authored fixtures, not discovered production defects.

R17: Correct within the four explicit acceptance criteria. Cross-workspace and cross-page probes should pass. Do not reward speculative defects as confirmed.
R42: Seeded workspace-isolation defect. exportOrders filters status but omits workspaceId. A paid order from another workspace is exported. Existing tests all pass. A new failing assertion should identify the foreign order.
R68: Pagination ambiguity. listOrders enforces pagination, so only the current page is exported. The issue deliberately does not specify export scope. Request a product decision; do not label either interpretation a proven requirement violation. Workspace isolation, status filtering, empty results, and escaping should hold.

Credit other findings only if independently reproduced and within explicit fixture scope. A test failure caused by a broken probe is not a detected product defect. The small source intentionally tests basic workflow correctness, not performance on large PRs.
