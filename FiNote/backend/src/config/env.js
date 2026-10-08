//test

module.exports = {
  PORT: process.env.PORT || 3000,

  DB_PATH: process.env.DB_PATH || 'database/FiNote.db',

  JWT_SECRET:
    process.env.JWT_SECRET ||
    'finote_secret_key_2026_sangat_panjang_dan_aman',

  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',

  CORS_ORIGIN:
    process.env.CORS_ORIGIN || 'http://localhost:5173',
};