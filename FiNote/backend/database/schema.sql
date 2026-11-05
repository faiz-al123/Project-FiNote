PRAGMA foreign_keys = ON;

-- ------------------------------------------------------------
-- USER
-- Entitas pusat - semua data keuangan terikat ke satu pengguna
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS User (
  user_id     INTEGER PRIMARY KEY AUTOINCREMENT,
  nama        TEXT NOT NULL,
  email       TEXT NOT NULL UNIQUE,
  password    TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ------------------------------------------------------------
-- KATEGORI
-- Predefined oleh sistem, dipakai Transaksi dan Budget
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS Kategori (
  kategori_id     INTEGER PRIMARY KEY AUTOINCREMENT,
  nama_kategori   TEXT NOT NULL UNIQUE
);

-- ------------------------------------------------------------
-- TRANSAKSI
-- Pencatatan harian pemasukan/pengeluaran pengguna
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS Transaksi (
  transaksi_id   INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id        INTEGER NOT NULL,
  kategori_id    INTEGER NOT NULL,
  jumlah         REAL NOT NULL CHECK (jumlah > 0),
  tanggal        TEXT NOT NULL,
  catatan        TEXT,
  created_at     TEXT NOT NULL DEFAULT (datetime('now')),

  FOREIGN KEY (user_id)
      REFERENCES User(user_id)
      ON DELETE CASCADE,

  FOREIGN KEY (kategori_id)
      REFERENCES Kategori(kategori_id)
      ON DELETE RESTRICT
);

-- ------------------------------------------------------------
-- BUDGET
-- Batas pengeluaran per kategori per periode
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS Budget (
  budget_id      INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id        INTEGER NOT NULL,
  kategori_id    INTEGER NOT NULL,
  jumlah_limit   REAL NOT NULL CHECK (jumlah_limit > 0),
  periode        TEXT NOT NULL,

  FOREIGN KEY (user_id)
    REFERENCES User(user_id)
    ON DELETE CASCADE,

  FOREIGN KEY (kategori_id)
    REFERENCES Kategori(kategori_id)
    ON DELETE RESTRICT,

  UNIQUE (user_id, kategori_id, periode)
);

-- ------------------------------------------------------------
-- INDEX - untuk query dashboard/laporan yang sering difilter
-- per user, per tanggal, per kategori
-- ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_transaksi_user_tanggal ON Transaksi(user_id, tanggal);
CREATE INDEX IF NOT EXISTS idx_transaksi_kategori ON Transaksi(kategori_id);
CREATE INDEX IF NOT EXISTS idx_budget_user_periode ON Budget(user_id, periode);
-- Nama (dipakai sebagai username) tidak boleh kembar, huruf besar/kecil dianggap sama
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_nama_unik ON User(nama COLLATE NOCASE);

-- Kategori bawaan sistem (BE-04)
INSERT OR IGNORE INTO Kategori (nama_kategori) VALUES
  ('Makanan'), ('Transportasi'), ('Belanja'), ('Tagihan'), ('Hiburan'), ('Lainnya');

-- ------------------------------------------------------------
-- PENGINGAT (BE-06, BE-07)
-- Daftar pengingat pengeluaran atau tagihan milik pengguna.
-- 4 kolom input: nama_pengingat, jenis, jumlah, tanggal_jatuh_tempo.
-- Pengingat yang ditandai selesai tidak dihapus, hanya berubah status
-- (dan tercatat di selesai_pada) sehingga masuk hitungan "selesai".
-- ------------------------------------------------------------
-- Tabel lama bernama Tagihan diganti oleh tabel ini (tidak pernah dipakai kode).
DROP TABLE IF EXISTS Tagihan;

CREATE TABLE IF NOT EXISTS Pengingat (
  pengingat_id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id              INTEGER NOT NULL,
  nama_pengingat       TEXT NOT NULL,
  jenis                TEXT NOT NULL CHECK (jenis IN ('pengeluaran', 'tagihan')),
  jumlah               REAL NOT NULL CHECK (jumlah > 0),
  tanggal_jatuh_tempo  TEXT NOT NULL,
  status               TEXT NOT NULL DEFAULT 'belum_selesai'
                       CHECK (status IN ('belum_selesai', 'selesai')),
  selesai_pada         TEXT,
  created_at           TEXT NOT NULL DEFAULT (datetime('now')),

  FOREIGN KEY (user_id)
    REFERENCES User(user_id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_pengingat_user_tanggal ON Pengingat(user_id, tanggal_jatuh_tempo);
