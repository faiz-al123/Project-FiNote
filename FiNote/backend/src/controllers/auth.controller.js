const authService = require('../services/auth.service');
const sessionService = require('../services/session.service');
const { sukses } = require('../utils/response');

async function register(req, res, next) {
  try {
    const hasil = await authService.register(req.body);
    sukses(res, 201, 'Registrasi berhasil.', hasil);
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const hasil = await authService.login(req.body);
    sukses(res, 200, 'Login berhasil.', hasil);
  } catch (err) {
    next(err);
  }
}

async function me(req, res, next) {
  try {
    const hasil = await authService.getCurrentUser(req.user.user_id);
    sukses(res, 200, 'Data pengguna berhasil diambil.', { user: hasil });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/logout
// Mencabut token yang sedang dipakai. Token itu tidak bisa dipakai lagi,
// sedangkan token dari perangkat lain (login terpisah) tetap berlaku.
function logout(req, res, next) {
  try {
    sessionService.cabutToken({
      token: req.token,
      userId: req.user.user_id,
      exp: req.tokenExp,
    });
    sukses(res, 200, 'Logout berhasil.', null);
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, me, logout };
