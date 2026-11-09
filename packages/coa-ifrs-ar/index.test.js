import test from 'node:test';
import assert from 'node:assert/strict';
import chart, { tree, postable, find } from './index.js';

test('chart integrity', () => {
  const codes = new Set(chart.map(a => a.code));
  assert.equal(codes.size, chart.length, 'codes are unique');
  for (const a of chart) {
    assert.ok(a.ar && a.en, a.code + ' has both names');
    if (a.parent) { assert.ok(codes.has(a.parent), a.code + ' parent exists'); assert.ok(a.code.startsWith(a.parent), a.code + ' nests under its parent'); }
    assert.ok(['asset', 'liability', 'equity', 'revenue', 'expense'].includes(a.type));
  }
  assert.deepEqual(tree().map(r => r.code), ['1', '2', '3', '4', '5']);
  assert.ok(postable().length > 100);
  assert.equal(find('1101').en, 'Cash and cash equivalents');
});
