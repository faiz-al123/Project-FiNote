// Test BE-06 (daftar pengingat, ringkasan, filter, dan pencarian).
// DB terpisah (test-reminder.db) agar tidak bentrok dengan test lain.

const { test, before, after } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const TEST_DB_PATH = path.join(__dirname, 'test-reminder.db');
process.env.DB_PATH = TEST_DB_PATH;
process.env.JWT_SECRET = 'test_secret';

let server;
let base;
let db;
let kat; // { Makanan: id, ... }
let token;
let tokenLain;
let tokenKosong;

async function daftar(nama) {
  const res = await fetch(`${base}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nama, email: `${nama.toLowerCase()}@example.com`, password: 'passwordAman123' }),
  });
  return (await res.json()).data.token;
}

function userId(nama) {
  return db.prepare('SELECT user_id FROM User WHERE email = ?').get(`${nama.toLowerCase()}@example.com`).user_id;
}

function tambah(uid, deskripsi, kategori, jumlah, tanggal, status = 'belum_selesai') {
  db.prepare(`
    INSERT INTO Pengingat (user_id, deskripsi, kategori_id, jumlah, tanggal, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(uid, deskripsi, kat[kategori], jumlah, tanggal, status);
}

async function daftarPengingat(query = '', tk = token) {
  const res = await fetch(`${base}/pengingat${query}`, {
    headers: tk ? { Authorization: `Bearer ${tk}` } : {},
  });
  return { status: res.status, json: await res.json() };
}

const ACUAN = 'tanggal=2026-11-10';
const namaDari = (json) => json.data.reminders.map((r) => r.deskripsi);

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

  token = await daftar('Budi');
  tokenLain = await daftar('Lain');
  tokenKosong = await daftar('Kosong');

  const budi = userId('Budi');
  tambah(budi, 'Bayar listrik', 'Tagihan', 350000, '2026-11-03');                // terlewat
  tambah(budi, 'Bayar kos', 'Belanja', 800000, '2026-11-08', 'selesai');         // selesai
  tambah(budi, 'Nonton konser', 'Hiburan', 200000, '2026-11-10');                // terdekat (hari ini)
  tambah(budi, 'Bayar internet', 'Tagihan', 300000, '2026-11-12');               // terdekat (2 hari)
  tambah(budi, 'Beli galon', 'Belanja', 20000, '2026-11-13');                    // tepat 3 hari: BUKAN terdekat
  tambah(budi, 'Servis motor', 'Transportasi', 150000, '2026-11-25');
  tambah(budi, 'Bayar pajak', 'Tagihan', 500000, '2026-12-05');                  // bulan lain
  tambah(userId('Lain'), 'Bayar air', 'Tagihan', 100000, '2026-11-12');          // user lain
});

after(() => {
  server.close();
  db.close();
  if (fs.existsSync(TEST_DB_PATH)) fs.unlinkSync(TEST_DB_PATH);
});

test('Skenario 1: empat angka ringkasan (terdekat, total, selesai, terlewat)', async () => {
  const { status, json } = await daftarPengingat(`?bulan=2026-11&${ACUAN}`);
  assert.strictEqual(status, 200);
  assert.strictEqual(json.success, true);
  assert.deepStrictEqual(json.data.ringkasan, { terdekat: 2, total: 6, selesai: 1, terlewat: 1 });
  // tabel diurutkan dari tanggal paling awal
  assert.deepStrictEqual(namaDari(json), [
    'Bayar listrik', 'Bayar kos', 'Nonton konser', 'Bayar internet', 'Beli galon', 'Servis motor',
  ]);
  const r = json.data.reminders[0];
  assert.deepStrictEqual(Object.keys(r).sort(), [
    'deskripsi', 'jumlah', 'kategori_id', 'nama_kategori', 'pengingat_id',
    'selesai_pada', 'status', 'tanggal', 'terdekat', 'terlewat',
  ]);
  assert.strictEqual(r.nama_kategori, 'Tagihan');
});

test('terdekat: kurang dari 3 hari (hari ini dan +2 masuk, +3 tidak)', async () => {
  const { json } = await daftarPengingat(`?bulan=2026-11&${ACUAN}&filter=terdekat`);
  assert.deepStrictEqual(namaDari(json), ['Nonton konser', 'Bayar internet']);
});

test('filter terlewat dan selesai', async () => {
  assert.deepStrictEqual(namaDari((await daftarPengingat(`?${ACUAN}&filter=terlewat`)).json), ['Bayar listrik']);
  assert.deepStrictEqual(namaDari((await daftarPengingat(`?${ACUAN}&filter=selesai`)).json), ['Bayar kos']);
  assert.strictEqual((await daftarPengingat(`?${ACUAN}&filter=semua`)).json.data.reminders.length, 6);
});

test('pencarian: deskripsi dan nama kategori, tidak peka huruf besar/kecil', async () => {
  assert.deepStrictEqual(namaDari((await daftarPengingat(`?${ACUAN}&search=BAYAR`)).json),
    ['Bayar listrik', 'Bayar kos', 'Bayar internet']);
  assert.deepStrictEqual(namaDari((await daftarPengingat(`?${ACUAN}&search=hiburan`)).json), ['Nonton konser']);
  assert.deepStrictEqual(namaDari((await daftarPengingat(`?${ACUAN}&filter=terlewat&search=bayar`)).json), ['Bayar listrik']);
});

test('pencarian/filter tidak mengubah angka ringkasan', async () => {
  const { json } = await daftarPengingat(`?${ACUAN}&filter=selesai&search=kos`);
  assert.strictEqual(json.data.reminders.length, 1);
  assert.deepStrictEqual(json.data.ringkasan, { terdekat: 2, total: 6, selesai: 1, terlewat: 1 });
});

test('Skenario 2: memilih bulan lain -> hanya pengingat bulan itu', async () => {
  const { json } = await daftarPengingat(`?bulan=2026-12&${ACUAN}`);
  assert.strictEqual(json.data.bulan, '2026-12');
  assert.deepStrictEqual(namaDari(json), ['Bayar pajak']);
  assert.deepStrictEqual(json.data.ringkasan, { terdekat: 0, total: 1, selesai: 0, terlewat: 0 });
});

test('tidak ada yang cocok -> 200, daftar kosong, "Data tidak ditemukan."', async () => {
  for (const q of [`?bulan=2027-01&${ACUAN}`, `?${ACUAN}&search=tidakada`]) {
    const { status, json } = await daftarPengingat(q);
    assert.strictEqual(status, 200, q);
    assert.strictEqual(json.message, 'Data tidak ditemukan.');
    assert.deepStrictEqual(json.data.reminders, []);
  }
  const kosong = (await daftarPengingat(`?bulan=2027-01&${ACUAN}`)).json;
  assert.deepStrictEqual(kosong.data.ringkasan, { terdekat: 0, total: 0, selesai: 0, terlewat: 0 });
});

test('tanpa parameter -> bulan ini (menurut tanggal hari ini)', async () => {
  const { tanggalHariIni } = require('../src/utils/dateHelper');
  const hariIni = tanggalHariIni();
  tambah(userId('Kosong'), 'Hari ini', 'Tagihan', 1000, hariIni);
  const { json } = await daftarPengingat('', tokenKosong);
  assert.strictEqual(json.data.bulan, hariIni.slice(0, 7));
  assert.strictEqual(json.data.ringkasan.total, 1);
  assert.strictEqual(json.data.ringkasan.terdekat, 1);
});

test('user lain hanya melihat pengingatnya sendiri', async () => {
  const { json } = await daftarPengingat(`?bulan=2026-11&${ACUAN}`, tokenLain);
  assert.deepStrictEqual(namaDari(json), ['Bayar air']);
});

test('parameter tidak valid -> 400 "Input tidak valid."', async () => {
  for (const q of [
    '?bulan=2026-13', '?bulan=november', '?bulan=2026-1', '?bulan=2026-11-01',
    '?tanggal=kemarin', '?tanggal=2026-02-30',
    '?filter=abc', '?filter=a&filter=b', `?search=${'x'.repeat(101)}`,
  ]) {
    const { status, json } = await daftarPengingat(q);
    assert.strictEqual(status, 400, q);
    assert.strictEqual(json.message, 'Input tidak valid.');
    assert.ok(json.data.detail);
  }
});

test('tanpa token -> 401', async () => {
  assert.strictEqual((await daftarPengingat('', null)).status, 401);
});

test('tabel Pengingat: deskripsi wajib, kategori harus ada, nominal > 0', () => {
  const uid = userId('Budi');
  assert.throws(() => tambah(uid, '', 'Tagihan', 1000, '2026-11-01'));      // deskripsi kosong
  assert.throws(() => tambah(uid, '   ', 'Tagihan', 1000, '2026-11-01'));   // hanya spasi
  assert.throws(() => tambah(uid, 'X', 'Tagihan', 0, '2026-11-01'));        // nominal 0
  assert.throws(() => tambah(uid, 'X', 'Tagihan', 1000, '2026-11-01', 'entah')); // status tidak sah
  assert.throws(() => db.prepare(
    'INSERT INTO Pengingat (user_id, deskripsi, kategori_id, jumlah, tanggal) VALUES (?, ?, ?, ?, ?)'
  ).run(uid, 'X', 9999, 1000, '2026-11-01')); // kategori tidak ada
});

test('schema: Pengingat menggantikan Tagihan (database baru maupun lama)', () => {
  const { DatabaseSync } = require('node:sqlite');
  const { siapkanDatabase } = require('../src/config/migrate');
  const sql = fs.readFileSync(path.join(__dirname, '../database/schema.sql'), 'utf8');
  const namaTabel = (d) =>
    d.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all().map((r) => r.name);
  const namaKolom = (d) => d.prepare('PRAGMA table_info(Pengingat)').all().map((k) => k.name);

  // Database baru: hanya ada Pengingat
  const baru = new DatabaseSync(':memory:');
  siapkanDatabase(baru, sql);
  assert.ok(namaTabel(baru).includes('Pengingat'));
  assert.ok(!namaTabel(baru).includes('Tagihan'));
  baru.close();

  // Database lama: ada Tagihan dan Pengingat versi awal (nama_pengingat/jenis)
  const lama = new DatabaseSync(':memory:');
  lama.exec('CREATE TABLE Tagihan (tagihan_id INTEGER PRIMARY KEY, nama_tagihan TEXT)');
  lama.exec(`CREATE TABLE Pengingat (pengingat_id INTEGER PRIMARY KEY, user_id INTEGER,
             nama_pengingat TEXT, jenis TEXT, jumlah REAL, tanggal_jatuh_tempo TEXT)`);
  siapkanDatabase(lama, sql);
  assert.ok(!namaTabel(lama).includes('Tagihan'));
  assert.ok(namaKolom(lama).includes('deskripsi'));
  assert.ok(!namaKolom(lama).includes('nama_pengingat'));

  // Setelah itu, menjalankan lagi (setiap server start) TIDAK menghapus data
  lama.exec("INSERT INTO User (nama, email, password) VALUES ('A', 'a@a.com', 'x')");
  lama.exec(`INSERT INTO Pengingat (user_id, deskripsi, kategori_id, jumlah, tanggal)
             VALUES (1, 'Tetap ada', 1, 1000, '2026-11-01')`);
  siapkanDatabase(lama, sql);
  assert.strictEqual(lama.prepare('SELECT COUNT(*) AS n FROM Pengingat').get().n, 1);
  lama.close();
});
