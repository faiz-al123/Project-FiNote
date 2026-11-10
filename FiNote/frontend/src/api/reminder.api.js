import { request } from './client'
import { getToken } from './auth.api'

// Mengambil tanggal lokal browser (YYYY-MM-DD).
function getLocalDate() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

// GET /api/pengingat
// Mengembalikan { bulan, tanggal_acuan, filter, search, ringkasan, reminders }
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

// POST /api/pengingat
// payload: { deskripsi, kategori_id, jumlah, tanggal: 'YYYY-MM-DD' }
export async function createReminder(payload) {
  const result = await request('/pengingat', {
    method: 'POST',
    body: payload,
    token: getToken(),
  })

  return result.data?.reminder
}

// PUT /api/pengingat/:id  (belum dipakai di UI, disiapkan untuk fitur ubah)
export async function updateReminder(id, payload) {
  const result = await request(`/pengingat/${id}`, {
    method: 'PUT',
    body: payload,
    token: getToken(),
  })

  return result.data?.reminder
}

// PATCH /api/pengingat/:id/selesai
export async function completeReminder(id) {
  const result = await request(`/pengingat/${id}/selesai`, {
    method: 'PATCH',
    token: getToken(),
  })

  return result.data?.reminder
}

// DELETE /api/pengingat/:id
export async function deleteReminder(id) {
  const result = await request(`/pengingat/${id}`, {
    method: 'DELETE',
    token: getToken(),
  })

  return result.data
}