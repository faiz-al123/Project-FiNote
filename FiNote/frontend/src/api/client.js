const BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'
).replace(/\/$/, '')

const TIMEOUT_MS = 15000

export class ApiError extends Error {
  constructor(message, status = 0, data = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

export async function request(
  path,
  { method = 'GET', body, token } = {},
) {
  const controller = new AbortController()

  const timer = setTimeout(() => {
    controller.abort()
  }, TIMEOUT_MS)

  const headers = {
    Accept: 'application/json',
  }

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  let response

  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    })
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new ApiError(
        'Server terlalu lama merespons. Pastikan backend berjalan dengan benar.',
      )
    }

    throw new ApiError(
      `Tidak dapat terhubung ke backend di ${BASE_URL}. Pastikan backend sudah berjalan di port 3000.`,
    )
  } finally {
    clearTimeout(timer)
  }

  const text = await response.text()

  let data = null

  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = null
    }
  }

  if (!response.ok || data?.success === false) {
    throw new ApiError(
      data?.message ||
        `Permintaan gagal dengan kode ${response.status}.`,
      response.status,
      data,
    )
  }

  return data
}