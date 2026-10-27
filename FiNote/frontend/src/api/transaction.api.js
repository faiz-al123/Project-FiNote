
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

const BASE_URL = API_URL.replace(/\/+$/, '').endsWith('/api')
  ? API_URL.replace(/\/+$/, '')
  : `${API_URL.replace(/\/+$/, '')}/api`

function getToken() {
  return (
    localStorage.getItem('finote_token') ||
    localStorage.getItem('token') ||
    localStorage.getItem('accessToken')
  )
}

async function request(endpoint, options = {}) {
  const token = getToken()

  if (!token) {
    throw new Error('Sesi login tidak ditemukan. Silakan login kembali.')
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  })

  const result = await response.json().catch(() => ({}))

  if (!response.ok) {
    const message =
      result.message ||
      result.error ||
      result.errors?.[0]?.message ||
      `Permintaan gagal dengan status ${response.status}.`

    const error = new Error(message)
    error.status = response.status
    error.data = result

    throw error
  }

  return result
}

/**
 * Mengambil daftar kategori untuk form transaksi.
 */
export async function getTransactionCategories() {
  return request('/kategori', {
    method: 'GET',
  })
}

/**
 * Menyimpan transaksi pengeluaran.
 *
 * Payload:
 * {
 *   kategori_id: number,
 *   jumlah: number,
 *   tanggal?: string,
 *   catatan?: string
 * }
 *
 * Tanggal tidak dikirim jika pengguna tidak memilih tanggal.
 * Backend bertanggung jawab menggunakan tanggal hari ini.
 */
export async function createTransaction(payload) {
  return request('/transaksi', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
