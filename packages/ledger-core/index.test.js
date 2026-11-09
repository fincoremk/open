import test from 'node:test';
import assert from 'node:assert/strict';
import { Ledger, validateEntry, verifyLog, toMinor, fromMinor, LedgerError } from './index.js';

const code = fn => { try { fn(); } catch (e) { return e instanceof LedgerError ? e.code : 'OTHER:' + e.message; } return 'NO_ERROR'; };

test('exact money', () => {
  assert.equal(toMinor('0.1') + toMinor('0.2'), toMinor('0.3'));
  assert.equal(fromMinor(toMinor('1250.5')), '1250.500');
  assert.equal(fromMinor(toMinor('19.9995')), '20.000');
  assert.equal(fromMinor(toMinor('-3.25', 2), 2), '-3.25');
});

test('entry validation codes', () => {
  assert.equal(code(() => validateEntry({ date: '2026-11-03', lines: [{ account: '1101', debit: 10 }] })), 'E_LINES');
  assert.equal(code(() => validateEntry({ date: '2026-13-03', lines: [{ account: 'a', debit: 1 }, { account: 'b', credit: 1 }] })), 'E_DATE');
  assert.equal(code(() => validateEntry({ date: '2026-11-03', lines: [{ account: 'a', debit: 10 }, { account: 'b', credit: 9.999 }] })), 'E_BALANCE');
  assert.equal(code(() => validateEntry({ date: '2026-11-03', lines: [{ account: 'a', debit: 5, credit: 5 }, { account: 'b', credit: 0 }] })), 'E_SIDE');
  assert.equal(code(() => validateEntry({ date: '2026-11-03', lines: [{ account: 'a', debit: -5 }, { account: 'b', credit: -5 }] })), 'E_SIGN');
  assert.equal(code(() => validateEntry({ date: '2026-11-03', lines: [{ account: 'x', debit: 5 }, { account: 'b', credit: 5 }] }, { accounts: new Set(['b']) })), 'E_ACCOUNT');
});

test('posting, reversal, trial balance', () => {
  const L = new Ledger();
  const s = L.post({ date: '2026-11-01', memo: 'cash sale', lines: [{ account: '1101', debit: '1250.500' }, { account: '4101', credit: '1250.500' }] });
  assert.ok(Object.isFrozen(s) && Object.isFrozen(s.lines[0]), 'posted entries are immutable');
  L.post({ date: '2026-11-02', lines: [{ account: '5101', debit: 300 }, { account: '1101', credit: 300 }] });
  const r = L.reverse(2, '2026-11-03', 'wrong account');
  assert.equal(r.reverses, 2);
  assert.equal(code(() => L.reverse(2, '2026-11-03')), 'E_REVERSED');
  const tb = L.trialBalance();
  assert.equal(tb.debit, tb.credit);
  assert.deepEqual(tb.rows.map(x => [x.account, fromMinor(x.debit), fromMinor(x.credit)]), [['1101', '1250.500', '0.000'], ['4101', '0.000', '1250.500']]);
});

test('period lock', () => {
  const L = new Ledger();
  L.closeThrough('2026-10-31');
  assert.equal(code(() => L.post({ date: '2026-10-31', lines: [{ account: 'a', debit: 1 }, { account: 'b', credit: 1 }] })), 'E_LOCK');
  assert.equal(code(() => L.closeThrough('2026-09-30')), 'E_LOCK');
  assert.equal(code(() => L.post({ date: '2026-11-01', lines: [{ account: 'a', debit: 1 }, { account: 'b', credit: 1 }] })), 'NO_ERROR');
});

test('tamper-evident audit log', () => {
  const L = new Ledger();
  for (let i = 1; i <= 50; i++) L.post({ date: '2026-11-03', lines: [{ account: '1101', debit: i }, { account: '4101', credit: i }] });
  assert.equal(verifyLog(L.log).ok, true);
  assert.equal(verifyLog(JSON.parse(L.exportLog())).ok, true, 'exported log verifies');
  const copy = JSON.parse(L.exportLog());
  copy[20].payload.entry.lines[0].debit = '999';               // someone edits an old amount in the database
  assert.deepEqual(verifyLog(copy), { ok: false, at: 21, reason: 'record altered' });
  const cut = JSON.parse(L.exportLog()); cut.splice(10, 1); // someone deletes a record
  assert.equal(verifyLog(cut).ok, false);
});

test('property: random balanced books always balance', () => {
  let seed = 42; const rnd = () => (seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31;
  const L = new Ledger(), acc = ['1101', '1201', '2101', '3101', '4101', '5101'];
  for (let i = 0; i < 2000; i++) {
    const n = 2 + Math.floor(rnd() * 4), amt = Math.floor(rnd() * 1e9) / 1000, lines = [];
    let left = toMinor(amt.toFixed(3));
    for (let k = 0; k < n - 1; k++) { const part = left / 2n; lines.push({ account: acc[Math.floor(rnd() * 6)], debit: fromMinor(part) }); left -= part; }
    lines.push({ account: acc[Math.floor(rnd() * 6)], debit: fromMinor(left) });
    lines.push({ account: acc[Math.floor(rnd() * 6)], credit: amt.toFixed(3) });
    if (lines.some(l => l.debit === '0.000')) continue;
    L.post({ date: '2026-11-03', lines });
  }
  const tb = L.trialBalance();
  assert.equal(tb.debit, tb.credit);
  assert.equal(verifyLog(L.log).ok, true);
});
