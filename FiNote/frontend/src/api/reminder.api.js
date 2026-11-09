
import { request } from './client'
import { getToken } from './auth.api'

// Mengambil tanggal lokal browser.
function getLocalDate() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

// GET /api/pengingat
export async function getReminders(filters = {}) {
  const params = new URLSearchParams()

  params.set('bulan', filters.bulan || getLocalDate().slice(0, 7))
  params.set('tanggal', filters.tanggal || getLocalDate())
  params.set('filter', filters.filter || 'semua')

  if (filters.search?.trim()) {
    params.set('search', filters.search.trim())
  }

  const result = await request(
    `/pengingat?${params.toString()}`,
    { token: getToken() },
  )

  return result.data
}
