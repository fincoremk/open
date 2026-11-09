// @fincoremk/ledger-core — the double-entry rules FINCOREMK enforces, as a small, auditable library.
// MIT. Zero dependencies. Node ≥ 18 (uses node:crypto for SHA-256).
//
// Design rules (the same ones the FINCOREMK engine follows):
//   1. Money is an integer count of minor units (BigInt). No floats, ever.
//   2. A journal entry is valid only if Σ debit = Σ credit, every line is one-sided and positive, and it has ≥ 2 lines.
//   3. Posted entries are never edited or deleted. A mistake is corrected by a reversing entry dated today.
//   4. A closed period is locked: nothing can be posted into it.
//   5. Every posting is appended to a hash-chained audit log; changing any past record breaks the chain and is detected.

import { createHash } from 'node:crypto';

export class LedgerError extends Error {
  constructor(code, message) { super(message); this.name = 'LedgerError'; this.code = code; }
}

/** Parse a decimal string/number into BigInt minor units with exact half-up rounding. */
export function toMinor(amount, decimals = 3) {
  if (typeof amount === 'bigint') return amount;
  const s = String(amount).trim();
  if (!/^-?\d+(\.\d+)?$/.test(s)) throw new LedgerError('E_AMOUNT', 'amount must be a plain decimal: ' + JSON.stringify(amount));
  const neg = s[0] === '-', [w, f = ''] = s.replace('-', '').split('.');
  const pad = f + '0'.repeat(decimals + 1);
  let v = BigInt(w) * 10n ** BigInt(decimals) + BigInt(pad.slice(0, decimals) || '0') + (Number(pad[decimals]) >= 5 ? 1n : 0n);
  return neg ? -v : v;
}

/** BigInt minor units → fixed decimal string. */
export function fromMinor(v, decimals = 3) {
  const neg = v < 0n, a = neg ? -v : v, base = 10n ** BigInt(decimals);
  const s = (a / base).toString() + (decimals ? '.' + (a % base).toString().padStart(decimals, '0') : '');
  return neg ? '-' + s : s;
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Validate a journal entry. Throws LedgerError with a stable code; returns a normalised copy with BigInt amounts.
 * entry = { date: 'YYYY-MM-DD', memo?, lines: [{ account, debit?, credit? }] }
 */
export function validateEntry(entry, { decimals = 3, accounts } = {}) {
  if (!entry || typeof entry !== 'object') throw new LedgerError('E_ENTRY', 'entry must be an object');
  if (!DATE.test(String(entry.date)) || isNaN(Date.parse(entry.date + 'T00:00:00Z'))) throw new LedgerError('E_DATE', 'invalid date');
  if (!Array.isArray(entry.lines) || entry.lines.length < 2) throw new LedgerError('E_LINES', 'an entry needs at least two lines');
  let dr = 0n, cr = 0n;
  const lines = entry.lines.map((l, i) => {
    const account = String(l.account ?? '').trim();
    if (!account) throw new LedgerError('E_ACCOUNT', `line ${i + 1}: account is required`);
    if (accounts && !accounts.has(account)) throw new LedgerError('E_ACCOUNT', `line ${i + 1}: unknown or non-posting account ${account}`);
    const d = l.debit == null || l.debit === '' ? 0n : toMinor(l.debit, decimals);
    const c = l.credit == null || l.credit === '' ? 0n : toMinor(l.credit, decimals);
    if (d < 0n || c < 0n) throw new LedgerError('E_SIGN', `line ${i + 1}: amounts must be positive`);
    if ((d > 0n) === (c > 0n)) throw new LedgerError('E_SIDE', `line ${i + 1}: exactly one of debit/credit must be set`);
    dr += d; cr += c;
    return { account, debit: d, credit: c };
  });
  if (dr !== cr) throw new LedgerError('E_BALANCE', `entry is not balanced: debit ${fromMinor(dr, decimals)} ≠ credit ${fromMinor(cr, decimals)}`);
  return { date: entry.date, memo: String(entry.memo ?? ''), lines, total: dr };
}

function canon(rec) {
  // stable, BigInt-safe serialisation used for hashing
  return JSON.stringify(rec, (k, v) => (typeof v === 'bigint' ? v.toString() : v));
}
const sha256 = s => createHash('sha256').update(s).digest('hex');
export const GENESIS = '0'.repeat(64);

/** An append-only ledger with period locks and a tamper-evident hash chain. */
export class Ledger {
  constructor({ decimals = 3, accounts } = {}) {
    this.decimals = decimals;
    this.accounts = accounts ? new Set(accounts) : null;
    this.entries = [];   // posted entries (never mutated)
    this.log = [];       // hash-chained audit records
    this.lockedThrough = null; // 'YYYY-MM-DD' — everything on/before is closed
  }

  /** Close every period up to and including `date`. Locks only move forward. */
  closeThrough(date) {
    if (!DATE.test(date)) throw new LedgerError('E_DATE', 'invalid date');
    if (this.lockedThrough && date < this.lockedThrough) throw new LedgerError('E_LOCK', 'cannot reopen a closed period');
    this.lockedThrough = date;
    this.#append({ type: 'close', through: date });
  }

  post(entry) {
    const e = validateEntry(entry, { decimals: this.decimals, accounts: this.accounts });
    if (this.lockedThrough && e.date <= this.lockedThrough) throw new LedgerError('E_LOCK', `period closed through ${this.lockedThrough}`);
    const posted = Object.freeze({ no: this.entries.length + 1, ...e, lines: Object.freeze(e.lines.map(l => Object.freeze(l))) });
    this.entries.push(posted);
    this.#append({ type: 'post', no: posted.no, entry: posted });
    return posted;
  }

  /** Correct a posted entry the auditable way: a mirror entry on `date`, never an edit. */
  reverse(no, date, reason = '') {
    const orig = this.entries.find(x => x.no === no);
    if (!orig) throw new LedgerError('E_NOT_FOUND', 'no such entry ' + no);
    if (this.entries.some(x => x.reverses === no)) throw new LedgerError('E_REVERSED', 'entry already reversed');
    const lines = orig.lines.map(l => ({ account: l.account, debit: l.credit, credit: l.debit }));
    const e = validateEntry({ date, memo: `reversal of #${no}${reason ? ' — ' + reason : ''}`, lines }, { decimals: this.decimals });
    if (this.lockedThrough && e.date <= this.lockedThrough) throw new LedgerError('E_LOCK', `period closed through ${this.lockedThrough}`);
    const posted = Object.freeze({ no: this.entries.length + 1, ...e, reverses: no });
    this.entries.push(posted);
    this.#append({ type: 'reverse', no: posted.no, reverses: no, entry: posted });
    return posted;
  }

  /** Σ per account (debit − credit) as BigInt, optionally up to a date. */
  balances(upTo) {
    const b = new Map();
    for (const e of this.entries) if (!upTo || e.date <= upTo) for (const l of e.lines) b.set(l.account, (b.get(l.account) ?? 0n) + l.debit - l.credit);
    return b;
  }

  /** Trial balance. Its two totals are equal by construction; we still check, because that is what auditors do. */
  trialBalance(upTo) {
    let dr = 0n, cr = 0n; const rows = [];
    for (const [account, v] of [...this.balances(upTo)].sort((a, b) => a[0].localeCompare(b[0]))) {
      if (v === 0n) continue;
      const row = { account, debit: v > 0n ? v : 0n, credit: v < 0n ? -v : 0n };
      dr += row.debit; cr += row.credit; rows.push(row);
    }
    if (dr !== cr) throw new LedgerError('E_TB', 'trial balance does not balance — data is corrupted');
    return { rows, debit: dr, credit: cr };
  }

  /** Export the audit log as JSON (BigInt → string). The hashes stay valid: they are computed over this exact form. */
  exportLog() { return canon(this.log); }

  #append(payload) {
    const prev = this.log.length ? this.log[this.log.length - 1].hash : GENESIS;
    const rec = { seq: this.log.length + 1, prev, payload };
    this.log.push(Object.freeze({ ...rec, hash: sha256(canon(rec)) }));
  }
}

/**
 * Verify a hash-chained audit log (e.g. one exported from a database).
 * Returns { ok: true } or { ok: false, at: seq, reason }.
 */
export function verifyLog(log) {
  let prev = GENESIS;
  for (let i = 0; i < log.length; i++) {
    const r = log[i];
    if (r.seq !== i + 1) return { ok: false, at: i + 1, reason: 'sequence gap' };
    if (r.prev !== prev) return { ok: false, at: r.seq, reason: 'broken link' };
    if (sha256(canon({ seq: r.seq, prev: r.prev, payload: r.payload })) !== r.hash) return { ok: false, at: r.seq, reason: 'record altered' };
    prev = r.hash;
  }
  return { ok: true, head: prev };
}
