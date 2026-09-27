// Probe: R2 – exportOrders must export ALL matching records across all pages,
// regardless of any offset/limit in the Query. The existing test suite does not
// verify this. Here we confirm both that a non-zero offset is ignored and that a
// restrictive limit does not truncate the export.
import test from 'node:test';
import assert from 'node:assert/strict';
import { exportOrders } from '../src/orders.ts';

const orders = [
  { id: 'o1', workspaceId: 'ws1', status: 'paid', total: 1 },
  { id: 'o2', workspaceId: 'ws1', status: 'paid', total: 2 },
  { id: 'o3', workspaceId: 'ws1', status: 'paid', total: 3 },
  { id: 'o4', workspaceId: 'ws1', status: 'paid', total: 4 },
  { id: 'o5', workspaceId: 'ws1', status: 'paid', total: 5 },
];

test('R2: offset in query does NOT truncate export', () => {
  // With offset=3 and limit=2 (the "current page"), the export should still
  // return all 5 matching records, not just the page slice.
  const csv = exportOrders(orders, { workspaceId: 'ws1', status: 'paid', offset: 3, limit: 2 });
  const lines = csv.split('\n');
  // Header + 5 data rows
  assert.equal(lines.length, 6, `Expected 6 lines (header + 5 rows), got ${lines.length}:\n${csv}`);
});

test('R2: limit in query does NOT truncate export', () => {
  // limit=1 should be irrelevant to the export
  const csv = exportOrders(orders, { workspaceId: 'ws1', limit: 1 });
  const lines = csv.split('\n');
  assert.equal(lines.length, 6, `Expected 6 lines (header + 5 rows), got ${lines.length}:\n${csv}`);
});
