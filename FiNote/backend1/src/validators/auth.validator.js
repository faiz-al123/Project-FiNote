const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 8;

function validateRegister(body) {
  const nama = String(body.nama || '').trim();
  const email = String(body.email || '').trim();
  const password = String(body.password || '');

  if (!nama || !email || !password) {
    return 'Nama, email, dan password wajib diisi.';
  }

  if (!EMAIL_REGEX.test(email)) {
    return 'Format email tidak valid.';
  }

  if (password.length < MIN_PASSWORD) {
    return `Password minimal ${MIN_PASSWORD} karakter.`;
  }

  return null;
}

function validateLogin(body) {
  const identifier = String(
    body.identifier ??
    body.email ??
    '',
  ).trim();

  const password = String(
    body.password || '',
  );

  if (!identifier || !password) {
    return 'Username/email dan password wajib diisi.';
  }

  // JANGAN memvalidasi identifier dengan EMAIL_REGEX.
  //
  // Karena identifier bisa berupa:
  // - email
  // - nama/username
  //
  // Contoh:
  // faiz@gmail.com  -> valid
  // Faiz Faresi     -> valid

  return null;
}

module.exports = {
  validateRegister,
  validateLogin,
};