// Probe: verify R1 — exportOrders must scope to active workspace only
import test from 'node:test';
import assert from 'node:assert/strict';
import { exportOrders } from '../src/orders.ts';

const orders = [
  { id: 'a1', workspaceId: 'ws-A', status: 'paid', total: 10 },
  { id: 'b1', workspaceId: 'ws-B', status: 'paid', total: 99 },
];

test('R1: exportOrders excludes records from other workspaces', () => {
  const csv = exportOrders(orders, { workspaceId: 'ws-A' });
  // Should only contain the ws-A row; ws-B row must NOT appear
  assert.ok(!csv.includes('b1'), `ws-B record "b1" leaked into ws-A export:\n${csv}`);
  assert.ok(!csv.includes('99'),  `ws-B total "99" leaked into ws-A export:\n${csv}`);
  assert.ok(csv.includes('a1'),   `ws-A record "a1" missing from export:\n${csv}`);
});

test('R1+R2: exportOrders with status filter excludes other-workspace records', () => {
  const csv = exportOrders(orders, { workspaceId: 'ws-A', status: 'paid' });
  assert.ok(!csv.includes('b1'), `ws-B record "b1" leaked into ws-A status-filtered export:\n${csv}`);
});

test('R2: exportOrders ignores pagination offset/limit', () => {
  // With offset=1, limit=1 the listOrders paginator would skip a1; export must ignore pagination
  const csv = exportOrders(orders, { workspaceId: 'ws-A', offset: 1, limit: 1 });
  assert.ok(csv.includes('a1'), `exportOrders must return all matching records, ignoring pagination offset:\n${csv}`);
});
