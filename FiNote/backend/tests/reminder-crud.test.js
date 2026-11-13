// Test BE-07 (tambah, ubah, hapus, tandai selesai pengingat).
// DB terpisah (test-reminder-crud.db) agar tidak bentrok dengan test lain.

const { test, before, after } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const TEST_DB_PATH = path.join(__dirname, 'test-reminder-crud.db');
process.env.DB_PATH = TEST_DB_PATH;
process.env.JWT_SECRET = 'test_secret';

let server;
let base;
let db;
let kat;
let token;
let tokenLain;

async function daftar(nama) {
  const res = await fetch(`${base}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nama, email: `${nama.toLowerCase()}@example.com`, password: 'passwordAman123' }),
  });
  return (await res.json()).data.token;
}

async function api(method, url, body, tk = token) {
  const res = await fetch(`${base}${url}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(tk ? { Authorization: `Bearer ${tk}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: res.status, json: await res.json() };
}

const data = (extra = {}) => ({
  deskripsi: 'Bayar listrik',
  kategori_id: kat.Tagihan,
  jumlah: 350000,
  tanggal: '2026-11-20',
  ...extra,
});

const buat = async (extra, tk = token) => (await api('POST', '/pengingat', data(extra), tk)).json.data.reminder;
const daftarBulan = (tk = token) => api('GET', '/pengingat?bulan=2026-11&tanggal=2026-11-10', undefined, tk);

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
});

after(() => {
  server.close();
  db.close();
  if (fs.existsSync(TEST_DB_PATH)) fs.unlinkSync(TEST_DB_PATH);
});

test('Skenario 1: tambah pengingat dengan seluruh kolom -> "Berhasil disimpan"', async () => {
  const { status, json } = await api('POST', '/pengingat', data());
  assert.strictEqual(status, 201);
  assert.strictEqual(json.success, true);
  assert.strictEqual(json.message, 'Berhasil disimpan');
  const r = json.data.reminder;
  assert.strictEqual(r.deskripsi, 'Bayar listrik');
  assert.strictEqual(r.nama_kategori, 'Tagihan');
  assert.strictEqual(r.jumlah, 350000);
  assert.strictEqual(r.tanggal, '2026-11-20');
  assert.strictEqual(r.status, 'belum_selesai');
  assert.strictEqual(r.selesai_pada, null);

  // langsung muncul di daftar (BE-06)
  const daftarHasil = (await daftarBulan()).json.data;
  assert.ok(daftarHasil.reminders.some((x) => x.pengingat_id === r.pengingat_id));
});

test('tambah: jumlah boleh dikirim sebagai teks angka, deskripsi dirapikan', async () => {
  const { status, json } = await api('POST', '/pengingat', data({ jumlah: '15000', deskripsi: '  Beli pulsa  ' }));
  assert.strictEqual(status, 201);
  assert.strictEqual(json.data.reminder.jumlah, 15000);
  assert.strictEqual(json.data.reminder.deskripsi, 'Beli pulsa');
});

test('Skenario 3: nominal bukan angka -> "Nominal harus berupa angka"', async () => {
  for (const jumlah of ['abc', '12abc', '10.000.000', '0x10', '1e3', '-5abc', {}, [1], true]) {
    const { status, json } = await api('POST', '/pengingat', data({ jumlah }));
    assert.strictEqual(status, 400, JSON.stringify(jumlah));
    assert.strictEqual(json.message, 'Nominal harus berupa angka');
  }
});

test('kolom wajib diisi (deskripsi wajib sesuai PM) -> 400 dengan pesan jelas', async () => {
  const kasus = [
    [{ deskripsi: undefined }, 'Deskripsi wajib diisi.'],
    [{ deskripsi: '' }, 'Deskripsi wajib diisi.'],
    [{ deskripsi: '   ' }, 'Deskripsi wajib diisi.'],
    [{ deskripsi: 'x'.repeat(201) }, 'Deskripsi maksimal 200 karakter.'],
    [{ kategori_id: undefined }, 'Kategori wajib dipilih.'],
    [{ kategori_id: 'abc' }, 'Kategori tidak valid.'],
    [{ kategori_id: [1] }, 'Kategori tidak valid.'],
    [{ kategori_id: 1.5 }, 'Kategori tidak valid.'],
    [{ jumlah: undefined }, 'Nominal wajib diisi.'],
    [{ jumlah: '' }, 'Nominal wajib diisi.'],
    [{ jumlah: 0 }, 'Nominal harus lebih dari 0.'],
    [{ jumlah: -5 }, 'Nominal harus lebih dari 0.'],
    [{ tanggal: undefined }, 'Tanggal wajib diisi.'],
    [{ tanggal: 'kemarin' }, 'Format tanggal harus YYYY-MM-DD dan tanggalnya harus valid.'],
    [{ tanggal: '2026-02-30' }, 'Format tanggal harus YYYY-MM-DD dan tanggalnya harus valid.'],
  ];
  for (const [extra, pesan] of kasus) {
    const { status, json } = await api('POST', '/pengingat', data(extra));
    assert.strictEqual(status, 400, JSON.stringify(extra));
    assert.strictEqual(json.message, pesan, JSON.stringify(extra));
  }
});

test('kategori yang tidak ada -> 400 "Kategori tidak valid."', async () => {
  const { status, json } = await api('POST', '/pengingat', data({ kategori_id: 9999 }));
  assert.strictEqual(status, 400);
  assert.strictEqual(json.message, 'Kategori tidak valid.');
});

test('Skenario 2: ubah pengingat -> "Berhasil diubah" dan datanya berubah', async () => {
  const r = await buat({ deskripsi: 'Awal' });
  const { status, json } = await api('PUT', `/pengingat/${r.pengingat_id}`,
    data({ deskripsi: 'Sesudah diubah', kategori_id: kat.Hiburan, jumlah: 99000, tanggal: '2026-11-22' }));
  assert.strictEqual(status, 200);
  assert.strictEqual(json.message, 'Berhasil diubah');
  assert.strictEqual(json.data.reminder.deskripsi, 'Sesudah diubah');
  assert.strictEqual(json.data.reminder.nama_kategori, 'Hiburan');
  assert.strictEqual(json.data.reminder.jumlah, 99000);
  assert.strictEqual(json.data.reminder.tanggal, '2026-11-22');
  // tidak membuat baris baru
  const semua = (await daftarBulan()).json.data.reminders.filter((x) => x.pengingat_id === r.pengingat_id);
  assert.strictEqual(semua.length, 1);
});

test('ubah: validasi sama seperti tambah, termasuk "Nominal harus berupa angka"', async () => {
  const r = await buat();
  const { status, json } = await api('PUT', `/pengingat/${r.pengingat_id}`, data({ jumlah: 'abc' }));
  assert.strictEqual(status, 400);
  assert.strictEqual(json.message, 'Nominal harus berupa angka');
  const { json: j2 } = await api('PUT', `/pengingat/${r.pengingat_id}`, data({ deskripsi: '' }));
  assert.strictEqual(j2.message, 'Deskripsi wajib diisi.');
});

test('ubah pengingat yang sudah selesai: data berubah, status tetap selesai', async () => {
  const r = await buat();
  await api('PATCH', `/pengingat/${r.pengingat_id}/selesai`);
  const { json } = await api('PUT', `/pengingat/${r.pengingat_id}`, data({ deskripsi: 'Diubah setelah selesai' }));
  assert.strictEqual(json.data.reminder.deskripsi, 'Diubah setelah selesai');
  assert.strictEqual(json.data.reminder.status, 'selesai');
});

test('Skenario 4: hapus pengingat -> "Berhasil dihapus" dan hilang dari daftar', async () => {
  const r = await buat({ deskripsi: 'Akan dihapus' });
  const { status, json } = await api('DELETE', `/pengingat/${r.pengingat_id}`);
  assert.strictEqual(status, 200);
  assert.strictEqual(json.message, 'Berhasil dihapus');
  const ada = (await daftarBulan()).json.data.reminders.some((x) => x.pengingat_id === r.pengingat_id);
  assert.strictEqual(ada, false);
  // menghapus lagi -> tidak ditemukan
  assert.strictEqual((await api('DELETE', `/pengingat/${r.pengingat_id}`)).status, 404);
});

test('Skenario 5: tandai selesai -> status selesai, masuk hitungan selesai', async () => {
  const r = await buat({ deskripsi: 'Mau selesai', tanggal: '2026-11-11' }); // terdekat
  const sebelum = (await daftarBulan()).json.data.ringkasan;

  const { status, json } = await api('PATCH', `/pengingat/${r.pengingat_id}/selesai`);
  assert.strictEqual(status, 200);
  assert.strictEqual(json.data.reminder.status, 'selesai');
  assert.ok(json.data.reminder.selesai_pada);

  const sesudah = (await daftarBulan()).json.data;
  assert.strictEqual(sesudah.ringkasan.selesai, sebelum.selesai + 1);
  assert.strictEqual(sesudah.ringkasan.terdekat, sebelum.terdekat - 1); // tidak lagi terdekat
  assert.strictEqual(sesudah.ringkasan.total, sebelum.total);           // tidak hilang dari daftar
  const dalamFilter = await api('GET', '/pengingat?bulan=2026-11&tanggal=2026-11-10&filter=selesai');
  assert.ok(dalamFilter.json.data.reminders.some((x) => x.pengingat_id === r.pengingat_id));
});

test('pengingat terlewat yang ditandai selesai tidak dihitung terlewat lagi', async () => {
  const r = await buat({ deskripsi: 'Sudah lewat', tanggal: '2026-11-02' });
  const sebelum = (await daftarBulan()).json.data.ringkasan;
  await api('PATCH', `/pengingat/${r.pengingat_id}/selesai`);
  const sesudah = (await daftarBulan()).json.data.ringkasan;
  assert.strictEqual(sesudah.terlewat, sebelum.terlewat - 1);
});

test('tandai selesai -> tercatat sebagai transaksi dan muncul di Riwayat', async () => {
  const r = await buat({ deskripsi: 'Bayar wifi', jumlah: 275000, tanggal: '2026-11-15' });
  const riwayatSebelum = (await api('GET', '/transaksi?search=Bayar%20wifi')).json.data.pagination.total_items;
  assert.strictEqual(riwayatSebelum, 0); // belum dibayar -> belum ada di Riwayat

  assert.strictEqual((await api('PATCH', `/pengingat/${r.pengingat_id}/selesai`)).status, 200);

  const riwayat = (await api('GET', '/transaksi?search=Bayar%20wifi')).json.data;
  assert.strictEqual(riwayat.pagination.total_items, 1);
  const t = riwayat.transactions[0];
  assert.strictEqual(t.catatan, 'Bayar wifi');
  assert.strictEqual(t.jumlah, 275000);
  assert.strictEqual(t.kategori_id, r.kategori_id);
});

test('tandai selesai dua kali tidak membuat transaksi ganda', async () => {
  const r = await buat({ deskripsi: 'Bayar air PDAM' });
  await api('PATCH', `/pengingat/${r.pengingat_id}/selesai`);
  await api('PATCH', `/pengingat/${r.pengingat_id}/selesai`); // 409
  const riwayat = (await api('GET', '/transaksi?search=Bayar%20air%20PDAM')).json.data;
  assert.strictEqual(riwayat.pagination.total_items, 1);
});

test('transaksi dari pengingat tidak terlihat oleh user lain', async () => {
  const r = await buat({ deskripsi: 'Rahasia Budi' });
  await api('PATCH', `/pengingat/${r.pengingat_id}/selesai`);
  const riwayatLain = (await api('GET', '/transaksi?search=Rahasia', undefined, tokenLain)).json.data;
  assert.strictEqual(riwayatLain.pagination.total_items, 0);
});

test('tandai selesai dua kali -> 409', async () => {
  const r = await buat();
  assert.strictEqual((await api('PATCH', `/pengingat/${r.pengingat_id}/selesai`)).status, 200);
  const { status, json } = await api('PATCH', `/pengingat/${r.pengingat_id}/selesai`);
  assert.strictEqual(status, 409);
  assert.strictEqual(json.message, 'Pengingat sudah ditandai selesai.');
});

test('id tidak ditemukan -> 404, id bukan angka -> 400', async () => {
  for (const [method, url, body] of [
    ['PUT', '/pengingat/99999', data()],
    ['DELETE', '/pengingat/99999'],
    ['PATCH', '/pengingat/99999/selesai'],
  ]) {
    const { status, json } = await api(method, url, body);
    assert.strictEqual(status, 404, `${method} ${url}`);
    assert.strictEqual(json.message, 'Pengingat tidak ditemukan.');
  }
  for (const [method, url, body] of [
    ['PUT', '/pengingat/abc', data()],
    ['DELETE', '/pengingat/abc'],
    ['PATCH', '/pengingat/-1/selesai'],
    ['DELETE', '/pengingat/1.5'],
  ]) {
    const { status, json } = await api(method, url, body);
    assert.strictEqual(status, 400, `${method} ${url}`);
    assert.strictEqual(json.message, 'Input tidak valid.');
  }
});

test('pengingat milik user lain tidak bisa diubah, dihapus, atau ditandai selesai', async () => {
  const r = await buat({ deskripsi: 'Milik Budi' });
  assert.strictEqual((await api('PUT', `/pengingat/${r.pengingat_id}`, data({ deskripsi: 'Dibajak' }), tokenLain)).status, 404);
  assert.strictEqual((await api('DELETE', `/pengingat/${r.pengingat_id}`, undefined, tokenLain)).status, 404);
  assert.strictEqual((await api('PATCH', `/pengingat/${r.pengingat_id}/selesai`, undefined, tokenLain)).status, 404);

  // data Budi tidak berubah
  const milikBudi = (await daftarBulan()).json.data.reminders.find((x) => x.pengingat_id === r.pengingat_id);
  assert.strictEqual(milikBudi.deskripsi, 'Milik Budi');
  assert.strictEqual(milikBudi.status, 'belum_selesai');
  // dan tidak muncul di daftar user lain
  const daftarLain = (await daftarBulan(tokenLain)).json.data.reminders;
  assert.ok(!daftarLain.some((x) => x.pengingat_id === r.pengingat_id));
});

test('SQL injection di deskripsi disimpan sebagai teks biasa', async () => {
  const teks = "'); DROP TABLE Pengingat; --";
  const { status, json } = await api('POST', '/pengingat', data({ deskripsi: teks }));
  assert.strictEqual(status, 201);
  assert.strictEqual(json.data.reminder.deskripsi, teks);
  assert.strictEqual((await daftarBulan()).status, 200); // tabel masih utuh
});

test('tanpa token -> 401 di semua endpoint tulis', async () => {
  for (const [method, url, body] of [
    ['POST', '/pengingat', data()],
    ['PUT', '/pengingat/1', data()],
    ['DELETE', '/pengingat/1'],
    ['PATCH', '/pengingat/1/selesai'],
  ]) {
    assert.strictEqual((await api(method, url, body, null)).status, 401, `${method} ${url}`);
  }
});
