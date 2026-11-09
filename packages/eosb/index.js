// @fincoremk/eosb — end-of-service benefit (مكافأة نهاية الخدمة) calculator with the rules as data.
// MIT. Zero dependencies. The rule set is a parameter: presets are examples to start from —
// every legal rule must be checked against your country's law («تُضبط حسب قانون دولتك»).

/** Example preset modelled on the Kuwaiti private-sector rules (Law 6/2010). Verify before use. */
export const PRESETS = {
  'kw-private': {
    label: { ar: 'مثال: القطاع الأهلي الكويتي — تُضبط حسب قانون دولتك', en: 'Example: Kuwait private sector — verify against your country’s law' },
    tiers: [{ uptoYears: 5, daysPerYear: 15 }, { uptoYears: Infinity, daysPerYear: 26 }],
    dailyDivisor: 26,          // monthly wage ÷ 26 = daily wage
    capMonths: 18,             // award never exceeds 18 months of wage
    yearDays: 365,
    resignation: [{ belowYears: 3, share: 0 }, { belowYears: 5, share: 0.5 }, { belowYears: 10, share: 2 / 3 }],
  },
};

const DAY = 86400000;
const parse = d => { const t = Date.parse(String(d) + 'T00:00:00Z'); if (isNaN(t)) throw new RangeError('invalid date ' + d); return t; };

/**
 * @param {{wage:number, start:string, end:string, reason?:'termination'|'resignation', rules?:object|string}} input
 * @returns {{serviceDays:number, years:number, dailyWage:number, awardDays:number, gross:number, capped:number, capHit:boolean, share:number, amount:number, breakdown:object[]}}
 */
export function eosb({ wage, start, end, reason = 'termination', rules = 'kw-private' }) {
  const R = typeof rules === 'string' ? PRESETS[rules] : rules;
  if (!R) throw new RangeError('unknown rule set ' + rules);
  if (!(wage >= 0)) throw new RangeError('wage must be ≥ 0');
  const a = parse(start), b = parse(end);
  if (b < a) throw new RangeError('end date is before start date');
  const serviceDays = Math.round((b - a) / DAY) + 1, years = serviceDays / R.yearDays, daily = wage / R.dailyDivisor;
  let from = 0, awardDays = 0; const breakdown = [];
  for (const t of R.tiers) {
    const span = Math.max(0, Math.min(years, t.uptoYears) - from);
    if (span > 0) { awardDays += span * t.daysPerYear; breakdown.push({ years: span, daysPerYear: t.daysPerYear, days: span * t.daysPerYear }); }
    from = t.uptoYears; if (years <= from) break;
  }
  const gross = awardDays * daily, cap = R.capMonths ? R.capMonths * wage : Infinity, capped = Math.min(gross, cap);
  let share = 1;
  if (reason === 'resignation') for (const s of R.resignation || []) if (years < s.belowYears) { share = s.share; break; }
  const round = v => Math.round(v * 1000) / 1000;
  return { serviceDays, years: round(years), dailyWage: round(daily), awardDays: round(awardDays), gross: round(gross), capped: round(capped), capHit: gross > cap, share, amount: round(capped * share), breakdown };
}
export default eosb;
