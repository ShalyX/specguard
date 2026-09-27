// Probe: R2 — exportOrders must export ALL matching records regardless of offset/limit
import test from 'node:test';
import assert from 'node:assert/strict';
import { exportOrders } from '../src/orders.ts';

const orders = [
  { id: 'o1', workspaceId: 'ws', status: 'paid', total: 1 },
  { id: 'o2', workspaceId: 'ws', status: 'paid', total: 2 },
  { id: 'o3', workspaceId: 'ws', status: 'paid', total: 3 },
];

test('R2: export ignores offset — all matching records returned even when offset=2', () => {
  // With pagination applied this would return only the 3rd record.
  // The requirement says export ALL matching records across all pages.
  const csv = exportOrders(orders, { workspaceId: 'ws', status: 'paid', offset: 2, limit: 1 });
  const lines = csv.split('\n');
  // Header + 3 data rows expected
  assert.equal(lines.length, 4, `Expected 4 lines (header+3 rows) but got ${lines.length}:\n${csv}`);
  assert.ok(lines.some(l => l.includes('"o1"')), 'o1 must be present');
  assert.ok(lines.some(l => l.includes('"o2"')), 'o2 must be present');
  assert.ok(lines.some(l => l.includes('"o3"')), 'o3 must be present');
});

test('R2: export ignores limit — all matching records returned even when limit=1', () => {
  const csv = exportOrders(orders, { workspaceId: 'ws', limit: 1 });
  const lines = csv.split('\n');
  assert.equal(lines.length, 4, `Expected 4 lines (header+3 rows) but got ${lines.length}:\n${csv}`);
});
