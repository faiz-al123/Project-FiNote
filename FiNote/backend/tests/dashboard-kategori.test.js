// Test BE-03.2 (total pengeluaran per kategori untuk grafik dashboard).
// DB terpisah (test-dashkat.db) agar tidak bentrok dengan test lain.

const { test, before, after } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const TEST_DB_PATH = path.join(__dirname, 'test-dashkat.db');
process.env.DB_PATH = TEST_DB_PATH;
process.env.JWT_SECRET = 'test_secret';

let server;
let base;
let kat; // { Makanan: id, ... }

async function daftar(nama) {
  const res = await fetch(`${base}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nama, email: `${nama.toLowerCase()}@example.com`, password: 'passwordAman123' }),
  });
  return (await res.json()).data.token;
}

function catat(token, body) {
  return fetch(`${base}/transaksi`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
}

async function perKategori(token, query = '') {
  const res = await fetch(`${base}/dashboard/kategori${query}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return { status: res.status, json: await res.json() };
}

const totalDari = (json, nama) => json.data.categories.find((c) => c.nama_kategori === nama);

before(async () => {
  for (const f of [TEST_DB_PATH, `${TEST_DB_PATH}-wal`, `${TEST_DB_PATH}-shm`]) {
    if (fs.existsSync(f)) fs.unlinkSync(f);
  }
  const db = require('../src/config/db');
  db.exec(fs.readFileSync(path.join(__dirname, '../database/schema.sql'), 'utf8'));
  const app = require('../src/app');
  await new Promise((resolve) => { server = app.listen(0, resolve); });
  base = `http://127.0.0.1:${server.address().port}/api`;

  kat = {};
  for (const k of db.prepare('SELECT kategori_id, nama_kategori FROM Kategori').all()) {
    kat[k.nama_kategori] = k.kategori_id;
  }
});

after(() => {
  server.close();
  require('../src/config/db').close();
  if (fs.existsSync(TEST_DB_PATH)) fs.unlinkSync(TEST_DB_PATH);
});

test('Skenario 2: belum ada catatan -> semua kategori tampil dengan total 0, tidak ada yang tertinggi', async () => {
  const token = await daftar('Kosong');
  const { status, json } = await perKategori(token);
  assert.strictEqual(status, 200);
  assert.strictEqual(json.data.categories.length, 6);
  assert.ok(json.data.categories.every((c) => c.total === 0 && c.tertinggi === false));
});

test('Skenario 1: total per kategori sesuai database, kategori tertinggi ditandai', async () => {
  const token = await daftar('Budi');
  const lain = await daftar('Lain');

  await catat(token, { kategori_id: kat.Makanan, jumlah: 10000, tanggal: '2026-10-15' });
  await catat(token, { kategori_id: kat.Makanan, jumlah: 10000, tanggal: '2026-10-03' });
  await catat(token, { kategori_id: kat.Transportasi, jumlah: 20000, tanggal: '2026-10-15' });
  await catat(token, { kategori_id: kat.Tagihan, jumlah: 70000, tanggal: '2026-10-20' });
  await catat(token, { kategori_id: kat.Tagihan, jumlah: 99999, tanggal: '2026-09-30' }); // bulan lain
  await catat(lain, { kategori_id: kat.Belanja, jumlah: 77777, tanggal: '2026-10-15' }); // user lain

  const { json } = await perKategori(token, '?tanggal=2026-10-15');
  assert.strictEqual(json.data.periode, 'bulanan');
  assert.strictEqual(totalDari(json, 'Makanan').total, 20000);
  assert.strictEqual(totalDari(json, 'Transportasi').total, 20000);
  assert.strictEqual(totalDari(json, 'Tagihan').total, 70000);
  assert.strictEqual(totalDari(json, 'Belanja').total, 0); // data user lain tidak ikut
  assert.strictEqual(totalDari(json, 'Hiburan').total, 0);
  assert.strictEqual(totalDari(json, 'Tagihan').tertinggi, true);
  assert.strictEqual(json.data.categories.filter((c) => c.tertinggi).length, 1);

  // Periode harian: hanya 2026-10-15
  const harian = (await perKategori(token, '?periode=harian&tanggal=2026-10-15')).json;
  assert.strictEqual(totalDari(harian, 'Makanan').total, 10000);
  assert.strictEqual(totalDari(harian, 'Transportasi').total, 20000);
  assert.strictEqual(totalDari(harian, 'Tagihan').total, 0);
  assert.strictEqual(totalDari(harian, 'Transportasi').tertinggi, true);
});

test('dua kategori sama-sama tertinggi -> keduanya ditandai', async () => {
  const token = await daftar('Seri');
  await catat(token, { kategori_id: kat.Makanan, jumlah: 5000, tanggal: '2026-10-15' });
  await catat(token, { kategori_id: kat.Belanja, jumlah: 5000, tanggal: '2026-10-15' });
  const { json } = await perKategori(token, '?tanggal=2026-10-15');
  assert.strictEqual(json.data.categories.filter((c) => c.tertinggi).length, 2);
});

test('tanpa parameter -> bulan ini', async () => {
  const { tanggalHariIni } = require('../src/utils/dateHelper');
  const token = await daftar('Hariini');
  await catat(token, { kategori_id: kat.Hiburan, jumlah: 12000 }); // otomatis hari ini
  const { json } = await perKategori(token);
  assert.strictEqual(json.data.tanggal, tanggalHariIni());
  assert.strictEqual(totalDari(json, 'Hiburan').total, 12000);
});

test('parameter tidak valid -> 400', async () => {
  const token = await daftar('Salah');
  for (const q of ['?periode=tahunan', '?tanggal=kemarin', '?tanggal=2026-02-30']) {
    assert.strictEqual((await perKategori(token, q)).status, 400, q);
  }
});

test('tanpa token -> 401', async () => {
  assert.strictEqual((await perKategori(null)).status, 401);
});
