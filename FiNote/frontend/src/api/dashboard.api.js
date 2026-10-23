// Pemanggilan endpoint /dashboard/*
import { request } from './client'
import { getToken } from './auth.api'

// Tanggal lokal pengguna (bukan UTC) -> "YYYY-MM-DD".
// Dikirim ke backend supaya "hari ini" sesuai zona waktu pengguna.
function tanggalLokal() {
  const d = new Date()
  const bulan = String(d.getMonth() + 1).padStart(2, '0')
  const hari = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${bulan}-${hari}`
}

// GET /dashboard/summary?tanggal=YYYY-MM-DD
// -> { tanggal, bulan, total_pengeluaran_hari_ini, total_pengeluaran_bulan_ini }
export async function getDashboardSummary() {
  const res = await request(
    `/dashboard/summary?tanggal=${tanggalLokal()}`,
    { token: getToken() },
  )
  return res.data
}