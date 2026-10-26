
import { useState } from 'react'
import loginImage from '../../assets/login1.png'
import { login, saveSession } from '../../api/auth.api'

// --- IKON EMAIL ---
function EmailIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </svg>
  )
}

// --- IKON PASSWORD ---
function LockIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="5" y="10" width="14" height="10" rx="1" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      <circle cx="12" cy="15" r="1" />
    </svg>
  )
}

// --- IKON TAMPILKAN PASSWORD ---
function EyeIcon({ hidden }) {
  if (hidden) {
    return (
      <svg
        width="21"
        height="21"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M3 3l18 18" />
        <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
        <path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c5 0 8.5 4 9.5 7-.4 1.2-1.2 2.5-2.3 3.6" />
        <path d="M6.2 6.2C4.4 7.4 3.2 9.2 2.5 12c1 3 4.5 7 9.5 7 1 0 1.9-.2 2.8-.5" />
      </svg>
    )
  }

  return (
    <svg
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  )
}

// --- HALAMAN LOGIN ---
function LoginPage({
  onLoginSuccess,
  onRegisterClick,
}) {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
  })

  // --- INPUT FORM ---
  const handleChange = (event) => {
    const { name, value } = event.target

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }))

    if (errorMessage) {
      setErrorMessage('')
    }
  }

  // --- VALIDASI FRONTEND ---
  // Username/email kosong tetap ditolak di frontend.
  // Password kosong diteruskan ke backend agar backend
  // yang mengembalikan pesan validasi melalui API.
  const validateForm = () => {
    const identifier = formData.identifier.trim()

    if (!identifier) {
      return 'Username/email wajib diisi.'
    }

    return ''
  }

  // --- PESAN ERROR LOGIN ---
  const getLoginErrorMessage = (error) => {
    // 400: validasi input dari backend.
    if (error?.status === 400) {
      return (
        error?.message ||
        'Username/email dan password wajib diisi.'
      )
    }

    // 401: akun tidak ditemukan atau password salah.
    if (error?.status === 401) {
      return 'Username/email atau password salah. Silakan coba kembali.'
    }

    // 409: konflik data, jika dikembalikan backend.
    if (error?.status === 409) {
      return error.message
    }

    // Kegagalan koneksi atau error lainnya.
    if (!error?.message) {
      return 'Login gagal. Silakan coba kembali.'
    }

    return error.message
  }

  // --- PROSES LOGIN ---
  const handleSubmit = async (event) => {
    event.preventDefault()

    if (isLoading) {
      return
    }

    const validationError = validateForm()

    if (validationError) {
      setErrorMessage(validationError)
      return
    }

    setIsLoading(true)
    setErrorMessage('')

    try {
      // Request tetap dikirim ketika password kosong.
      // Backend akan memvalidasi input tersebut.
      const { user, token } = await login({
        identifier: formData.identifier.trim(),
        password: formData.password,
      })

      // Sesi disimpan hanya jika login berhasil.
      saveSession({
        token,
        user,
      })

      onLoginSuccess(user)
    } catch (error) {
      setErrorMessage(getLoginErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="login-page">

      {/* BAGIAN KIRI */}
      <section className="login-left">
        <img
          src={loginImage}
          alt="FiNote - Kelola Keuangan, Raih Masa Depan"
        />
      </section>

      {/* BAGIAN KANAN */}
      <section className="login-right">
        <div className="login-container">

          <h1>Selamat Datang</h1>

          <p className="login-subtitle">
            masuk ke akun FiNote kamu
          </p>

          <form onSubmit={handleSubmit} noValidate>

            {/* USERNAME / EMAIL */}
            <div className="login-input">
              <span className="input-icon">
                <EmailIcon />
              </span>

              <input
                type="text"
                name="identifier"
                placeholder="Username atau Email"
                value={formData.identifier}
                onChange={handleChange}
                autoComplete="username"
                aria-label="Username atau Email"
                aria-invalid={Boolean(errorMessage)}
              />
            </div>

            {/* PASSWORD */}
            <div className="login-input">
              <span className="input-icon">
                <LockIcon />
              </span>

              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                autoComplete="current-password"
                aria-label="Password"
                aria-invalid={Boolean(errorMessage)}
              />

              <button
                type="button"
                className="password-button"
                onClick={() => {
                  setShowPassword((previous) => !previous)
                }}
                aria-label={
                  showPassword
                    ? 'Sembunyikan password'
                    : 'Tampilkan password'
                }
              >
                <EyeIcon hidden={!showPassword} />
              </button>
            </div>

            {/* PESAN ERROR */}
            {errorMessage && (
              <p
                className="login-error"
                role="alert"
                aria-live="polite"
              >
                {errorMessage}
              </p>
            )}

            {/* TOMBOL LOGIN */}
            <button
              type="submit"
              className="login-button"
              disabled={isLoading}
            >
              {isLoading ? 'Memproses...' : 'Masuk'}
            </button>

          </form>

          {/* NAVIGASI REGISTRASI */}
          <p className="register-text">
            belum punya akun?{' '}
            <button
              type="button"
              className="register-link register-link-button"
              onClick={onRegisterClick}
            >
              Daftar disini
            </button>
          </p>

        </div>
      </section>

    </main>
  )
}

export default LoginPage
