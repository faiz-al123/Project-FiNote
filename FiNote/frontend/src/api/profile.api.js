// Pemanggilan endpoint /profil/* (halaman Profil).
// Pesan error dari backend sudah sesuai user story, jadi dipakai apa adanya.

import { request } from './client'
import { getToken } from './auth.api'

// GET /profil -> { profile: { user_id, username, email, bergabung_sejak, ... } }
export async function getProfile() {
  const res = await request('/profil', { token: getToken() })

  return res.data.profile
}

// PUT /profil -> profil terbaru. Boleh mengirim username saja, email saja, atau keduanya.
export async function updateProfile({ username, email }) {
  const body = {}

  if (username !== undefined) body.username = username
  if (email !== undefined) body.email = email

  const res = await request('/profil', {
    method: 'PUT',
    token: getToken(),
    body,
  })

  return res.data.profile
}

// PUT /profil/password
export async function changePassword({
  passwordLama,
  passwordBaru,
  konfirmasiPassword,
}) {
  const res = await request('/profil/password', {
    method: 'PUT',
    token: getToken(),
    body: {
      password_lama: passwordLama,
      password_baru: passwordBaru,
      konfirmasi_password: konfirmasiPassword,
    },
  })

  return res.message
}