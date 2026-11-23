// Validasi untuk halaman Profil (BE-08).
// Setiap fungsi mengembalikan teks pesan error, atau null jika valid.
// Teks pesan yang tertulis di kartu Trello dipakai persis (tanpa titik akhir).

const { EMAIL_REGEX } = require('./auth.validator');

const USERNAME_MAKS = 50;
const PASSWORD_MIN = 8;
const PASSWORD_MAKS = 72; // batas bcrypt: lebih dari ini diam-diam terpotong

// PUT /api/profil  -> boleh mengirim username saja, email saja, atau keduanya
function validateUbahProfil(body) {
  const { username, email } = body;

  if (username === undefined && email === undefined) {
    return 'Username atau email wajib diisi.';
  }

  if (username !== undefined) {
    if (typeof username !== 'string' || username.trim() === '') {
      return 'Username tidak boleh kosong.';
    }
    if (username.trim().length > USERNAME_MAKS) {
      return `Username maksimal ${USERNAME_MAKS} karakter.`;
    }
  }

  if (email !== undefined) {
    if (typeof email !== 'string' || email.trim() === '') {
      return 'Email tidak boleh kosong.';
    }
    // Skenario 2 kartu BE-08
    if (!EMAIL_REGEX.test(email.trim())) {
      return 'Format Email tidak valid';
    }
  }

  return null;
}

// PUT /api/profil/password
function validateGantiPassword(body) {
  const { password_lama, password_baru, konfirmasi_password } = body;

  const semuaTerisi = [password_lama, password_baru, konfirmasi_password].every(
    (nilai) => typeof nilai === 'string' && nilai !== '',
  );
  if (!semuaTerisi) {
    return 'Password lama, password baru, dan konfirmasi password wajib diisi.';
  }

  // Skenario 6: kurang dari 8 karakter atau mengandung spasi
  if (password_baru.length < PASSWORD_MIN || /\s/.test(password_baru)) {
    return 'Password min.8 karakter tanpa spasi';
  }
  if (password_baru.length > PASSWORD_MAKS) {
    return `Password maksimal ${PASSWORD_MAKS} karakter.`;
  }

  // Skenario 7: konfirmasi tidak sama
  if (konfirmasi_password !== password_baru) {
    return 'Password tidak sesuai';
  }

  return null;
}

module.exports = { validateUbahProfil, validateGantiPassword };
