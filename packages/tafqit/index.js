// @fincoremk/tafqit — Arabic amount-in-words (التفقيط) for invoices, receipts and cheques.
// Extracted and hardened from the FINCOREMK accounting engine. Zero dependencies. MIT.
//
//   tafqit(1250.5, { currency: 'KWD' })
//   → 'فقط ألف ومائتان وخمسون دينارًا كويتيًا وخمسمائة فلس لا غير'
//
// Works on integers in minor units internally (no floating-point drift): 0.1 + 0.2 never becomes 0.30000000000000004 fils.

const ONES = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة', 'عشرة',
  'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'];
const ONES_F = ['', 'واحدة', 'اثنتان', 'ثلاث', 'أربع', 'خمس', 'ست', 'سبع', 'ثماني', 'تسع', 'عشر',
  'إحدى عشرة', 'اثنتا عشرة', 'ثلاث عشرة', 'أربع عشرة', 'خمس عشرة', 'ست عشرة', 'سبع عشرة', 'ثماني عشرة', 'تسع عشرة'];
const TENS = ['', '', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
const HUNDREDS = ['', 'مائة', 'مائتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة'];

// [singular, dual, plural (3–10), accusative tamyeez (11–99)]
const SCALES = [
  null,
  ['ألف', 'ألفان', 'آلاف', 'ألفًا'],
  ['مليون', 'مليونان', 'ملايين', 'مليونًا'],
  ['مليار', 'ملياران', 'مليارات', 'مليارًا'],
  ['تريليون', 'تريليونان', 'تريليونات', 'تريليونًا'],
];

/** Currency presets. Add your own with the same shape. `fem` = the noun is feminine (affects numbers 1–19). */
export const CURRENCIES = {
  KWD: { decimals: 3, main: ['دينار كويتي', 'ديناران كويتيان', 'دنانير كويتية', 'دينارًا كويتيًا'], sub: ['فلس', 'فلسان', 'فلوس', 'فلسًا'] },
  SAR: { decimals: 2, main: ['ريال سعودي', 'ريالان سعوديان', 'ريالات سعودية', 'ريالًا سعوديًا'], sub: ['هللة', 'هللتان', 'هللات', 'هللة'], subFem: true },
  AED: { decimals: 2, main: ['درهم إماراتي', 'درهمان إماراتيان', 'دراهم إماراتية', 'درهمًا إماراتيًا'], sub: ['فلس', 'فلسان', 'فلوس', 'فلسًا'] },
  QAR: { decimals: 2, main: ['ريال قطري', 'ريالان قطريان', 'ريالات قطرية', 'ريالًا قطريًا'], sub: ['درهم', 'درهمان', 'دراهم', 'درهمًا'] },
  BHD: { decimals: 3, main: ['دينار بحريني', 'ديناران بحرينيان', 'دنانير بحرينية', 'دينارًا بحرينيًا'], sub: ['فلس', 'فلسان', 'فلوس', 'فلسًا'] },
  OMR: { decimals: 3, main: ['ريال عماني', 'ريالان عمانيان', 'ريالات عمانية', 'ريالًا عمانيًا'], sub: ['بيسة', 'بيستان', 'بيسات', 'بيسة'], subFem: true },
  EGP: { decimals: 2, main: ['جنيه مصري', 'جنيهان مصريان', 'جنيهات مصرية', 'جنيهًا مصريًا'], sub: ['قرش', 'قرشان', 'قروش', 'قرشًا'] },
  JOD: { decimals: 3, main: ['دينار أردني', 'ديناران أردنيان', 'دنانير أردنية', 'دينارًا أردنيًا'], sub: ['فلس', 'فلسان', 'فلوس', 'فلسًا'] },
  USD: { decimals: 2, main: ['دولار أمريكي', 'دولاران أمريكيان', 'دولارات أمريكية', 'دولارًا أمريكيًا'], sub: ['سنت', 'سنتان', 'سنتات', 'سنتًا'] },
  EUR: { decimals: 2, main: ['يورو', 'يوروان', 'يوروهات', 'يورو'], sub: ['سنت', 'سنتان', 'سنتات', 'سنتًا'] },
};

/** 0–999 in words. `fem` switches 1–19 (and the units of 21–99) to the feminine form. */
function under1000(n, fem) {
  const h = Math.floor(n / 100), r = n % 100, parts = [];
  if (h) parts.push(HUNDREDS[h]);
  if (r) {
    const O = fem ? ONES_F : ONES;
    if (r < 20) parts.push(O[r]);
    else parts.push((r % 10 ? O[r % 10] + ' و' : '') + TENS[Math.floor(r / 10)]);
  }
  return parts.join(' و');
}

/** Picks the counted-noun form from Arabic number agreement rules. forms = [sing, dual, plural, accusative]. */
export function countedForm(n, forms) {
  const r = n % 100;
  if (n === 1) return forms[0];
  if (n === 2) return forms[1];
  if (r >= 3 && r <= 10) return forms[2];
  if (r >= 11 && r <= 99) return forms[3];
  return forms[0]; // 100, 1000, 102 …: genitive singular
}

/**
 * Integer → Arabic words (cardinal, no currency). Supports 0 … 999,999,999,999,999.
 * @param {number|bigint} value non-negative integer
 * @param {{fem?: boolean}} [opt]
 */
export function numberToWords(value, opt = {}) {
  let n = typeof value === 'bigint' ? value : BigInt(Math.trunc(Number(value)));
  if (n < 0n) throw new RangeError('numberToWords: negative values are not supported');
  if (n === 0n) return 'صفر';
  if (n >= 10n ** 15n) throw new RangeError('numberToWords: max is 999 trillion');
  const groups = [];
  while (n > 0n) { groups.push(Number(n % 1000n)); n /= 1000n; }
  const parts = [];
  for (let i = groups.length - 1; i >= 0; i--) {
    const g = groups[i];
    if (!g) continue;
    if (i === 0) { parts.push(under1000(g, opt.fem)); continue; }
    const S = SCALES[i];
    if (g === 1) parts.push(S[0]);
    else if (g === 2) parts.push(S[1]);
    else parts.push(under1000(g, false) + ' ' + countedForm(g, S));
  }
  return parts.join(' و');
}

function toMinor(amount, decimals) {
  if (typeof amount === 'bigint') return amount * 10n ** BigInt(decimals);
  const s = String(amount).trim();
  if (!/^-?\d+(\.\d+)?$/.test(s)) throw new TypeError('tafqit: amount must be a plain decimal number, got ' + JSON.stringify(amount));
  const neg = s.startsWith('-'), [w, f = ''] = s.replace('-', '').split('.');
  // round half-up on the first dropped digit, in integer arithmetic
  const keep = (f + '0'.repeat(decimals)).slice(0, decimals), next = Number((f + '0'.repeat(decimals + 1))[decimals] || 0);
  let minor = BigInt(w) * 10n ** BigInt(decimals) + BigInt(keep || '0') + (next >= 5 ? 1n : 0n);
  return neg ? -minor : minor;
}

/**
 * Amount → «فقط … لا غير».
 * @param {number|string|bigint} amount  decimal amount (strings avoid float issues: '1250.500')
 * @param {{currency?: string|object, prefix?: string, suffix?: string}} [opt]
 */
export function tafqit(amount, opt = {}) {
  const cur = typeof opt.currency === 'object' ? opt.currency : CURRENCIES[opt.currency || 'KWD'];
  if (!cur) throw new RangeError('tafqit: unknown currency ' + opt.currency);
  const minor = toMinor(amount, cur.decimals);
  if (minor < 0n) throw new RangeError('tafqit: negative amounts are not supported');
  const base = 10n ** BigInt(cur.decimals), whole = minor / base, frac = Number(minor % base);
  const wNum = Number(whole % 1000n), parts = [];
  if (whole > 0n || frac === 0) {
    const words = whole === 1n ? null : whole === 2n ? null : numberToWords(whole, { fem: cur.mainFem });
    const noun = whole === 0n ? cur.main[0] : whole > 999n && wNum === 0 ? cur.main[0] : countedForm(Number(whole > 999n ? (wNum || 1000) : whole), cur.main);
    parts.push(words ? words + ' ' + noun : noun);
  }
  if (frac) {
    const words = frac === 1 || frac === 2 ? null : numberToWords(frac, { fem: cur.subFem });
    parts.push(words ? words + ' ' + countedForm(frac, cur.sub) : countedForm(frac, cur.sub));
  }
  const pre = opt.prefix ?? 'فقط', suf = opt.suffix ?? 'لا غير';
  return [pre, parts.join(' و'), suf].filter(Boolean).join(' ');
}

export default tafqit;
