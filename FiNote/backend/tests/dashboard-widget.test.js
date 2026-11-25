// Test BE-10 (endpoint widget dashboard: total transaksi, pengeluaran terbaru, dan
// penanda "kosong" pada grafik kategori). DB terpisah (test-dashwidget.db).

const { test, before, after } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const TEST_DB_PATH = path.join(__dirname, 'test-dashwidget.db');
process.env.DB_PATH = TEST_DB_PATH;
process.env.JWT_SECRET = 'test_secret';

let server;
let base;
let db;
let kat;

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

const catat = (token, body) => api('POST', '/transaksi', body, token);

before(async () => {
  for (const f of [TEST_DB_PATH, `${TEST_DB_PATH}-wal`, `${TEST_DB_PATH}-shm`]) {
    if (fs.existsSync(f)) fs.unlinkSync(f);
  }
  db = require('../src/config/db');
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
  db.close();
  if (fs.existsSync(TEST_DB_PATH)) fs.unlinkSync(TEST_DB_PATH);
});

// ---------- Skenario 2: belum punya pengeluaran -> semua widget kosong ----------

test('Skenario 2: belum ada pengeluaran -> semua widget kosong, bukan error', async () => {
  const token = await daftar('Kosong');

  const ringkasan = await api('GET', '/dashboard/summary', undefined, token);
  assert.strictEqual(ringkasan.status, 200);
  assert.strictEqual(ringkasan.json.data.total_pengeluaran_hari_ini, 0);
  assert.strictEqual(ringkasan.json.data.total_pengeluaran_bulan_ini, 0);

  const total = await api('GET', '/dashboard/total-transaksi', undefined, token);
  assert.strictEqual(total.status, 200);
  assert.strictEqual(total.json.data.total_transaksi, 0);
  assert.strictEqual(total.json.data.total_transaksi_bulan_ini, 0);

  const grafik = await api('GET', '/dashboard/kategori', undefined, token);
  assert.strictEqual(grafik.status, 200);
  assert.strictEqual(grafik.json.data.kosong, true); // frontend: tampilkan tombol ke catat transaksi
  assert.ok(grafik.json.data.categories.every((c) => c.total === 0 && c.tertinggi === false));

  const terbaru = await api('GET', '/dashboard/terbaru', undefined, token);
  assert.strictEqual(terbaru.status, 200);
  assert.deepStrictEqual(terbaru.json.data.transactions, []);
  assert.strictEqual(terbaru.json.message, 'Data tidak ditemukan.');
});

// ---------- Skenario 1: sudah punya pengeluaran ----------

test('Skenario 1: total transaksi menghitung jumlah catatan, bukan jumlah uang', async () => {
  const token = await daftar('Budi');
  const lain = await daftar('Lain');
  await catat(token, { kategori_id: kat.Makanan, jumlah: 10000, tanggal: '2026-10-15' });
  await catat(token, { kategori_id: kat.Makanan, jumlah: 20000, tanggal: '2026-10-20' });
  await catat(token, { kategori_id: kat.Belanja, jumlah: 5000, tanggal: '2026-09-30' }); // bulan lain
  await catat(lain, { kategori_id: kat.Makanan, jumlah: 99999, tanggal: '2026-10-15' }); // pengguna lain

  const { status, json } = await api('GET', '/dashboard/total-transaksi?tanggal=2026-10-25', undefined, token);
  assert.strictEqual(status, 200);
  assert.strictEqual(json.data.total_transaksi, 3);
  assert.strictEqual(json.data.total_transaksi_bulan_ini, 2);
  assert.strictEqual(json.data.bulan, '2026-10');
});

test('Skenario 1: pengeluaran terbaru diurutkan dari tanggal terbaru, dibatasi limit', async () => {
  const token = await daftar('Citra');
  const lain = await daftar('Orang');
  const data = [
    ['2026-10-10', 1000, 'paling lama'],
    ['2026-10-12', 2000, 'tengah A'],
    ['2026-10-12', 3000, 'tengah B (dicatat setelah A)'],
    ['2026-10-14', 4000, 'terbaru'],
  ];
  for (const [tanggal, jumlah, catatan] of data) {
    await catat(token, { kategori_id: kat.Hiburan, jumlah, tanggal, catatan });
  }
  await catat(lain, { kategori_id: kat.Hiburan, jumlah: 77777, tanggal: '2026-10-30' }); // bukan milik Citra

  let { status, json } = await api('GET', '/dashboard/terbaru', undefined, token);
  assert.strictEqual(status, 200);
  assert.deepStrictEqual(json.data.transactions.map((t) => t.catatan),
    ['terbaru', 'tengah B (dicatat setelah A)', 'tengah A', 'paling lama']);
  const baris = json.data.transactions[0];
  assert.deepStrictEqual(Object.keys(baris).sort(),
    ['catatan', 'jumlah', 'kategori_id', 'nama_kategori', 'tanggal', 'transaksi_id']);
  assert.strictEqual(baris.nama_kategori, 'Hiburan');
  assert.strictEqual(json.data.limit, 5); // bawaan

  ({ json } = await api('GET', '/dashboard/terbaru?limit=2', undefined, token));
  assert.deepStrictEqual(json.data.transactions.map((t) => t.catatan), ['terbaru', 'tengah B (dicatat setelah A)']);
  assert.strictEqual(json.data.limit, 2);
});

test('Skenario 1: grafik kategori tidak kosong kalau sudah ada pengeluaran bulan ini', async () => {
  const token = await daftar('Dewi');
  await catat(token, { kategori_id: kat.Tagihan, jumlah: 70000, tanggal: '2026-10-20' });
  const { json } = await api('GET', '/dashboard/kategori?tanggal=2026-10-25', undefined, token);
  assert.strictEqual(json.data.kosong, false);
  // bulan lain tanpa pengeluaran -> kosong
  const { json: j2 } = await api('GET', '/dashboard/kategori?tanggal=2027-01-10', undefined, token);
  assert.strictEqual(j2.data.kosong, true);
});

// ---------- Validasi dan keamanan ----------

test('parameter tidak valid -> 400', async () => {
  const token = await daftar('Eko');
  for (const url of [
    '/dashboard/total-transaksi?tanggal=kemarin',
    '/dashboard/total-transaksi?tanggal=2026-02-30',
    '/dashboard/terbaru?limit=0',
    '/dashboard/terbaru?limit=21',
    '/dashboard/terbaru?limit=abc',
    '/dashboard/terbaru?limit=-1',
    '/dashboard/terbaru?limit=1.5',
    '/dashboard/terbaru?limit=2&limit=3',
  ]) {
    const { status, json } = await api('GET', url, undefined, token);
    assert.strictEqual(status, 400, url);
    assert.strictEqual(json.success, false, url);
  }
  const { json } = await api('GET', '/dashboard/terbaru?limit=abc', undefined, token);
  assert.strictEqual(json.message, 'Input tidak valid.');
});

test('semua endpoint widget wajib login (401 tanpa token)', async () => {
  for (const url of [
    '/dashboard/summary',
    '/dashboard/kategori',
    '/dashboard/total-transaksi',
    '/dashboard/terbaru',
  ]) {
    assert.strictEqual((await api('GET', url)).status, 401, url);
  }
});

test('SQL injection di parameter tidak menembus', async () => {
  const token = await daftar('Fani');
  await catat(token, { kategori_id: kat.Makanan, jumlah: 1000 });
  const { status } = await api('GET', `/dashboard/terbaru?limit=${encodeURIComponent('1; DROP TABLE Transaksi')}`, undefined, token);
  assert.strictEqual(status, 400);
  assert.strictEqual((await api('GET', '/dashboard/total-transaksi', undefined, token)).json.data.total_transaksi, 1);
});
