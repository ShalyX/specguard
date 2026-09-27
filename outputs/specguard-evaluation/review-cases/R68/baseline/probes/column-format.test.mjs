// Probe: total column quoting - numeric totals are exported as quoted strings.
// R4 requires values to be quoted, but this probe documents that numeric totals
// lose their numeric type on export (e.g. "10" not 10), which may cause downstream
// tooling (e.g. spreadsheets) to treat totals as text rather than numbers.
import test from 'node:test';
import assert from 'node:assert/strict';
import { exportOrders } from '../src/orders.ts';

test('total is serialized as a quoted string, not a bare number', () => {
  const csv = exportOrders(
    [{ id: 'o1', workspaceId: 'a', status: 'paid', total: 99.50 }],
    { workspaceId: 'a' }
  );
  const dataLine = csv.split('\n')[1];
  // Document actual behavior: total is quoted string "99.5"
  assert.ok(
    dataLine.endsWith('"99.5"'),
    `Expected total to be serialized as "99.5" (quoted string); got: ${dataLine}`
  );
  // And assert it is NOT serialized as bare number 99.5
  assert.ok(
    !dataLine.endsWith(',99.5'),
    'Total should be quoted, not a bare number (R4 requires all values quoted).'
  );
});

test('workspaceId is excluded from CSV output (documents column omission)', () => {
  const csv = exportOrders(
    [{ id: 'o1', workspaceId: 'ws-secret', status: 'paid', total: 1 }],
    { workspaceId: 'ws-secret' }
  );
  assert.ok(
    !csv.includes('workspaceId'),
    'workspaceId column is not present in export output (by design or oversight?)'
  );
  assert.ok(
    !csv.includes('ws-secret'),
    'workspaceId value is not exposed in export output'
  );
});
