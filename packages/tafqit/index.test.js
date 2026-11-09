import test from 'node:test';
import assert from 'node:assert/strict';
import { tafqit, numberToWords, countedForm } from './index.js';

test('cardinals', () => {
  assert.equal(numberToWords(0), 'صفر');
  assert.equal(numberToWords(11), 'أحد عشر');
  assert.equal(numberToWords(21), 'واحد وعشرون');
  assert.equal(numberToWords(105), 'مائة وخمسة');
  assert.equal(numberToWords(1000), 'ألف');
  assert.equal(numberToWords(2000), 'ألفان');
  assert.equal(numberToWords(3000), 'ثلاثة آلاف');
  assert.equal(numberToWords(11000), 'أحد عشر ألفًا');
  assert.equal(numberToWords(250000), 'مائتان وخمسون ألفًا');
  assert.equal(numberToWords(1000000), 'مليون');
  assert.equal(numberToWords(7_500_000_000), 'سبعة مليارات وخمسمائة مليون');
  assert.equal(numberToWords(12, { fem: true }), 'اثنتا عشرة');
});

test('counted noun agreement', () => {
  const F = ['دينار', 'ديناران', 'دنانير', 'دينارًا'];
  assert.deepEqual([1, 2, 3, 10, 11, 99, 100, 103, 111].map(n => countedForm(n, F)),
    ['دينار', 'ديناران', 'دنانير', 'دنانير', 'دينارًا', 'دينارًا', 'دينار', 'دنانير', 'دينارًا']);
});

test('KWD invoice amounts', () => {
  assert.equal(tafqit('1250.500', { currency: 'KWD' }), 'فقط ألف ومائتان وخمسون دينارًا كويتيًا وخمسمائة فلس لا غير');
  assert.equal(tafqit(1, { currency: 'KWD' }), 'فقط دينار كويتي لا غير');
  assert.equal(tafqit(2, { currency: 'KWD' }), 'فقط ديناران كويتيان لا غير');
  assert.equal(tafqit(5, { currency: 'KWD' }), 'فقط خمسة دنانير كويتية لا غير');
  assert.equal(tafqit('0.250', { currency: 'KWD' }), 'فقط مائتان وخمسون فلسًا لا غير');
  assert.equal(tafqit(0), 'فقط صفر دينار كويتي لا غير');
});

test('feminine sub-unit (SAR halala)', () => {
  assert.equal(tafqit('10.12', { currency: 'SAR' }), 'فقط عشرة ريالات سعودية واثنتا عشرة هللة لا غير');
});

test('no floating-point drift', () => {
  assert.equal(tafqit(0.1 + 0.2, { currency: 'USD' }), 'فقط ثلاثون سنتًا لا غير');
  assert.equal(tafqit('19.995', { currency: 'USD' }), 'فقط عشرون دولارًا أمريكيًا لا غير');
});

test('rejects bad input', () => {
  assert.throws(() => tafqit('12,5'), TypeError);
  assert.throws(() => tafqit(-3), RangeError);
  assert.throws(() => tafqit(5, { currency: 'XXX' }), RangeError);
});
