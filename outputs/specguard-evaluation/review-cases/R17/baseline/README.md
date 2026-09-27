# Orders service

Synthetic, local-only review fixture. Requires Node 24; no installation or network needed.
Run `node --test --test-isolation=none test/orders.test.mjs`. Compare baseline/orders.ts to src/orders.ts. This fixture has no Git remote.
Existing checks are a starting point, not a completeness guarantee. Add investigation tests under probes/. Run `./capture.ps1 probes/name.test.mjs` for execution receipts.

