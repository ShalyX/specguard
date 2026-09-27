import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeReference, normalizeReview, reviewDisposition, validateReview } from '../lib/review-contract.mjs';

const fixture = status => ({
  caseId: 'R1',
  requirements: [{
    id: 'R1',
    requirement: 'Keep records scoped.',
    status,
    codeReferences: ['src/orders.ts:8'],
    evidenceFiles: ['review-results/run.json'],
    observation: 'Observed.',
    humanQuestion: status === 'needs-decision' ? 'Which behavior is intended?' : null
  }],
  findings: [],
  unassessed: []
});

test('normalizes both object shapes emitted by Bob', () => {
  assert.equal(normalizeReference({ path: 'src/orders.ts', lines: '7-10' }), 'src/orders.ts:7-10');
  assert.equal(normalizeReference({ file: 'src/orders.ts', line: 8 }), 'src/orders.ts:8');
});

test('normalization makes observed Bob output viewer-compatible', () => {
  const input = fixture('supported');
  input.requirements[0].codeReferences = [{ path: 'src/orders.ts', lines: '8' }];
  const normalized = normalizeReview(input);
  assert.deepEqual(normalized.requirements[0].codeReferences, ['src/orders.ts:8']);
  assert.deepEqual(validateReview(normalized), []);
});

test('rejects traversal and absolute references', () => {
  for (const reference of ['../src.ts:1', '/src.ts:1', 'C:\\repo\\src.ts:1']) {
    const input = fixture('supported');
    input.requirements[0].codeReferences = [reference];
    assert.ok(validateReview(input).length > 0);
  }
});

test('requires a human question for unresolved intent', () => {
  const input = fixture('needs-decision');
  input.requirements[0].humanQuestion = null;
  assert.match(validateReview(input).join('\n'), /humanQuestion/);
});

test('derives merge disposition from requirement states', () => {
  assert.equal(reviewDisposition(fixture('supported')), 'ready');
  assert.equal(reviewDisposition(fixture('contradicted')), 'blocked');
  assert.equal(reviewDisposition(fixture('needs-decision')), 'decision');
  assert.equal(reviewDisposition(fixture('unassessed')), 'incomplete');
});
