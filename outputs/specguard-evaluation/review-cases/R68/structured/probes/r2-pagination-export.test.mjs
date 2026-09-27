// Probe: R2 — does exportOrders honour pagination parameters?
// If limit is applied, a large dataset will be truncated in the export.
import test from 'node:test';
import assert from 'node:assert/strict';
import {exportOrders} from '../src/orders.ts';

const orders = Array.from({length: 25}, (_, i) => ({
  id: `o${i}`,
  workspaceId: 'ws1',
  status: 'open',
  total: i,
}));

test('R2-probe: export without limit returns all 25 matching rows', () => {
  const csv = exportOrders(orders, { workspaceId: 'ws1' });
  const lines = csv.split('\n');
  // Expect header + 25 data rows
  assert.equal(lines.length, 26, `expected 26 lines (header + 25 rows), got ${lines.length}`);
});

test('R2-probe: export with limit:5 returns only 5 rows (pagination leaks into export)', () => {
  const csv = exportOrders(orders, { workspaceId: 'ws1', limit: 5 });
  const lines = csv.split('\n');
  // If pagination is applied, only 5 data rows appear
  assert.equal(lines.length, 6, `expected 6 lines (header + 5 rows), got ${lines.length}`);
});
