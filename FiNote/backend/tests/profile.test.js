// Test BE-08 (profil: lihat, ubah username/email, ganti password).
// DB terpisah (test-profile.db) agar tidak bentrok dengan test lain.

const { test, before, after } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const TEST_DB_PATH = path.join(__dirname, 'test-profile.db');
process.env.DB_PATH = TEST_DB_PATH;
process.env.JWT_SECRET = 'test_secret';

let server;
let base;
let db;

async function post(url, body, token) {
  const res = await fetch(`${base}${url}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });
  return { status: res.status, json: await res.json() };
}

async function api(method, url, body, token) {
  const res = await fetch(`${base}${url}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: res.status, json: await res.json() };
}

async function daftar(nama, email = `${nama.toLowerCase()}@example.com`, password = 'passwordAman123') {
  const { json } = await post('/auth/register', { nama, email, password });
  return json.data.token;
}

const login = (identifier, password) => post('/auth/login', { identifier, password });

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

// ---------- Ambil data profil ----------

test('GET /profil: data akun + total transaksi + pengingat aktif, tanpa password', async () => {
  const token = await daftar('Tanu', 'tanu@example.com');
  for (const jumlah of [1000, 2000, 3000]) {
    await post('/transaksi', { kategori_id: 1, jumlah }, token);
  }
  const p1 = (await post('/pengingat', { deskripsi: 'A', kategori_id: 4, jumlah: 1000, tanggal: '2026-11-20' }, token)).json.data.reminder;
  await post('/pengingat', { deskripsi: 'B', kategori_id: 4, jumlah: 1000, tanggal: '2026-11-21' }, token);
  await api('PATCH', `/pengingat/${p1.pengingat_id}/selesai`, undefined, token);

  const { status, json } = await api('GET', '/profil', undefined, token);
  assert.strictEqual(status, 200);
  const p = json.data.profile;
  assert.strictEqual(p.username, 'Tanu');
  assert.strictEqual(p.email, 'tanu@example.com');
  assert.match(p.bergabung_sejak, /^\d{4}-\d{2}-\d{2}$/);
  assert.strictEqual(p.total_transaksi, 3);
  assert.strictEqual(p.pengingat_aktif, 1); // yang selesai tidak dihitung aktif
  assert.ok(!JSON.stringify(json).includes('password'));
});

test('GET /profil: data milik user lain tidak ikut terhitung', async () => {
  const token = await daftar('Sendiri');
  const { json } = await api('GET', '/profil', undefined, token);
  assert.strictEqual(json.data.profile.total_transaksi, 0);
  assert.strictEqual(json.data.profile.pengingat_aktif, 0);
});

// ---------- Skenario 1: ubah username / email ----------

test('Skenario 1: ubah username dan email -> "Informasi Profile berhasil diubah"', async () => {
  const token = await daftar('Budi', 'budi@example.com');
  const { status, json } = await api('PUT', '/profil', { username: 'BudiBaru', email: 'budi.baru@example.com' }, token);
  assert.strictEqual(status, 200);
  assert.strictEqual(json.message, 'Informasi Profile berhasil diubah');
  assert.strictEqual(json.data.profile.username, 'BudiBaru');
  assert.strictEqual(json.data.profile.email, 'budi.baru@example.com');

  // tersimpan di database
  const { json: j2 } = await api('GET', '/profil', undefined, token);
  assert.strictEqual(j2.data.profile.username, 'BudiBaru');

  // login memakai data baru, data lama tidak berlaku lagi
  assert.strictEqual((await login('BudiBaru', 'passwordAman123')).status, 200);
  assert.strictEqual((await login('budi.baru@example.com', 'passwordAman123')).status, 200);
  assert.strictEqual((await login('budi@example.com', 'passwordAman123')).status, 401);
});

test('ubah hanya username, atau hanya email; yang lain tetap', async () => {
  const token = await daftar('Citra', 'citra@example.com');
  let { json } = await api('PUT', '/profil', { username: 'CitraBaru' }, token);
  assert.strictEqual(json.data.profile.username, 'CitraBaru');
  assert.strictEqual(json.data.profile.email, 'citra@example.com');
  ({ json } = await api('PUT', '/profil', { email: 'citra2@example.com' }, token));
  assert.strictEqual(json.data.profile.username, 'CitraBaru');
  assert.strictEqual(json.data.profile.email, 'citra2@example.com');
});

test('username dan email dirapikan (spasi dibuang, email jadi huruf kecil)', async () => {
  const token = await daftar('Dewi', 'dewi@example.com');
  const { json } = await api('PUT', '/profil', { username: '  Dewi Baru  ', email: '  DEWI.BARU@Example.COM ' }, token);
  assert.strictEqual(json.data.profile.username, 'Dewi Baru');
  assert.strictEqual(json.data.profile.email, 'dewi.baru@example.com');
});

test('menyimpan data milik sendiri yang tidak berubah tidak dianggap duplikat', async () => {
  const token = await daftar('Eko', 'eko@example.com');
  const { status } = await api('PUT', '/profil', { username: 'eko', email: 'EKO@example.com' }, token); // beda huruf besar saja
  assert.strictEqual(status, 200);
});

// ---------- Skenario 2: format email salah ----------

test('Skenario 2: format email salah -> "Format Email tidak valid"', async () => {
  const token = await daftar('Fani', 'fani@example.com');
  for (const email of ['abc', 'abc@', '@example.com', 'a@b', 'a b@c.com']) {
    const { status, json } = await api('PUT', '/profil', { email }, token);
    assert.strictEqual(status, 400, email);
    assert.strictEqual(json.message, 'Format Email tidak valid', email);
  }
  const { json } = await api('GET', '/profil', undefined, token);
  assert.strictEqual(json.data.profile.email, 'fani@example.com'); // tidak berubah
});

test('isian profil kosong atau bertipe salah -> 400', async () => {
  const token = await daftar('Gani', 'gani@example.com');
  const kasus = [
    [{}, 'Username atau email wajib diisi.'],
    [{ username: '' }, 'Username tidak boleh kosong.'],
    [{ username: '   ' }, 'Username tidak boleh kosong.'],
    [{ username: null }, 'Username tidak boleh kosong.'],
    [{ username: ['x'] }, 'Username tidak boleh kosong.'],
    [{ username: 'x'.repeat(51) }, 'Username maksimal 50 karakter.'],
    [{ email: '' }, 'Email tidak boleh kosong.'],
    [{ email: 123 }, 'Email tidak boleh kosong.'],
  ];
  for (const [body, pesan] of kasus) {
    const { status, json } = await api('PUT', '/profil', body, token);
    assert.strictEqual(status, 400, JSON.stringify(body));
    assert.strictEqual(json.message, pesan, JSON.stringify(body));
  }
});

// ---------- Cek duplikat ----------

test('username atau email yang dipakai pengguna lain -> 409 dan data tidak berubah', async () => {
  await daftar('Hana', 'hana@example.com');
  const token = await daftar('Indra', 'indra@example.com');

  let r = await api('PUT', '/profil', { username: 'hana' }, token); // beda huruf besar tetap bentrok
  assert.strictEqual(r.status, 409);
  assert.strictEqual(r.json.message, 'Username sudah dipakai.');

  r = await api('PUT', '/profil', { email: 'HANA@example.com' }, token);
  assert.strictEqual(r.status, 409);
  assert.strictEqual(r.json.message, 'Email sudah terdaftar.');

  // satu valid + satu bentrok: tidak ada yang tersimpan separuh
  r = await api('PUT', '/profil', { username: 'IndraBaru', email: 'hana@example.com' }, token);
  assert.strictEqual(r.status, 409);
  const { json } = await api('GET', '/profil', undefined, token);
  assert.strictEqual(json.data.profile.username, 'Indra');
  assert.strictEqual(json.data.profile.email, 'indra@example.com');
});

test('mengubah profil tidak mengubah akun orang lain', async () => {
  const a = await daftar('Joko', 'joko@example.com');
  const b = await daftar('Kiki', 'kiki@example.com');
  await api('PUT', '/profil', { username: 'JokoBaru' }, a);
  const { json } = await api('GET', '/profil', undefined, b);
  assert.strictEqual(json.data.profile.username, 'Kiki');
});

// ---------- Ganti password ----------

const passwordBody = (extra = {}) => ({
  password_lama: 'passwordAman123',
  password_baru: 'PasswordBaru456',
  konfirmasi_password: 'PasswordBaru456',
  ...extra,
});

test('Skenario 4: ganti password -> "Password berhasil dirubah"', async () => {
  const token = await daftar('Lina', 'lina@example.com');
  const { status, json } = await api('PUT', '/profil/password', passwordBody(), token);
  assert.strictEqual(status, 200);
  assert.strictEqual(json.message, 'Password berhasil dirubah');

  assert.strictEqual((await login('lina@example.com', 'PasswordBaru456')).status, 200);
  assert.strictEqual((await login('lina@example.com', 'passwordAman123')).status, 401);

  // password tidak tersimpan sebagai teks biasa
  const tersimpan = db.prepare('SELECT password FROM User WHERE email = ?').get('lina@example.com').password;
  assert.notStrictEqual(tersimpan, 'PasswordBaru456');
  assert.match(tersimpan, /^\$2[aby]\$/);
});

test('Skenario 5: password lama tidak sesuai -> "Password saat ini tidak sesuai"', async () => {
  const token = await daftar('Maya', 'maya@example.com');
  const { status, json } = await api('PUT', '/profil/password', passwordBody({ password_lama: 'salahSekali1' }), token);
  assert.strictEqual(status, 400); // bukan 401, supaya frontend tidak mengira sesi habis
  assert.strictEqual(json.message, 'Password saat ini tidak sesuai');
  assert.strictEqual((await login('maya@example.com', 'passwordAman123')).status, 200); // password tidak berubah
});

test('Skenario 6: password baru kurang dari 8 karakter atau mengandung spasi -> "Password min.8 karakter tanpa spasi"', async () => {
  const token = await daftar('Nanda', 'nanda@example.com');
  for (const baru of ['pendek1', '1234567', 'ada spasi 123', ' diawali123', 'diakhiri123 ', 'tab\tdi123456']) {
    const { status, json } = await api('PUT', '/profil/password',
      passwordBody({ password_baru: baru, konfirmasi_password: baru }), token);
    assert.strictEqual(status, 400, JSON.stringify(baru));
    assert.strictEqual(json.message, 'Password min.8 karakter tanpa spasi', JSON.stringify(baru));
  }
  assert.strictEqual((await login('nanda@example.com', 'passwordAman123')).status, 200);
});

test('Skenario 7: konfirmasi password tidak sesuai -> "Password tidak sesuai" (tidak disimpan)', async () => {
  const token = await daftar('Oka', 'oka@example.com');
  const { status, json } = await api('PUT', '/profil/password', passwordBody({ konfirmasi_password: 'BedaSekali789' }), token);
  assert.strictEqual(status, 400);
  assert.strictEqual(json.message, 'Password tidak sesuai');
  assert.strictEqual((await login('oka@example.com', 'passwordAman123')).status, 200);
  assert.strictEqual((await login('oka@example.com', 'PasswordBaru456')).status, 401);
});

test('ganti password: isian kosong atau bertipe salah -> 400', async () => {
  const token = await daftar('Putri', 'putri@example.com');
  for (const body of [
    {},
    passwordBody({ password_lama: '' }),
    passwordBody({ password_baru: undefined }),
    passwordBody({ konfirmasi_password: undefined }),
    passwordBody({ password_lama: ['passwordAman123'] }),
  ]) {
    const { status, json } = await api('PUT', '/profil/password', body, token);
    assert.strictEqual(status, 400, JSON.stringify(body));
    assert.strictEqual(json.message, 'Password lama, password baru, dan konfirmasi password wajib diisi.');
  }
});

test('password baru lebih dari 72 karakter ditolak', async () => {
  const token = await daftar('Qori', 'qori@example.com');
  const panjang = 'a1'.repeat(37); // 74 karakter
  const { status, json } = await api('PUT', '/profil/password',
    passwordBody({ password_baru: panjang, konfirmasi_password: panjang }), token);
  assert.strictEqual(status, 400);
  assert.strictEqual(json.message, 'Password maksimal 72 karakter.');
});

// ---------- Autentikasi ----------

test('semua endpoint profil wajib login (401 tanpa token)', async () => {
  for (const [method, url, body] of [
    ['GET', '/profil'],
    ['PUT', '/profil', { username: 'x' }],
    ['PUT', '/profil/password', passwordBody()],
  ]) {
    const { status } = await api(method, url, body);
    assert.strictEqual(status, 401, `${method} ${url}`);
  }
  const { status } = await api('GET', '/profil', undefined, 'token.palsu.sekali');
  assert.strictEqual(status, 401);
});

test('SQL injection di username disimpan sebagai teks biasa', async () => {
  const token = await daftar('Rudi', 'rudi@example.com');
  const teks = "x'); DROP TABLE User; --";
  const { status, json } = await api('PUT', '/profil', { username: teks }, token);
  assert.strictEqual(status, 200);
  assert.strictEqual(json.data.profile.username, teks);
  assert.strictEqual((await api('GET', '/profil', undefined, token)).status, 200); // tabel masih utuh
});
