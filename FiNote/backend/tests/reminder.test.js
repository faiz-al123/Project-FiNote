// Test BE-06 (daftar pengingat + ringkasan per bulan).
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

function tambah(uid, nama, jenis, jumlah, tanggal, status = 'belum_selesai') {
  db.prepare(`
    INSERT INTO Pengingat (user_id, nama_pengingat, jenis, jumlah, tanggal_jatuh_tempo, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(uid, nama, jenis, jumlah, tanggal, status);
}

async function daftarPengingat(query = '', tk = token) {
  const res = await fetch(`${base}/pengingat${query}`, {
    headers: tk ? { Authorization: `Bearer ${tk}` } : {},
  });
  return { status: res.status, json: await res.json() };
}

before(async () => {
  for (const f of [TEST_DB_PATH, `${TEST_DB_PATH}-wal`, `${TEST_DB_PATH}-shm`]) {
    if (fs.existsSync(f)) fs.unlinkSync(f);
  }
  db = require('../src/config/db');
  db.exec(fs.readFileSync(path.join(__dirname, '../database/schema.sql'), 'utf8'));
  const app = require('../src/app');
  await new Promise((resolve) => { server = app.listen(0, resolve); });
  base = `http://127.0.0.1:${server.address().port}/api`;

  token = await daftar('Budi');
  tokenLain = await daftar('Lain');
  tokenKosong = await daftar('Kosong');

  const budi = userId('Budi');
  tambah(budi, 'Listrik', 'tagihan', 350000, '2026-11-03');                 // terlewat
  tambah(budi, 'Bayar kos', 'pengeluaran', 800000, '2026-11-08', 'selesai'); // selesai
  tambah(budi, 'Internet', 'tagihan', 300000, '2026-11-12');                // terdekat
  tambah(budi, 'Servis motor', 'pengeluaran', 150000, '2026-11-25');
  tambah(budi, 'Pajak', 'tagihan', 500000, '2026-12-05');                   // bulan lain
  tambah(userId('Lain'), 'Air', 'tagihan', 100000, '2026-11-12');           // user lain
});

after(() => {
  server.close();
  db.close();
  if (fs.existsSync(TEST_DB_PATH)) fs.unlinkSync(TEST_DB_PATH);
});

test('Skenario 1: daftar bulan ini + ringkasan (total, terdekat, selesai, terlewat)', async () => {
  const { status, json } = await daftarPengingat('?bulan=2026-11&tanggal=2026-11-10');
  assert.strictEqual(status, 200);
  assert.strictEqual(json.success, true);
  const { ringkasan, reminders } = json.data;
  assert.strictEqual(ringkasan.total, 4);
  assert.strictEqual(ringkasan.selesai, 1);
  assert.strictEqual(ringkasan.belum_selesai, 3);
  assert.strictEqual(ringkasan.terlewat, 1);
  assert.strictEqual(ringkasan.terdekat.nama_pengingat, 'Internet');
  // diurutkan dari tanggal jatuh tempo terdekat
  assert.deepStrictEqual(reminders.map((r) => r.nama_pengingat), ['Listrik', 'Bayar kos', 'Internet', 'Servis motor']);
  assert.strictEqual(reminders[0].terlewat, true);
  assert.strictEqual(reminders[1].terlewat, false); // yang selesai tidak dianggap terlewat
  assert.strictEqual(reminders[2].terlewat, false);
});

test('Skenario 2: memilih bulan lain -> hanya pengingat bulan itu', async () => {
  const { json } = await daftarPengingat('?bulan=2026-12&tanggal=2026-11-10');
  assert.strictEqual(json.data.bulan, '2026-12');
  assert.strictEqual(json.data.ringkasan.total, 1);
  assert.strictEqual(json.data.reminders[0].nama_pengingat, 'Pajak');
  assert.strictEqual(json.data.ringkasan.terlewat, 0);
  assert.strictEqual(json.data.ringkasan.terdekat.nama_pengingat, 'Pajak');
});

test('bulan tanpa pengingat -> 200, daftar kosong, "Data tidak ditemukan."', async () => {
  const { status, json } = await daftarPengingat('?bulan=2027-01&tanggal=2026-11-10');
  assert.strictEqual(status, 200);
  assert.strictEqual(json.message, 'Data tidak ditemukan.');
  assert.deepStrictEqual(json.data.reminders, []);
  assert.strictEqual(json.data.ringkasan.total, 0);
  assert.strictEqual(json.data.ringkasan.terdekat, null);
});

test('semua pengingat sudah lewat -> terdekat null', async () => {
  const { json } = await daftarPengingat('?bulan=2026-11&tanggal=2026-11-30');
  assert.strictEqual(json.data.ringkasan.terdekat, null);
  assert.strictEqual(json.data.ringkasan.terlewat, 3); // 3 belum selesai, semua lewat
});

test('pengingat yang jatuh tempo tepat pada tanggal acuan dihitung terdekat, bukan terlewat', async () => {
  const { json } = await daftarPengingat('?bulan=2026-11&tanggal=2026-11-12');
  assert.strictEqual(json.data.ringkasan.terdekat.nama_pengingat, 'Internet');
  assert.strictEqual(json.data.ringkasan.terlewat, 1);
});

test('tanpa parameter -> bulan ini (menurut tanggal hari ini)', async () => {
  const { tanggalHariIni } = require('../src/utils/dateHelper');
  const hariIni = tanggalHariIni();
  tambah(userId('Kosong'), 'Hari ini', 'tagihan', 1000, hariIni);
  const { json } = await daftarPengingat('', tokenKosong);
  assert.strictEqual(json.data.bulan, hariIni.slice(0, 7));
  assert.strictEqual(json.data.ringkasan.total, 1);
  assert.strictEqual(json.data.ringkasan.terdekat.nama_pengingat, 'Hari ini');
});

test('user lain hanya melihat pengingatnya sendiri', async () => {
  const { json } = await daftarPengingat('?bulan=2026-11&tanggal=2026-11-10', tokenLain);
  assert.strictEqual(json.data.ringkasan.total, 1);
  assert.strictEqual(json.data.reminders[0].nama_pengingat, 'Air');
});

test('parameter tidak valid -> 400 "Input tidak valid."', async () => {
  for (const q of ['?bulan=2026-13', '?bulan=november', '?bulan=2026-1', '?bulan=2026-11-01', '?tanggal=kemarin', '?tanggal=2026-02-30', '?bulan=a&bulan=b']) {
    const { status, json } = await daftarPengingat(q);
    assert.strictEqual(status, 400, q);
    assert.strictEqual(json.message, 'Input tidak valid.');
    assert.ok(json.data.detail);
  }
});

test('tanpa token -> 401', async () => {
  const { status } = await daftarPengingat('', null);
  assert.strictEqual(status, 401);
});

test('tabel Pengingat menolak data tidak sah (jenis, nominal, status)', () => {
  const uid = userId('Budi');
  assert.throws(() => tambah(uid, 'X', 'lainnya', 1000, '2026-11-01'));
  assert.throws(() => tambah(uid, 'X', 'tagihan', 0, '2026-11-01'));
  assert.throws(() => tambah(uid, 'X', 'tagihan', 1000, '2026-11-01', 'entah'));
});

test('schema: Pengingat menggantikan Tagihan (database baru maupun lama)', () => {
  const { DatabaseSync } = require('node:sqlite');
  const sql = fs.readFileSync(path.join(__dirname, '../database/schema.sql'), 'utf8');
  const namaTabel = (d) =>
    d.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all().map((r) => r.name);

  // Database baru: hanya ada Pengingat
  const baru = new DatabaseSync(':memory:');
  baru.exec(sql);
  assert.ok(namaTabel(baru).includes('Pengingat'));
  assert.ok(!namaTabel(baru).includes('Tagihan'));
  baru.close();

  // Database lama yang masih punya tabel Tagihan: Tagihan dibuang, Pengingat dibuat
  const lama = new DatabaseSync(':memory:');
  lama.exec('CREATE TABLE Tagihan (tagihan_id INTEGER PRIMARY KEY, nama_tagihan TEXT)');
  lama.exec(sql);
  assert.ok(!namaTabel(lama).includes('Tagihan'));
  assert.ok(namaTabel(lama).includes('Pengingat'));

  // Menjalankan schema berkali-kali (setiap server start) tidak error
  lama.exec(sql);
  assert.ok(namaTabel(lama).includes('Pengingat'));
  lama.close();
});
