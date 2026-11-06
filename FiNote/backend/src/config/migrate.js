// Menyiapkan database saat server start: migrasi kecil + menjalankan schema.sql.

// Tabel Pengingat versi awal (kolom nama_pengingat/jenis) belum pernah punya endpoint
// untuk mengisi data, jadi aman dibuang dan dibuat ulang sesuai desain terbaru
// (deskripsi, kategori, nominal, tanggal). Setelah dibuat ulang, bagian ini tidak
// pernah menghapus apa pun lagi.
function siapkanDatabase(db, sqlSchema) {
  const kolom = db.prepare('PRAGMA table_info(Pengingat)').all().map((k) => k.name);
  if (kolom.includes('nama_pengingat')) {
    db.exec('DROP TABLE Pengingat');
  }

  db.exec(sqlSchema);
}

module.exports = { siapkanDatabase };
