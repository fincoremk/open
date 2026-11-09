# Contributing · المساهمة

- Every change needs a test. Run `npm test` at the root — all packages must pass on Node 18, 20 and 22.
- No runtime dependencies. Keep each package small enough to audit in one sitting.
- Money is always integer minor units (BigInt). Floats are not accepted in accounting code.
- Legal parameters (labour law, tax) are data with a clear "verify against your country's law" note — never hard-coded truths.

- أي تعديل لازم يكون معاه اختبار، و`npm test` لازم ينجح على Node 18 و20 و22.
- مفيش أي مكتبات خارجية وقت التشغيل.
- الفلوس دايمًا أعداد صحيحة بالوحدة الصغرى (BigInt)، من غير كسور عشرية.
- أي إعداد قانوني بيتكتب كبيانات، ومعاه ملاحظة «تُضبط حسب قانون دولتك».
