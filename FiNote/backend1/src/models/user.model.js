const db = require('../config/db');

function findByEmail(email) {
  return db
    .prepare('SELECT * FROM User WHERE email = ?')
    .get(email);
}

// Mencari user berdasarkan email ATAU nama.
// Kolom "nama" digunakan sebagai username.
function findByIdentifier(identifier) {
  return db
    .prepare(`
      SELECT *
      FROM User
      WHERE LOWER(email) = LOWER(?)
         OR LOWER(nama) = LOWER(?)
      LIMIT 1
    `)
    .get(identifier, identifier);
}

function findById(userId) {
  return db
    .prepare(`
      SELECT user_id, nama, email, created_at
      FROM User
      WHERE user_id = ?
    `)
    .get(userId);
}

function create({ nama, email, hashedPassword }) {
  const hasil = db
    .prepare(`
      INSERT INTO User (nama, email, password)
      VALUES (?, ?, ?)
    `)
    .run(nama, email, hashedPassword);

  return findById(hasil.lastInsertRowid);
}

module.exports = {
  findByEmail,
  findByIdentifier,
  findById,
  create,
};