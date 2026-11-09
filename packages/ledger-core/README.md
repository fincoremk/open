# @fincoremk/ledger-core

Double-entry accounting rules as a small, auditable library — the same rules the FINCOREMK engine enforces.
قواعد القيد المزدوج في مكتبة صغيرة تتراجع بسهولة، وهي نفس القواعد اللي محرك FINCOREMK بيطبّقها.

```js
import { Ledger, verifyLog, fromMinor } from '@fincoremk/ledger-core';

const books = new Ledger({ decimals: 3 });               // KWD → 3 decimals
books.post({ date: '2026-11-01', memo: 'cash sale',
  lines: [{ account: '1101', debit: '1250.500' }, { account: '4101', credit: '1250.500' }] });

books.reverse(1, '2026-11-03', 'wrong customer');        // corrections are new entries, never edits
books.closeThrough('2026-10-31');                        // nothing can be posted into a closed period

const tb = books.trialBalance();                         // { rows, debit, credit } — always equal
verifyLog(JSON.parse(books.exportLog()));                // { ok: true, head: '…' }
```

| Rule | Error code |
|---|---|
| At least two lines, each one-sided and positive | `E_LINES`, `E_SIDE`, `E_SIGN` |
| Σ debit = Σ credit, to the last fils | `E_BALANCE` |
| Only known posting accounts (optional) | `E_ACCOUNT` |
| No posting into a closed period; locks only move forward | `E_LOCK` |
| An entry can be reversed once | `E_REVERSED` |

**Tamper evidence.** Every post, reversal and period close appends `{ seq, prev, payload, hash }`, where `hash = SHA-256(seq, prev, payload)`.
Editing an old amount, deleting a record or reordering records breaks the chain, and `verifyLog` reports the exact position.

**الكشف عن التلاعب:** كل ترحيل أو قيد عكسي أو قفل فترة بيتسجّل ومعاه بصمة SHA-256 للسجل اللي قبله. أي تعديل في مبلغ قديم أو مسح سجل بيكسر السلسلة، و`verifyLog` بيحدد مكانه بالظبط.

Tests include a property test that posts 2,000 random balanced entries and checks the trial balance and the chain.
MIT · zero dependencies · Node ≥ 18.
