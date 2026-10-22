// Helper tanggal. Semua tanggal memakai format YYYY-MM-DD (zona waktu server).

function pad(n) {
  return String(n).padStart(2, '0');
}

// Tanggal hari ini: "2026-10-22"
function tanggalHariIni() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Cek format YYYY-MM-DD dan pastikan tanggalnya benar-benar ada
// (misalnya 2026-02-30 ditolak).
function tanggalValid(teks) {
  if (typeof teks !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(teks)) return false;
  const [y, m, d] = teks.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

// Ambil bagian bulan dari tanggal: "2026-10-22" -> "2026-10"
function bulanDariTanggal(tanggal) {
  return tanggal.slice(0, 7);
}

module.exports = { tanggalHariIni, tanggalValid, bulanDariTanggal };
