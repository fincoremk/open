<div align="center">

<img src="https://fincoremk.com/icons/logo-m230.webp" width="96" alt="FINCOREMK">

# FINCOREMK · Open

**Open-source building blocks from FINCOREMK — Arabic-first accounting & ERP, built in Kuwait for businesses everywhere.**

**مكوّنات مفتوحة المصدر من FINCOREMK — أنظمة محاسبة وERP عربية أولًا، اتبنت في الكويت للشركات في كل مكان.**

[fincoremk.com](https://fincoremk.com) · [How we build FINCOREMK](https://fincoremk.com/engineering/) · [Security](SECURITY.md)

</div>

---

## Packages · الحزم

| Package | What it does | الوظيفة |
|---|---|---|
| [`@fincoremk/ledger-core`](packages/ledger-core) | Double-entry rules: exact BigInt money, balanced entries, reversing corrections, period locks, **tamper-evident hash-chained audit log** | قواعد القيد المزدوج: فلوس دقيقة بالـ BigInt، قيود متوازنة، تصحيح بقيد عكسي، قفل الفترات، **سجل تدقيق مسلسل بالـ hash يكشف أي تلاعب** |
| [`@fincoremk/secure-box`](packages/secure-box) | PBKDF2-SHA256 password hashing (600k iterations) and AES-256-GCM authenticated encryption on Web Crypto | تجزئة كلمات السر PBKDF2-SHA256 (600 ألف دورة) وتشفير AES-256-GCM مُوثَّق |
| [`@fincoremk/tafqit`](packages/tafqit) | Arabic amount-in-words for invoices and cheques — 10 currencies, grammatical agreement, no float drift | التفقيط للفواتير والشيكات — 10 عملات، مطابقة نحوية، من غير أخطاء الكسور |
| [`@fincoremk/eosb`](packages/eosb) | End-of-service benefit calculator with rules as data (tiers, caps, resignation shares) | حاسبة مكافأة نهاية الخدمة والقواعد فيها بيانات (شرائح، سقف، نسب الاستقالة) |
| [`@fincoremk/coa-ifrs-ar`](packages/coa-ifrs-ar) | Bilingual Arabic/English chart of accounts structured for IFRS statements (178 accounts) | دليل حسابات عربي/إنجليزي مبني على قوائم IFRS (178 حساب) |

All packages: **zero runtime dependencies · MIT · tested on Node 18/20/22 · readable in one sitting.**

كل الحزم: **من غير أي مكتبات خارجية · رخصة MIT · مختبرة على Node 18 و20 و22 · صغيرة تتقري وتتراجع بسهولة.**

```bash
npm test   # runs every package's test suite
```

## Why open these? · ليه بنفتحهم؟

FINCOREMK itself is a commercial product and its source stays closed — that protects our customers' data and their security.
These packages are the parts we believe every Arabic business system should get right, published so anyone can read, test and reuse them, and judge the way we engineer.

FINCOREMK نفسه منتج تجاري وكوده مقفول، عشان ده بيحمي بيانات عملائنا وأمانهم.
الحزم دي هي الأجزاء اللي شايفين إن أي نظام عربي لازم يعملها صح، ونشرناها عشان أي حد يقراها ويختبرها ويستخدمها، ويحكم بنفسه على طريقة شغلنا.

## Principles · مبادئنا

1. **Money is never a float.** Every amount is an integer of minor units (fils, halala, cent).
2. **Books are append-only.** Posted entries are frozen; corrections are reversing entries; closed periods are locked.
3. **Tampering is detectable.** Each record carries the hash of the one before it.
4. **Security uses standards, not inventions.** Web Crypto, PBKDF2, AES-GCM, ECDSA P-256, WebAuthn.
5. **Law is configuration.** Legal parameters are data with a clear note: *verify against your country's law · تُضبط حسب قانون دولتك.*

## Security · الأمان

Found a vulnerability? Email **info@fincoremk.com** (subject `SECURITY`). See [SECURITY.md](SECURITY.md).

---

<div align="center"><sub>© 2026 FINCOREMK · Kuwait · <a href="https://fincoremk.com">fincoremk.com</a></sub></div>
