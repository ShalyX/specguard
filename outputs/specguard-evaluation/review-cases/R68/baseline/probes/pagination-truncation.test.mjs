// Probe: exportOrders silently truncates when the query carries pagination (limit/offset).
// Per R1/R2: export should cover all workspace records matching the filter,
// not just the current page window.
import test from 'node:test';
import assert from 'node:assert/strict';
import { exportOrders } from '../src/orders.ts';

// Build 25 paid orders for workspace 'a'
const orders = Array.from({ length: 25 }, (_, i) => ({
  id: `order-${i + 1}`,
  workspaceId: 'a',
  status: 'paid',
  total: i + 1,
}));

test('exportOrders without limit returns all 25 matching rows', () => {
  const csv = exportOrders(orders, { workspaceId: 'a', status: 'paid' });
  const lines = csv.split('\n');
  // 1 header + 25 data rows
  assert.equal(
    lines.length,
    26,
    `Expected 26 lines (header + 25 rows) but got ${lines.length}. ` +
    `exportOrders is silently applying the default limit of 20.`
  );
});

test('exportOrders with explicit limit=5 returns only 5 rows (documents pagination leak)', () => {
  const csv = exportOrders(orders, { workspaceId: 'a', status: 'paid', limit: 5 });
  const lines = csv.split('\n');
  // This test documents the bug: a caller passing a paginated Query gets a truncated export.
  assert.equal(
    lines.length,
    6, // 1 header + 5 rows
    `With limit:5, expected 6 lines but got ${lines.length}.`
  );
});

test('exportOrders with offset=10 skips first 10 records (documents pagination leak)', () => {
  const csv = exportOrders(orders, { workspaceId: 'a', status: 'paid', offset: 10 });
  const lines = csv.split('\n');
  // Default limit 20 applies; offset=10 means records 11-25 (15 rows) are returned,
  // but actually min(20, 25-10)=15 rows. Confirm skipping occurred.
  const firstDataLine = lines[1];
  assert.ok(
    firstDataLine.includes('order-11'),
    `With offset:10, first data row should be order-11 but got: ${firstDataLine}`
  );
});
