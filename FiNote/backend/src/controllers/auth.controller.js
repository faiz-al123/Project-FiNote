const authService = require('../services/auth.service');
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

module.exports = { register, login, me };
