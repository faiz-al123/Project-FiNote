// test
const { CORS_ORIGIN } = require('./env');

const allowedOrigins = [
  CORS_ORIGIN,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

module.exports = {
  origin: function (origin, callback) {
    // Request tanpa origin, misalnya dari Postman
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(
      new Error(`Origin tidak diizinkan oleh CORS: ${origin}`)
    );
  },

  credentials: true,
};