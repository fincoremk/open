import test from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, verifyPassword, seal, open, timingSafeEqual } from './index.js';

test('password hashing', async () => {
  const h = await hashPassword('كلمة سر طويلة 2026', { iterations: 10_000 });
  assert.match(h, /^pbkdf2-sha256\$10000\$/);
  assert.notEqual(h, await hashPassword('كلمة سر طويلة 2026', { iterations: 10_000 }), 'random salt → different hash each time');
  assert.deepEqual(await verifyPassword('كلمة سر طويلة 2026', h), { ok: true, rehash: true });
  assert.equal((await verifyPassword('كلمة سر طويلة 2025', h)).ok, false);
  assert.equal((await verifyPassword('x', 'garbage')).ok, false);
});

test('seal / open round trip with context binding', async () => {
  const data = { company: 'CL-0001', balance: '1250.500', lines: [1, 2, 3] };
  const box = await seal(data, 'pass phrase', { aad: 'company:CL-0001', iterations: 10_000 });
  assert.deepEqual(await open(box, 'pass phrase', { aad: 'company:CL-0001' }), data);
  await assert.rejects(open(box, 'wrong', { aad: 'company:CL-0001' }), /authentication failed/);
  await assert.rejects(open(box, 'pass phrase', { aad: 'company:CL-0002' }), /authentication failed/);
});

test('a single flipped bit is detected', async () => {
  const box = await seal({ v: 1 }, 'k', { iterations: 10_000 });
  const p = box.split('.'), ct = Buffer.from(p[4], 'base64'); ct[0] ^= 1; p[4] = ct.toString('base64').replace(/=+$/, '');
  await assert.rejects(open(p.join('.'), 'k'), /authentication failed/);
});

test('timingSafeEqual', () => {
  assert.equal(timingSafeEqual(new Uint8Array([1, 2]), new Uint8Array([1, 2])), true);
  assert.equal(timingSafeEqual(new Uint8Array([1, 2]), new Uint8Array([1, 3])), false);
  assert.equal(timingSafeEqual(new Uint8Array([1]), new Uint8Array([1, 2])), false);
});
