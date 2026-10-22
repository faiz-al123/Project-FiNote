// Test BE-03 (total pengeluaran harian & bulanan untuk dashboard).
// DB terpisah (test-dashboard.db) agar tidak bentrok dengan test lain.

const { test, before, after } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const TEST_DB_PATH = path.join(__dirname, 'test-dashboard.db');
process.env.DB_PATH = TEST_DB_PATH;
process.env.JWT_SECRET = 'test_secret';

let server;
let base;

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

function ringkasan(token, query = '') {
  return fetch(`${base}/dashboard/summary${query}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
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
});

after(() => {
  server.close();
  require('../src/config/db').close();
  if (fs.existsSync(TEST_DB_PATH)) fs.unlinkSync(TEST_DB_PATH);
});

test('Skenario 2: belum ada catatan -> kedua total 0', async () => {
  const token = await daftar('Kosong');
  const res = await ringkasan(token);
  const json = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(json.success, true);
  assert.strictEqual(json.data.total_pengeluaran_hari_ini, 0);
  assert.strictEqual(json.data.total_pengeluaran_bulan_ini, 0);
});

test('Skenario 1: total harian & bulanan sesuai database', async () => {
  const token = await daftar('Budi');
  const lain = await daftar('Lain');

  await catat(token, { kategori_id: 1, jumlah: 10000, tanggal: '2026-10-15' });
  await catat(token, { kategori_id: 2, jumlah: 5000, tanggal: '2026-10-15' });
  await catat(token, { kategori_id: 3, jumlah: 20000, tanggal: '2026-10-03' });
  await catat(token, { kategori_id: 1, jumlah: 99999, tanggal: '2026-09-30' }); // bulan lain
  await catat(token, { kategori_id: 1, jumlah: 88888, tanggal: '2026-11-01' }); // bulan lain
  await catat(lain, { kategori_id: 1, jumlah: 77777, tanggal: '2026-10-15' }); // user lain

  const res = await ringkasan(token, '?tanggal=2026-10-15');
  const json = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(json.data.bulan, '2026-10');
  assert.strictEqual(json.data.total_pengeluaran_hari_ini, 15000);
  assert.strictEqual(json.data.total_pengeluaran_bulan_ini, 35000);
});

test('tanpa parameter tanggal -> memakai hari ini', async () => {
  const { tanggalHariIni } = require('../src/utils/dateHelper');
  const token = await daftar('Hariini');
  await catat(token, { kategori_id: 1, jumlah: 12500 }); // tanggal otomatis hari ini
  const json = await (await ringkasan(token)).json();
  assert.strictEqual(json.data.tanggal, tanggalHariIni());
  assert.strictEqual(json.data.total_pengeluaran_hari_ini, 12500);
  assert.strictEqual(json.data.total_pengeluaran_bulan_ini, 12500);
});

test('tanggal tidak valid -> 400', async () => {
  const token = await daftar('Salah');
  for (const q of ['?tanggal=kemarin', '?tanggal=2026-02-30', '?tanggal=15-10-2026']) {
    const res = await ringkasan(token, q);
    assert.strictEqual(res.status, 400, q);
  }
});

test('tanpa token -> 401', async () => {
  const res = await ringkasan(null);
  assert.strictEqual(res.status, 401);
});
