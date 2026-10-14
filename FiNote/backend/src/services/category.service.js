// test
// category.service.js
const db = require('../config/db');

async function getAllCategories() {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT kategori_id, nama_kategori
       FROM Kategori
       ORDER BY nama_kategori ASC`,
      [],
      (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      }
    );
  });
}

async function createCategory(nama_kategori) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO Kategori (nama_kategori) VALUES (?)`,
      [nama_kategori],
      function (err) {
        if (err) return reject(err);

        resolve({
          kategori_id: this.lastID,
          nama_kategori,
        });
      }
    );
  });
}

module.exports = {
  getAllCategories,
  createCategory,
};