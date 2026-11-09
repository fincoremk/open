# @fincoremk/secure-box

Password hashing and authenticated encryption on the standard **Web Crypto API** — browsers, Node ≥ 18, Deno, Cloudflare Workers.
تجزئة كلمات السر والتشفير المُوثَّق على **Web Crypto** القياسي.

```js
import { hashPassword, verifyPassword, seal, open } from '@fincoremk/secure-box';

const stored = await hashPassword('correct horse battery staple');
// 'pbkdf2-sha256$600000$<salt>$<hash>'
const { ok, rehash } = await verifyPassword(input, stored);   // constant-time compare; rehash=true if cost was raised since

const box = await seal({ backup: '…' }, passphrase, { aad: 'company:CL-0001' });
const data = await open(box, passphrase, { aad: 'company:CL-0001' });   // throws on any wrong bit, key or context
```

| | Choice | Why |
|---|---|---|
| Password hash | PBKDF2-HMAC-SHA256, 600,000 iterations, 16-byte random salt | OWASP 2023 guidance; available everywhere Web Crypto is |
| Format | `pbkdf2-sha256$<iter>$<salt>$<hash>` | cost can be raised later; old hashes still verify and report `rehash` |
| Encryption | AES-256-GCM, 96-bit random IV, key from PBKDF2 | authenticated: tampering fails loudly instead of decrypting garbage |
| Context binding | `aad` | a backup of company A cannot be opened as company B |

We use standard, reviewed primitives only — no home-made cryptography.
بنستخدم خوارزميات قياسية ومراجَعة بس، من غير أي تشفير «من اختراعنا».

MIT · zero dependencies.
