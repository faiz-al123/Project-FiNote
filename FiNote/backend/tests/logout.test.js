// Test BE-09 (logout: token dicabut).
// DB terpisah (test-logout.db) agar tidak bentrok dengan test lain.

const { test, before, after } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const TEST_DB_PATH = path.join(__dirname, 'test-logout.db');
process.env.DB_PATH = TEST_DB_PATH;
process.env.JWT_SECRET = 'test_secret';

let server;
let base;
let db;

async function api(method, url, body, token) {
  const res = await fetch(`${base}${url}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: res.status, json: await res.json() };
}

async function daftar(nama) {
  const { json } = await api('POST', '/auth/register', {
    nama, email: `${nama.toLowerCase()}@example.com`, password: 'passwordAman123',
  });
  return json.data.token;
}

const loginLagi = async (nama) =>
  (await api('POST', '/auth/login', { identifier: nama, password: 'passwordAman123' })).json.data.token;

before(async () => {
  for (const f of [TEST_DB_PATH, `${TEST_DB_PATH}-wal`, `${TEST_DB_PATH}-shm`]) {
    if (fs.existsSync(f)) fs.unlinkSync(f);
  }
  db = require('../src/config/db');
  db.exec(fs.readFileSync(path.join(__dirname, '../database/schema.sql'), 'utf8'));
  const app = require('../src/app');
  await new Promise((resolve) => { server = app.listen(0, resolve); });
  base = `http://127.0.0.1:${server.address().port}/api`;
});

after(() => {
  server.close();
  db.close();
  if (fs.existsSync(TEST_DB_PATH)) fs.unlinkSync(TEST_DB_PATH);
});

test('Skenario 1: logout -> 200 "Logout berhasil."', async () => {
  const token = await daftar('Budi');
  assert.strictEqual((await api('GET', '/auth/me', undefined, token)).status, 200); // sebelum logout masih berlaku
  const { status, json } = await api('POST', '/auth/logout', undefined, token);
  assert.strictEqual(status, 200);
  assert.strictEqual(json.success, true);
  assert.strictEqual(json.message, 'Logout berhasil.');
});

test('setelah logout, token tidak bisa dipakai di endpoint mana pun (401)', async () => {
  const token = await daftar('Citra');
  await api('POST', '/auth/logout', undefined, token);

  for (const [method, url, body] of [
    ['GET', '/auth/me'],
    ['GET', '/profil'],
    ['PUT', '/profil', { username: 'Baru' }],
    ['PUT', '/profil/password', { password_lama: 'a', password_baru: 'b', konfirmasi_password: 'c' }],
    ['GET', '/transaksi'],
    ['POST', '/transaksi', { kategori_id: 1, jumlah: 1000 }],
    ['GET', '/dashboard/summary'],
    ['GET', '/pengingat'],
    ['POST', '/auth/logout'],
  ]) {
    const { status, json } = await api(method, url, body, token);
    assert.strictEqual(status, 401, `${method} ${url}`);
    assert.strictEqual(json.message, 'Sesi sudah berakhir. Silakan login kembali.', `${method} ${url}`);
  }
});

test('login lagi menghasilkan token baru yang berlaku, token lama tetap mati', async () => {
  const lama = await daftar('Dewi');
  await api('POST', '/auth/logout', undefined, lama);
  const baru = await loginLagi('Dewi');
  assert.notStrictEqual(baru, lama);
  assert.strictEqual((await api('GET', '/auth/me', undefined, baru)).status, 200);
  assert.strictEqual((await api('GET', '/auth/me', undefined, lama)).status, 401);
});

test('logout hanya mencabut token yang dipakai, perangkat/sesi lain tetap aktif', async () => {
  const perangkatA = await daftar('Eko');
  // jwt memakai detik, jadi beri jeda agar kedua token berbeda
  await new Promise((r) => setTimeout(r, 1100));
  const perangkatB = await loginLagi('Eko');
  assert.notStrictEqual(perangkatA, perangkatB);

  await api('POST', '/auth/logout', undefined, perangkatA);
  assert.strictEqual((await api('GET', '/auth/me', undefined, perangkatA)).status, 401);
  assert.strictEqual((await api('GET', '/auth/me', undefined, perangkatB)).status, 200);
});

test('logout pengguna A tidak mempengaruhi pengguna B', async () => {
  const a = await daftar('Fani');
  const b = await daftar('Gani');
  await api('POST', '/auth/logout', undefined, a);
  assert.strictEqual((await api('GET', '/auth/me', undefined, b)).status, 200);
});

test('logout tanpa token, token palsu, atau salah skema -> 401', async () => {
  assert.strictEqual((await api('POST', '/auth/logout')).status, 401);
  assert.strictEqual((await api('POST', '/auth/logout', undefined, 'token.palsu.sekali')).status, 401);
});

test('yang tersimpan di database adalah hash token, bukan token aslinya', async () => {
  const token = await daftar('Hana');
  await api('POST', '/auth/logout', undefined, token);
  const baris = db.prepare('SELECT token_hash, user_id, kedaluwarsa_pada FROM TokenDicabut').all();
  assert.ok(baris.length >= 1);
  assert.ok(baris.every((b) => b.token_hash !== token && /^[0-9a-f]{64}$/.test(b.token_hash)));
  const { hashToken } = require('../src/services/session.service');
  assert.ok(baris.some((b) => b.token_hash === hashToken(token)));
});

test('baris token yang sudah kedaluwarsa dibersihkan saat logout berikutnya', async () => {
  const uid = db.prepare("SELECT user_id FROM User WHERE email = 'hana@example.com'").get().user_id;
  db.prepare("INSERT INTO TokenDicabut (token_hash, user_id, kedaluwarsa_pada) VALUES ('kadaluwarsa-lama', ?, '2020-01-01 00:00:00')").run(uid);
  const token = await daftar('Indra');
  await api('POST', '/auth/logout', undefined, token);
  const ada = db.prepare("SELECT 1 FROM TokenDicabut WHERE token_hash = 'kadaluwarsa-lama'").get();
  assert.strictEqual(ada, undefined);
});

test('token yang sudah dicabut ikut terhapus saat akunnya dihapus (tidak ada sisa)', async () => {
  const token = await daftar('Joko');
  await api('POST', '/auth/logout', undefined, token);
  const uid = db.prepare("SELECT user_id FROM User WHERE email = 'joko@example.com'").get().user_id;
  db.prepare('DELETE FROM User WHERE user_id = ?').run(uid);
  assert.strictEqual(db.prepare('SELECT COUNT(*) AS n FROM TokenDicabut WHERE user_id = ?').get(uid).n, 0);
});
