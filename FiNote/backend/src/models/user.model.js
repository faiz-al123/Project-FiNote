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

// Mencari user berdasarkan nama (tanpa membedakan huruf besar/kecil).
// Dipakai saat register untuk mencegah nama kembar.
function findByNama(nama) {
  return db
    .prepare('SELECT user_id FROM User WHERE LOWER(nama) = LOWER(?)')
    .get(nama);
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
  findByNama,
  findByIdentifier,
  findById,
  create,
};