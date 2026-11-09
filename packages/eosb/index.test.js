import test from 'node:test';
import assert from 'node:assert/strict';
import { eosb } from './index.js';
const end = (start, days) => new Date(Date.parse(start + 'T00:00:00Z') + (days - 1) * 864e5).toISOString().slice(0, 10);

test('3 years, termination', () => {
  const r = eosb({ wage: 520, start: '2023-01-01', end: end('2023-01-01', 1095) }); // 1095 days = 3 years
  assert.equal(r.years, 3); assert.equal(r.awardDays, 45); assert.equal(r.dailyWage, 20); assert.equal(r.amount, 900);
});
test('two tiers', () => {
  const r = eosb({ wage: 520, start: '2016-01-01', end: end('2016-01-01', 3650) }); // 3650 days = 10 years
  assert.equal(r.years, 10); assert.equal(r.awardDays, 5 * 15 + 5 * 26); assert.equal(r.amount, 205 * 20);
});
test('cap at 18 months', () => {
  const r = eosb({ wage: 1000, start: '1990-01-01', end: '2025-12-31' });
  assert.equal(r.capHit, true); assert.equal(r.amount, 18000);
});
test('resignation shares', () => {
  const at = y => eosb({ wage: 520, start: '2000-01-01', end: new Date(Date.UTC(2000, 0, 1) + (y * 365 - 1) * 864e5).toISOString().slice(0, 10), reason: 'resignation' }).share;
  assert.equal(at(2), 0); assert.equal(at(4), 0.5); assert.equal(at(7), 2 / 3); assert.equal(at(12), 1);
});
test('custom rules', () => {
  const r = eosb({ wage: 3000, start: '2020-01-01', end: end('2020-01-01', 1825), rules: { tiers: [{ uptoYears: Infinity, daysPerYear: 21 }], dailyDivisor: 30, yearDays: 365 } });
  assert.equal(r.years, 5); assert.equal(r.amount, 105 * 100);
});
test('input checks', () => {
  assert.throws(() => eosb({ wage: 100, start: '2025-01-02', end: '2025-01-01' }), RangeError);
  assert.throws(() => eosb({ wage: -1, start: '2025-01-01', end: '2025-01-02' }), RangeError);
});
