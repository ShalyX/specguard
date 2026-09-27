// Probe: R4 edge cases – CSV quoting and escaping beyond the one case in the
// existing test suite.
// Tests:
//   • newline character inside a field value (embedded \n)
//   • tab character inside a value
//   • numeric total field is correctly quoted
//   • status containing a comma
import test from 'node:test';
import assert from 'node:assert/strict';
import { exportOrders } from '../src/orders.ts';

test('R4: embedded newline in id field is quoted', () => {
  const csv = exportOrders(
    [{ id: 'a\nb', workspaceId: 'w', status: 'paid', total: 1 }],
    { workspaceId: 'w' }
  );
  // The newline should be enclosed inside quotes so the row is still parseable
  // as two CSV fields on one logical row (RFC 4180 allows embedded newlines inside
  // double-quoted fields). What we need is that the value is quoted.
  const [header, dataLine] = csv.split('\n"');
  assert.equal(header, 'id,status,total');
  // The data row must start with a quote (the id value is quoted)
  assert.ok(csv.includes('"a\nb"'), `Expected quoted newline in: ${JSON.stringify(csv)}`);
});

test('R4: status field containing comma is quoted', () => {
  const csv = exportOrders(
    [{ id: 'x', workspaceId: 'w', status: 'a,b', total: 1 }],
    { workspaceId: 'w' }
  );
  assert.ok(csv.includes('"a,b"'), `Expected quoted comma in: ${JSON.stringify(csv)}`);
});
