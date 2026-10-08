const jwt = require('jsonwebtoken');
const AppError = require('../utils/appError');
const { JWT_SECRET } = require('../config/env');

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(new AppError('Token tidak ditemukan. Silakan login.', 401));
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = { user_id: payload.user_id, email: payload.email };
    next();
  } catch (err) {
    next(new AppError('Token tidak valid atau sudah kedaluwarsa.', 401));
  }
}

module.exports = authMiddleware;
