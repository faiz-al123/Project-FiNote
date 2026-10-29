
import { request } from './client'
import { getToken } from './auth.api'

// Menghasilkan tanggal lokal dengan format YYYY-MM-DD.
function tanggalLokal() {
  const d = new Date()
  const bulan = String(d.getMonth() + 1).padStart(2, '0')
  const hari = String(d.getDate()).padStart(2, '0')

  return `${d.getFullYear()}-${bulan}-${hari}`
}

// Mengambil total pengeluaran harian dan bulanan.
export async function getDashboardSummary() {
  const res = await request(
    `/dashboard/summary?tanggal=${tanggalLokal()}`,
    { token: getToken() },
  )

  return res.data
}

// Mengambil pengeluaran per kategori untuk grafik bulan berjalan.
export async function getDashboardCategorySummary() {
  const res = await request(
    `/dashboard/category-summary?tanggal=${tanggalLokal()}`,
    { token: getToken() },
  )

  return res.data
}
