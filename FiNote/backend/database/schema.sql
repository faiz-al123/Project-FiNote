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
-- TAGIHAN
-- Catatan tagihan yang harus dibayar (status masih tentatif
-- lingkupnya - lihat catatan klarifikasi di charter)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS Tagihan (
    tagihan_id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id             INTEGER NOT NULL,
    nama_tagihan        TEXT NOT NULL,
    jumlah              REAL NOT NULL CHECK (jumlah > 0),
    tanggal_jatuh_tempo TEXT NOT NULL,
    status              TEXT NOT NULL
                        DEFAULT 'belum_dibayar'
                        CHECK (status IN ('belum_dibayar', 'sudah_dibayar')),

    FOREIGN KEY (user_id)
        REFERENCES User(user_id)
        ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- INDEX - untuk query dashboard/laporan yang sering difilter
-- per user, per tanggal, per kategori
-- ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_transaksi_user_tanggal ON Transaksi(user_id, tanggal);
CREATE INDEX IF NOT EXISTS idx_transaksi_kategori ON Transaksi(kategori_id);
CREATE INDEX IF NOT EXISTS idx_budget_user_periode ON Budget(user_id, periode);
CREATE INDEX IF NOT EXISTS idx_tagihan_user_status ON Tagihan(user_id, status);