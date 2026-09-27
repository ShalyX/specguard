// Probe: R1 – exportOrders must only include records for the active workspace.
// Cross-contamination check: two workspaces share the same status; export for
// ws1 must not contain any rows belonging to ws2.
import test from 'node:test';
import assert from 'node:assert/strict';
import { exportOrders } from '../src/orders.ts';

const orders = [
  { id: 'ws1-a', workspaceId: 'ws1', status: 'paid', total: 10 },
  { id: 'ws2-a', workspaceId: 'ws2', status: 'paid', total: 20 },
  { id: 'ws2-b', workspaceId: 'ws2', status: 'paid', total: 30 },
];

test('R1: export excludes records from other workspaces', () => {
  const csv = exportOrders(orders, { workspaceId: 'ws1', status: 'paid' });
  const lines = csv.split('\n');
  // Only 1 data row expected (ws1-a); ws2-a and ws2-b must not appear
  assert.equal(lines.length, 2, `Expected header + 1 row, got:\n${csv}`);
  assert.ok(!csv.includes('ws2-a'), 'ws2-a should not appear in ws1 export');
  assert.ok(!csv.includes('ws2-b'), 'ws2-b should not appear in ws1 export');
  assert.ok(csv.includes('ws1-a'), 'ws1-a should appear in ws1 export');
});

test('R1: export for unknown workspace returns header only', () => {
  const csv = exportOrders(orders, { workspaceId: 'unknown' });
  assert.equal(csv, 'id,status,total');
});
