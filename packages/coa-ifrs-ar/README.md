# @fincoremk/coa-ifrs-ar — دليل الحسابات

A bilingual Arabic/English chart of accounts (178 accounts) structured for IFRS statements — the seed chart FINCOREMK ships with.
دليل حسابات عربي/إنجليزي (178 حساب) مرتّب على قوائم IFRS، وهو نفس الدليل اللي FINCOREMK بيبدأ بيه.

```js
import chart, { tree, postable, find } from '@fincoremk/coa-ifrs-ar';
find('1101');   // { code: '1101', ar: 'النقد وما في حكمه', en: 'Cash and cash equivalents', type: 'asset', ... }
tree();         // 1 Assets · 2 Liabilities · 3 Equity · 4 Revenue · 5 Expenses
postable();     // leaf accounts only — the ones journal lines may use
```

Codes nest by prefix (`1` → `11` → `1101` → `110101`). Each account carries `type`, and where relevant its statement (`statement`) and cash-flow (`cashflow`) mapping.
Adapt it to your entity; local regulatory charts may require changes.

MIT.
