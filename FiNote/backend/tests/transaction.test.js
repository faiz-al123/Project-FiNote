// Test BE-04 (Mencatat Pengeluaran) lewat HTTP sungguhan ke server Express.
// Memakai DB terpisah (test-transaction.db) agar tidak bentrok dengan auth.test.js.

const { test, before, after } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const TEST_DB_PATH = path.join(__dirname, 'test-transaction.db');
process.env.DB_PATH = TEST_DB_PATH;
process.env.JWT_SECRET = 'test_secret';

let server;
let base;
let token;

before(async () => {
  for (const f of [TEST_DB_PATH, `${TEST_DB_PATH}-wal`, `${TEST_DB_PATH}-shm`]) {
    if (fs.existsSync(f)) fs.unlinkSync(f);
  }
  const db = require('../src/config/db');
  db.exec(fs.readFileSync(path.join(__dirname, '../database/schema.sql'), 'utf8'));

  const app = require('../src/app');
  await new Promise((resolve) => {
    server = app.listen(0, resolve);
  });
  base = `http://127.0.0.1:${server.address().port}/api`;

  const res = await fetch(`${base}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nama: 'Penguji', email: 'penguji@example.com', password: 'passwordAman123' }),
  });
  token = (await res.json()).data.token;
});

after(() => {
  server.close();
  require('../src/config/db').close();
  if (fs.existsSync(TEST_DB_PATH)) fs.unlinkSync(TEST_DB_PATH);
});

function post(body, auth = true) {
  return fetch(`${base}/transaksi`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(auth ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
}

test('kategori bawaan tersedia (6 kategori)', async () => {
  const res = await fetch(`${base}/kategori`, { headers: { Authorization: `Bearer ${token}` } });
  const json = await res.json();
  assert.strictEqual(res.status, 200);
  const nama = json.data.categories.map((c) => c.nama_kategori).sort();
  assert.deepStrictEqual(nama, ['Belanja', 'Hiburan', 'Lainnya', 'Makanan', 'Tagihan', 'Transportasi']);
});

test('Skenario 1: nominal + kategori valid -> tersimpan (201)', async () => {
  const res = await post({ kategori_id: 1, jumlah: 25000, catatan: 'Makan siang' });
  const json = await res.json();
  assert.strictEqual(res.status, 201);
  assert.strictEqual(json.success, true);
  assert.strictEqual(json.data.transaction.jumlah, 25000);
  assert.strictEqual(json.data.transaction.catatan, 'Makan siang');
  assert.ok(json.data.transaction.nama_kategori);
});

test('Skenario 2: nominal kosong / tidak valid / kategori kosong -> 400', async () => {
  for (const body of [
    {},
    { kategori_id: 1 },
    { jumlah: 1000 },
    { kategori_id: 1, jumlah: 0 },
    { kategori_id: 1, jumlah: -5 },
    { kategori_id: 1, jumlah: 'abc' },
  ]) {
    const res = await post(body);
    const json = await res.json();
    assert.strictEqual(res.status, 400, JSON.stringify(body));
    assert.strictEqual(json.success, false);
  }
});

test('kategori_id yang tidak ada -> 400', async () => {
  const res = await post({ kategori_id: 9999, jumlah: 1000 });
  assert.strictEqual(res.status, 400);
  assert.strictEqual((await res.json()).message, 'Kategori tidak valid.');
});

test('Skenario 3: tanggal dari pengguna disimpan apa adanya', async () => {
  const res = await post({ kategori_id: 2, jumlah: 15000, tanggal: '2026-10-12' });
  const json = await res.json();
  assert.strictEqual(res.status, 201);
  assert.strictEqual(json.data.transaction.tanggal, '2026-10-12');
});

test('tanggal tidak valid -> 400', async () => {
  for (const tanggal of ['12-10-2026', '2026-02-30', 'kemarin']) {
    const res = await post({ kategori_id: 2, jumlah: 15000, tanggal });
    assert.strictEqual(res.status, 400, tanggal);
  }
});

test('Skenario 4: tanpa tanggal -> otomatis hari ini', async () => {
  const { tanggalHariIni } = require('../src/utils/dateHelper');
  const res = await post({ kategori_id: 3, jumlah: 50000 });
  const json = await res.json();
  assert.strictEqual(res.status, 201);
  assert.strictEqual(json.data.transaction.tanggal, tanggalHariIni());
});

test('tanpa token -> 401', async () => {
  const res = await post({ kategori_id: 1, jumlah: 1000 }, false);
  assert.strictEqual(res.status, 401);
});
