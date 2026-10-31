
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

  if (!response.ok || result?.success === false) {
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
 */
export async function createTransaction(payload) {
  return request('/transaksi', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

/**
 * Mengambil satu halaman riwayat transaksi.
 *
 * Filter backend:
 * - tanggal
 * - kategori_id
 * - search
 * - page
 * - limit
 */
export async function getTransactionHistory(filters = {}) {
  const params = new URLSearchParams()

  if (filters.tanggal) {
    params.set('tanggal', filters.tanggal)
  }

  if (filters.kategori_id) {
    params.set('kategori_id', filters.kategori_id)
  }

  if (filters.search) {
    params.set('search', filters.search)
  }

  params.set('page', filters.page || 1)
  params.set('limit', filters.limit || 15)

  return request(`/transaksi?${params.toString()}`, {
    method: 'GET',
  })
}

/**
 * Mengambil seluruh riwayat transaksi.
 *
 * Backend membatasi maksimal 100 data dalam satu permintaan.
 * Karena itu, fungsi ini mengambil halaman berikutnya sampai
 * seluruh data milik pengguna berhasil diperoleh.
 *
 * Digunakan agar filter nominal minimum/maksimum di frontend
 * dapat diterapkan pada seluruh data, bukan hanya 15 baris.
 */
export async function getAllTransactionHistory(filters = {}) {
  const limit = 100
  let page = 1
  let totalPages = 1
  const allTransactions = []

  do {
    const result = await getTransactionHistory({
      ...filters,
      page,
      limit,
    })

    const data = result?.data || result
    const transactions = Array.isArray(data?.transactions)
      ? data.transactions
      : []

    allTransactions.push(...transactions)

    totalPages = Number(data?.pagination?.total_pages) || 1
    page += 1
  } while (page <= totalPages)

  return allTransactions
}
