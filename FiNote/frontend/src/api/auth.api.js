// Pemanggilan endpoint /auth/* dan penyimpanan sesi autentikasi.
// Lihat backend/API_CONTRACT.md untuk bentuk request & response.

import { request } from './client'

const TOKEN_KEY = 'finote_token'
const USER_KEY = 'finote_user'

// POST /auth/register -> { user, token }
export async function register({ nama, email, password }) {
  const res = await request('/auth/register', {
    method: 'POST',
    body: {
      nama,
      email,
      password,
    },
  })

  return res.data
}

// POST /auth/login -> { user, token }
export async function login({ identifier, password }) {
  const res = await request('/auth/login', {
    method: 'POST',
    body: {
      identifier,
      password,
    },
  })

  return res.data
}

// GET /auth/me -> user
export async function getCurrentUser(token) {
  const res = await request('/auth/me', {
    token,
  })

  return res.data.user
}

export function saveSession({ token, user }) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token)
  }

  if (user) {
    localStorage.setItem(
      USER_KEY,
      JSON.stringify(user),
    )
  }
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}