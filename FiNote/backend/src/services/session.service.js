const crypto = require('crypto');
const db = require('../config/db');

// Token disimpan sebagai hash SHA-256, bukan token aslinya.
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function sudahDicabut(token) {
  const baris = db
    .prepare('SELECT 1 FROM TokenDicabut WHERE token_hash = ?')
    .get(hashToken(token));

  return Boolean(baris);
}

// Catat token sebagai sudah logout. "exp" adalah waktu kedaluwarsa token (detik, dari JWT).
// Baris yang masa berlaku tokennya sudah lewat ikut dibersihkan, karena token itu
// toh sudah ditolak oleh jwt.verify.
function cabutToken({ token, userId, exp }) {
  const kedaluwarsa = new Date(exp * 1000).toISOString().slice(0, 19).replace('T', ' ');

  db.prepare(`
    INSERT OR IGNORE INTO TokenDicabut (token_hash, user_id, kedaluwarsa_pada)
    VALUES (?, ?, ?)
  `).run(hashToken(token), userId, kedaluwarsa);

  db.prepare("DELETE FROM TokenDicabut WHERE kedaluwarsa_pada < datetime('now')").run();
}

module.exports = { hashToken, sudahDicabut, cabutToken };
