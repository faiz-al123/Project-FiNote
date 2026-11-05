// Test BE-05 (riwayat transaksi: pencarian, filter, halaman).
// DB terpisah (test-riwayat.db) agar tidak bentrok dengan test lain.

const { test, before, after } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const TEST_DB_PATH = path.join(__dirname, 'test-riwayat.db');
process.env.DB_PATH = TEST_DB_PATH;
process.env.JWT_SECRET = 'test_secret';

let server;
let base;
let token;
let tokenLain;
let kategori; // { Makanan: 1, ... }

async function daftar(nama) {
  const res = await fetch(`${base}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nama, email: `${nama.toLowerCase()}@example.com`, password: 'passwordAman123' }),
  });
  return (await res.json()).data.token;
}

function catat(tk, body) {
  return fetch(`${base}/transaksi`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tk}` },
    body: JSON.stringify(body),
  });
}

async function riwayat(query = '', tk = token) {
  const res = await fetch(`${base}/transaksi${query}`, {
    headers: tk ? { Authorization: `Bearer ${tk}` } : {},
  });
  return { status: res.status, json: await res.json() };
}

before(async () => {
  for (const f of [TEST_DB_PATH, `${TEST_DB_PATH}-wal`, `${TEST_DB_PATH}-shm`]) {
    if (fs.existsSync(f)) fs.unlinkSync(f);
  }
  const db = require('../src/config/db');
  db.exec(fs.readFileSync(path.join(__dirname, '../database/schema.sql'), 'utf8'));
  const app = require('../src/app');
  await new Promise((resolve) => { server = app.listen(0, resolve); });
  base = `http://127.0.0.1:${server.address().port}/api`;

  token = await daftar('Budi');
  tokenLain = await daftar('Lain');

  kategori = {};
  for (const k of db.prepare('SELECT kategori_id, nama_kategori FROM Kategori').all()) {
    kategori[k.nama_kategori] = k.kategori_id;
  }

  await catat(token, { kategori_id: kategori.Makanan, jumlah: 10000, tanggal: '2026-10-23', catatan: 'nasi padang' });
  await catat(token, { kategori_id: kategori.Makanan, jumlah: 8000, tanggal: '2026-10-22', catatan: 'soto ayam' });
  await catat(token, { kategori_id: kategori.Transportasi, jumlah: 15000, tanggal: '2026-10-22', catatan: 'ojek online' });
  await catat(token, { kategori_id: kategori.Belanja, jumlah: 50000, tanggal: '2026-10-10', catatan: 'diskon 50% sabun' });
  await catat(token, { kategori_id: kategori.Hiburan, jumlah: 30000, tanggal: '2026-09-30' }); // tanpa deskripsi
  await catat(tokenLain, { kategori_id: kategori.Makanan, jumlah: 99999, tanggal: '2026-10-23', catatan: 'nasi padang' });
});

after(() => {
  server.close();
  require('../src/config/db').close();
  if (fs.existsSync(TEST_DB_PATH)) fs.unlinkSync(TEST_DB_PATH);
});

test('tanpa filter: semua transaksi milik user, terbaru di atas', async () => {
  const { status, json } = await riwayat();
  assert.strictEqual(status, 200);
  const t = json.data.transactions;
  assert.strictEqual(t.length, 5);
  assert.strictEqual(t[0].tanggal, '2026-10-23');
  assert.strictEqual(t[4].tanggal, '2026-09-30');
  assert.ok(t.every((x) => x.jumlah !== 99999)); // data user lain tidak ikut
  assert.deepStrictEqual(json.data.pagination, { page: 1, limit: 15, total_items: 5, total_pages: 1 });
  assert.ok(t[0].nama_kategori);
});

test('pencarian search di deskripsi', async () => {
  const { json } = await riwayat('?search=padang');
  assert.strictEqual(json.data.transactions.length, 1);
  assert.strictEqual(json.data.transactions[0].catatan, 'nasi padang');
});

test('pencarian search di nama kategori (tidak peka huruf besar/kecil)', async () => {
  const { json } = await riwayat('?search=makan');
  assert.strictEqual(json.data.transactions.length, 2);
  const { json: j2 } = await riwayat('?search=HIBURAN');
  assert.strictEqual(j2.data.transactions.length, 1);
});

test('filter kategori_id', async () => {
  const { json } = await riwayat(`?kategori_id=${kategori.Makanan}`);
  assert.strictEqual(json.data.transactions.length, 2);
});

test('filter tanggal tepat', async () => {
  const { json } = await riwayat('?tanggal=2026-10-22');
  assert.strictEqual(json.data.transactions.length, 2);
});

test('filter rentang dari/sampai (inklusif)', async () => {
  const { json } = await riwayat('?dari=2026-10-10&sampai=2026-10-22');
  assert.strictEqual(json.data.transactions.length, 3);
  const { json: j2 } = await riwayat('?dari=2026-10-22');
  assert.strictEqual(j2.data.transactions.length, 3);
});

test('gabungan filter: kategori + tanggal + kata kunci', async () => {
  const { json } = await riwayat(`?kategori_id=${kategori.Makanan}&tanggal=2026-10-22&search=soto`);
  assert.strictEqual(json.data.transactions.length, 1);
  assert.strictEqual(json.data.transactions[0].catatan, 'soto ayam');
});

test('tidak ada yang cocok -> 200, daftar kosong, pesan tidak ditemukan', async () => {
  const { status, json } = await riwayat('?search=tidakadayangcocok');
  assert.strictEqual(status, 200);
  assert.strictEqual(json.success, true);
  assert.deepStrictEqual(json.data.transactions, []);
  assert.strictEqual(json.data.pagination.total_items, 0);
  assert.strictEqual(json.message, 'Data tidak ditemukan.');
});

test('halaman: limit=2 dibagi 3 halaman', async () => {
  const p1 = (await riwayat('?limit=2&page=1')).json.data;
  const p2 = (await riwayat('?limit=2&page=2')).json.data;
  const p3 = (await riwayat('?limit=2&page=3')).json.data;
  assert.strictEqual(p1.transactions.length, 2);
  assert.strictEqual(p2.transactions.length, 2);
  assert.strictEqual(p3.transactions.length, 1);
  assert.strictEqual(p1.pagination.total_pages, 3);
  const ids = [...p1.transactions, ...p2.transactions, ...p3.transactions].map((x) => x.transaksi_id);
  assert.strictEqual(new Set(ids).size, 5); // tidak ada yang dobel
  const p9 = (await riwayat('?limit=2&page=9')).json.data;
  assert.deepStrictEqual(p9.transactions, []);
});

test('karakter % dan _ dianggap huruf biasa', async () => {
  assert.strictEqual((await riwayat('?search=50%25')).json.data.transactions.length, 1); // "50%"
  assert.strictEqual((await riwayat('?search=%25')).json.data.transactions.length, 1);
  assert.strictEqual((await riwayat('?search=_')).json.data.transactions.length, 0);
});

test('SQL injection di search tidak membocorkan data', async () => {
  for (const payload of ["' OR '1'='1", "'; DROP TABLE Transaksi; --", '" OR 1=1 --']) {
    const { status, json } = await riwayat(`?search=${encodeURIComponent(payload)}`);
    assert.strictEqual(status, 200);
    assert.strictEqual(json.data.transactions.length, 0, payload);
  }
  assert.strictEqual((await riwayat()).json.data.transactions.length, 5); // tabel masih utuh
});

test('filter nominal: harus sama persis', async () => {
  const { json } = await riwayat('?nominal=15000');
  assert.strictEqual(json.data.transactions.length, 1);
  assert.strictEqual(json.data.transactions[0].catatan, 'ojek online');
  const { json: j2 } = await riwayat('?nominal=12345');
  assert.strictEqual(j2.data.transactions.length, 0);
  assert.strictEqual(j2.message, 'Data tidak ditemukan.');
  const { json: j3 } = await riwayat(`?nominal=10000&kategori_id=${kategori.Makanan}`);
  assert.strictEqual(j3.data.transactions.length, 1);
});

test('nominal bukan bilangan bulat positif -> 400 "Input tidak valid."', async () => {
  for (const q of ['?nominal=abc', '?nominal=12.5', '?nominal=-5', '?nominal=0', '?nominal=1e3', '?nominal=10.000']) {
    const { status, json } = await riwayat(q);
    assert.strictEqual(status, 400, q);
    assert.strictEqual(json.message, 'Input tidak valid.');
    assert.ok(json.data.detail);
  }
});

test('parameter kosong dianggap tidak diisi (tampilkan semua)', async () => {
  const { status, json } = await riwayat('?search=&nominal=&kategori_id=&tanggal=');
  assert.strictEqual(status, 200);
  assert.strictEqual(json.data.transactions.length, 5);
});

test('parameter tidak valid -> 400', async () => {
  for (const q of [
    '?tanggal=kemarin',
    '?tanggal=2026-02-30',
    '?dari=2026-10-23&sampai=2026-10-01',
    '?tanggal=2026-10-22&dari=2026-10-01',
    '?kategori_id=abc',
    '?kategori_id=0',
    '?page=0',
    '?page=abc',
    '?limit=0',
    '?limit=101',
    '?search=a&search=b',
  ]) {
    const { status, json } = await riwayat(q);
    assert.strictEqual(status, 400, q);
    assert.strictEqual(json.success, false);
    assert.strictEqual(json.message, 'Input tidak valid.');
  }
});

test('user lain hanya melihat datanya sendiri', async () => {
  const { json } = await riwayat('', tokenLain);
  assert.strictEqual(json.data.transactions.length, 1);
  assert.strictEqual(json.data.transactions[0].jumlah, 99999);
});

test('tanpa token -> 401', async () => {
  const { status } = await riwayat('', null);
  assert.strictEqual(status, 401);
});
