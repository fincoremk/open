# @fincoremk/tafqit — التفقيط

Arabic amount-in-words for invoices, receipts and cheques.
كتابة المبلغ بالحروف العربية للفواتير والإيصالات والشيكات.

```js
import tafqit from '@fincoremk/tafqit';

tafqit('1250.500', { currency: 'KWD' });
// 'فقط ألف ومائتان وخمسون دينارًا كويتيًا وخمسمائة فلس لا غير'
tafqit('10.12', { currency: 'SAR' });
// 'فقط عشرة ريالات سعودية واثنتا عشرة هللة لا غير'
```

- KWD, SAR, AED, QAR, BHD, OMR, EGP, JOD, USD, EUR — or pass your own `{ decimals, main, sub }`.
- Counted-noun agreement (مفرد/مثنى/جمع/تمييز) and feminine sub-units (هللة، بيسة).
- Integer minor-unit arithmetic: `0.1 + 0.2` is thirty cents, not `0.30000000000000004`.
- Up to 999 trillion. Clear errors for malformed input (`'12,5'`) and negatives.

MIT · zero dependencies.
