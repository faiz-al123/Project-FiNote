// Test untuk authController (register & login).
// Memakai node:test + node:assert bawaan Node.js, jadi tidak perlu
// install Jest/Mocha segala. Jalankan dengan: npm test

const { test, before } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

// Database terpisah khusus testing, supaya tidak menimpa database utama
const TEST_DB_PATH = path.join(__dirname, 'test.db');
process.env.DB_PATH = TEST_DB_PATH;
process.env.JWT_SECRET = 'test_secret';

before(() => {
  if (fs.existsSync(TEST_DB_PATH)) fs.unlinkSync(TEST_DB_PATH);
  const db = require('../src/config/db');
  const schema = fs.readFileSync(path.join(__dirname, '../database/schema.sql'), 'utf8');
  db.exec(schema);
});

const authController = require('../src/controllers/auth.controller');

// --- Helper: mock req/res/next ala Express, tanpa perlu Express beneran ---
function mockRes() {
  const res = {};
  res.statusCode = null;
  res.body = null;
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (data) => { res.body = data; return res; };
  return res;
}

function panggilController(fn, body) {
  return new Promise((resolve) => {
    const req = { body };
    const res = mockRes();
    const next = (err) => resolve({ error: err, res });
    const result = fn(req, res, next);
    if (result && typeof result.then === 'function') {
      result.then(() => resolve({ error: null, res }));
    }
  });
}

test('register berhasil dengan data valid', async () => {
  const { res, error } = await panggilController(authController.register, {
    nama: 'Siti Maria',
    email: 'siti@example.com',
    password: 'passwordAman123',
  });
  assert.strictEqual(error, null);
  assert.strictEqual(res.statusCode, 201);
  assert.strictEqual(res.body.success, true);
  assert.strictEqual(res.body.data.user.email, 'siti@example.com');
  assert.strictEqual(res.body.data.user.password, undefined, 'password tidak boleh ikut dikirim');
  assert.ok(res.body.data.token, 'token harus ada');
});

test('register ditolak kalau email sudah terdaftar', async () => {
  const { error } = await panggilController(authController.register, {
    nama: 'Siti Lagi',
    email: 'siti@example.com', // sama dengan test sebelumnya
    password: 'passwordLain123',
  });
  assert.ok(error, 'harus melempar error ke next()');
  assert.strictEqual(error.statusCode, 409);
});

test('register ditolak kalau password kurang dari 8 karakter', async () => {
  // Catatan: validasi ini normalnya dicek oleh validate.middleware.js
  // SEBELUM request sampai ke controller. Di sini controller dipanggil
  // langsung (tanpa middleware), jadi kita panggil validator-nya manual
  // untuk memastikan pesannya benar.
  const { validateRegister } = require('../src/validators/auth.validator');
  const pesanError = validateRegister({ nama: 'Test', email: 'test@test.com', password: '123' });
  assert.strictEqual(pesanError, 'Password minimal 8 karakter.');
});

test('login berhasil dengan kredensial yang benar', async () => {
  const { res, error } = await panggilController(authController.login, {
    email: 'siti@example.com',
    password: 'passwordAman123',
  });
  assert.strictEqual(error, null);
  assert.strictEqual(res.statusCode, 200);
  assert.ok(res.body.data.token, 'token harus ada');
});

test('current user berhasil diambil dari user_id pada token', async () => {
  const { res: loginRes } = await panggilController(authController.login, {
    email: 'siti@example.com',
    password: 'passwordAman123',
  });

  const { me } = authController;
  const req = { user: { user_id: loginRes.body.data.user.user_id } };
  const res = mockRes();
  const next = (err) => { throw err; };

  await me(req, res, next);
  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(res.body.success, true);
  assert.strictEqual(res.body.data.user.email, 'siti@example.com');
  assert.strictEqual(res.body.data.user.password, undefined);
});

test('login ditolak kalau password salah', async () => {
  const { error } = await panggilController(authController.login, {
    email: 'siti@example.com',
    password: 'passwordSalah',
  });
  assert.ok(error);
  assert.strictEqual(error.statusCode, 401);
  assert.strictEqual(error.message, 'Email atau password salah.');
});

test('login ditolak kalau email tidak terdaftar (pesan harus sama dengan password salah)', async () => {
  const { error } = await panggilController(authController.login, {
    email: 'tidakada@example.com',
    password: 'apapun123',
  });
  assert.ok(error);
  assert.strictEqual(error.statusCode, 401);
  assert.strictEqual(error.message, 'Email atau password salah.');
});
