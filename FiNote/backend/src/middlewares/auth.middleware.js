const jwt = require('jsonwebtoken');
const AppError = require('../utils/appError');
const { JWT_SECRET } = require('../config/env');
const sessionService = require('../services/session.service');

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(new AppError('Token tidak ditemukan. Silakan login.', 401));
  }

  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return next(new AppError('Token tidak valid atau sudah kedaluwarsa.', 401));
  }

  // BE-09: token yang sudah dipakai logout tidak berlaku lagi
  if (sessionService.sudahDicabut(token)) {
    return next(new AppError('Sesi sudah berakhir. Silakan login kembali.', 401));
  }

  req.user = { user_id: payload.user_id, email: payload.email };
  // Dipakai endpoint logout untuk mencabut token ini
  req.token = token;
  req.tokenExp = payload.exp;
  return next();
}

module.exports = authMiddleware;
