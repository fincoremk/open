# @fincoremk/eosb — مكافأة نهاية الخدمة

End-of-service benefit calculator where the **rules are data**: tiers, daily-wage divisor, cap, resignation shares.
حاسبة مكافأة نهاية الخدمة، والقواعد فيها **بيانات** تقدر تعدّلها.

```js
import eosb from '@fincoremk/eosb';
eosb({ wage: 520, start: '2016-01-01', end: '2025-12-28', reason: 'termination', rules: 'kw-private' });
// { years: 10, awardDays: 205, dailyWage: 20, amount: 4100, breakdown: [...] }
```

> ⚠️ The included preset is an **example** modelled on the Kuwaiti private sector. Labour law changes and differs by country and contract — **verify every parameter against your country's law · تُضبط حسب قانون دولتك.** This package is a calculator, not legal advice.

Pass your own `rules` object to model any jurisdiction or company policy. MIT · zero dependencies.
