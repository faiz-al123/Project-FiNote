// category.service.js
// Menggunakan API node:sqlite (DatabaseSync), bukan callback sqlite3.

const db = require('../config/db');
const AppError = require('../utils/appError');

function getAllCategories() {
  const statement = db.prepare(`
    SELECT kategori_id, nama_kategori
    FROM Kategori
    ORDER BY nama_kategori COLLATE NOCASE ASC
  `);

  return statement.all();
}

function createCategory(nama_kategori) {
  const nama = String(nama_kategori ?? '').trim();

  if (!nama) {
    throw new AppError('Nama kategori wajib diisi.', 400);
  }

  try {
    const result = db.prepare(`
      INSERT INTO Kategori (nama_kategori)
      VALUES (?)
    `).run(nama);

    return {
      kategori_id: Number(result.lastInsertRowid),
      nama_kategori: nama,
    };
  } catch (error) {
    if (
      error.code === 'SQLITE_CONSTRAINT_UNIQUE' ||
      error.code === 'SQLITE_CONSTRAINT_PRIMARYKEY' ||
      error.errcode === 2067 ||
      error.errcode === 1555
    ) {
      throw new AppError(
        'Nama kategori sudah digunakan.',
        409
      );
    }

    throw error;
  }
}

module.exports = {
  getAllCategories,
  createCategory,
};