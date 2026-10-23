import { useState } from 'react'
import registerImage from '../../assets/register.png'
import { register, saveSession } from '../../api/auth.api'

function UserIcon() {
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
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.5-7 8-7s8 3 8 7" />
    </svg>
  )
}

function MailIcon() {
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
      <rect x="3" y="5" width="18" height="14" rx="1" />
      <path d="m3 7 9 7 9-7" />
    </svg>
  )
}

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

// Ikon (i) merah di sebelah kiri pesan error
function ErrorIcon() {
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
      <circle cx="12" cy="12" r="9.5" />
      <path d="M12 11v6" />
      <circle cx="12" cy="7.5" r="0.6" fill="currentColor" />
    </svg>
  )
}

// Pesan error di bawah masing-masing kolom input
function FieldError({ message }) {
  if (!message) return null

  return (
    <p className="field-error" role="alert">
      <ErrorIcon />
      <span>{message}</span>
    </p>
  )
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Pesan error sesuai kondisi pada desain UI/UX
const MESSAGES = {
  username: 'username min. 3 karakter',
  emailInvalid: 'email tidak valid',
  emailRequired: 'email wajib diisi',
  emailRegistered: 'akun anda sudah pernah terdaftar',
  usernameTaken: 'username sudah dipakai',
  password: 'password min. 8 karakter tanpa spasi',
  passwordMismatch: 'password tidak sesuai',
}

const EMPTY_ERRORS = {
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
}

function RegisterPage({ onRegisterSuccess, onLoginClick }) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Error per kolom (username, email, password, confirmPassword)
  const [errors, setErrors] = useState(EMPTY_ERRORS)

  // Error umum (mis. server mati / timeout), tampil di atas tombol Daftar
  const [generalError, setGeneralError] = useState('')

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  const handleChange = (event) => {
    const { name, value } = event.target

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }))

    // Hapus error kolom yang sedang diketik.
    // Kolom konfirmasi ikut dibersihkan saat password diubah.
    setErrors((previous) => ({
      ...previous,
      [name]: '',
      ...(name === 'password' ? { confirmPassword: '' } : {}),
    }))

    if (generalError) {
      setGeneralError('')
    }
  }

  // VALIDASI FORM REGISTER
  // Mengembalikan object error per kolom. Object kosong = form valid.
  const validateForm = () => {
    const username = formData.username.trim()
    const email = formData.email.trim()
    const { password, confirmPassword } = formData

    const newErrors = { ...EMPTY_ERRORS }

    // Username minimal 3 karakter
    if (username.length < 3) {
      newErrors.username = MESSAGES.username
    }

    // Email wajib diisi & formatnya harus valid
    if (!email) {
      newErrors.email = MESSAGES.emailRequired
    } else if (!EMAIL_REGEX.test(email)) {
      newErrors.email = MESSAGES.emailInvalid
    }

    // Password minimal 8 karakter dan tidak boleh ada spasi
    if (password.length < 8 || /\s/.test(password)) {
      newErrors.password = MESSAGES.password
    }

    // Konfirmasi password harus sama dengan password
    if (password !== confirmPassword) {
      newErrors.confirmPassword = MESSAGES.passwordMismatch
    }

    return newErrors
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (isLoading) return

    const validationErrors = validateForm()
    const hasError = Object.values(validationErrors).some(Boolean)

    setErrors(validationErrors)
    setGeneralError('')

    if (hasError) return

    setIsLoading(true)

    try {
      const { user, token } = await register({
        nama: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
      })

      saveSession({ token, user })

      onRegisterSuccess(user)
    } catch (error) {
      if (error.status === 409) {
        // Backend: "Email sudah terdaftar." atau "Nama sudah dipakai."
        const message = String(error.message || '').toLowerCase()

        if (message.includes('nama')) {
          setErrors({ ...EMPTY_ERRORS, username: MESSAGES.usernameTaken })
        } else {
          setErrors({ ...EMPTY_ERRORS, email: MESSAGES.emailRegistered })
        }
      } else {
        setGeneralError(
          error.message || 'Registrasi gagal. Silakan coba kembali.'
        )
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="register-page">
      {/* BAGIAN KIRI */}
      <section className="register-left">
        <div className="register-container">
          <h1>Daftar Akun</h1>

          <form onSubmit={handleSubmit} noValidate>
            {/* USERNAME */}
            <div className="register-field">
              <div
                className={`register-input${
                  errors.username ? ' is-invalid' : ''
                }`}
              >
                <span className="input-icon">
                  <UserIcon />
                </span>

                <input
                  type="text"
                  name="username"
                  placeholder="Username"
                  value={formData.username}
                  onChange={handleChange}
                  autoComplete="username"
                  aria-invalid={Boolean(errors.username)}
                />
              </div>

              <FieldError message={errors.username} />
            </div>

            {/* EMAIL */}
            <div className="register-field">
              <div
                className={`register-input${
                  errors.email ? ' is-invalid' : ''
                }`}
              >
                <span className="input-icon">
                  <MailIcon />
                </span>

                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                  aria-invalid={Boolean(errors.email)}
                />
              </div>

              <FieldError message={errors.email} />
            </div>

            {/* PASSWORD */}
            <div className="register-field">
              <div
                className={`register-input${
                  errors.password ? ' is-invalid' : ''
                }`}
              >
                <span className="input-icon">
                  <LockIcon />
                </span>

                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  aria-invalid={Boolean(errors.password)}
                />

                <button
                  type="button"
                  className="password-button"
                  onClick={() =>
                    setShowPassword((previous) => !previous)
                  }
                  aria-label={
                    showPassword
                      ? 'Sembunyikan password'
                      : 'Tampilkan password'
                  }
                >
                  <EyeIcon hidden={!showPassword} />
                </button>
              </div>

              <FieldError message={errors.password} />
            </div>

            {/* KONFIRMASI PASSWORD */}
            <div className="register-field">
              <div
                className={`register-input${
                  errors.confirmPassword ? ' is-invalid' : ''
                }`}
              >
                <span className="input-icon">
                  <LockIcon />
                </span>

                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  placeholder="Konfirmasi Password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                  aria-invalid={Boolean(errors.confirmPassword)}
                />

                <button
                  type="button"
                  className="password-button"
                  onClick={() =>
                    setShowConfirmPassword((previous) => !previous)
                  }
                  aria-label={
                    showConfirmPassword
                      ? 'Sembunyikan konfirmasi password'
                      : 'Tampilkan konfirmasi password'
                  }
                >
                  <EyeIcon hidden={!showConfirmPassword} />
                </button>
              </div>

              <FieldError message={errors.confirmPassword} />
            </div>

            {/* ERROR UMUM (server mati, timeout, dll.) */}
            {generalError && (
              <p className="register-error" role="alert">
                <ErrorIcon />
                <span>{generalError}</span>
              </p>
            )}

            {/* TOMBOL DAFTAR */}
            <button
              type="submit"
              className="register-button"
              disabled={isLoading}
            >
              {isLoading ? 'Memproses...' : 'Daftar'}
            </button>
          </form>

          {/* LINK LOGIN */}
          <p className="login-text">
            Sudah punya akun?{' '}
            <button
              type="button"
              className="login-link"
              onClick={onLoginClick}
            >
              masuk disini
            </button>
          </p>
        </div>
      </section>

      {/* BAGIAN KANAN */}
      <section className="register-right">
        <img
          src={registerImage}
          alt="FiNote - Kelola Keuangan, Raih Masa Depan"
        />
      </section>
    </main>
  )
}

export default RegisterPage