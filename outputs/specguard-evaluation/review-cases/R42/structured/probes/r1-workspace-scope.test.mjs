// Probe: R1 — exportOrders must only export records belonging to the active workspace.
// If workspaceId filtering is absent, orders from workspace 'b' will appear in the output
// for workspace 'a', causing this test to fail.
import test from 'node:test';
import assert from 'node:assert/strict';
import { exportOrders } from '../src/orders.ts';

test('R1: exportOrders excludes orders from other workspaces', () => {
  const orders = [
    { id: 'a1', workspaceId: 'a', status: 'paid', total: 10 },
    { id: 'b1', workspaceId: 'b', status: 'paid', total: 99 }, // different workspace
  ];
  const csv = exportOrders(orders, { workspaceId: 'a' });
  // Only a1 should appear; b1 must not be present.
  assert.equal(csv, 'id,status,total\n"a1","paid","10"',
    'exportOrders must filter by workspaceId; b1 (workspace b) must not appear in workspace a export');
});

test('R1: exportOrders with status filter still excludes other workspaces', () => {
  const orders = [
    { id: 'a1', workspaceId: 'a', status: 'paid', total: 5 },
    { id: 'b1', workspaceId: 'b', status: 'paid', total: 7 }, // same status, different workspace
  ];
  const csv = exportOrders(orders, { workspaceId: 'a', status: 'paid' });
  assert.equal(csv, 'id,status,total\n"a1","paid","5"',
    'status-filtered export must still be scoped to workspaceId');
});
