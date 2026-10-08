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

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function RegisterPage({ onRegisterSuccess, onLoginClick }) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

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

    if (errorMessage) {
      setErrorMessage('')
    }
  }

  const validateForm = () => {
    const username = formData.username.trim()
    const email = formData.email.trim()

    if (
      !username ||
      !email ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      return 'Username, email, dan password wajib diisi.'
    }

    if (!EMAIL_REGEX.test(email)) {
      return 'Format email tidak valid.'
    }

    if (formData.password.length < 8) {
      return 'Password minimal 8 karakter.'
    }

    if (formData.password !== formData.confirmPassword) {
      return 'Konfirmasi password tidak sesuai.'
    }

    return ''
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (isLoading) return

    const validationError = validateForm()

    if (validationError) {
      setErrorMessage(validationError)
      return
    }

    setIsLoading(true)
    setErrorMessage('')

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
        setErrorMessage('akun anda sudah pernah terdaftar')
      } else {
        setErrorMessage(error.message)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="register-page">

      {/* =========================
          BAGIAN KIRI
      ========================== */}
      <section className="register-left">
        <div className="register-container">

          <h1>Daftar Akun</h1>

          <form onSubmit={handleSubmit} noValidate>

            {/* USERNAME */}
            <div className="register-input">
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
              />
            </div>

            {/* EMAIL */}
            <div className="register-input">
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
              />
            </div>

            {/* PASSWORD */}
            <div className="register-input">
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

            {/* KONFIRMASI PASSWORD */}
            <div className="register-input">
              <span className="input-icon">
                <LockIcon />
              </span>

              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                placeholder="konfirmasi Password"
                value={formData.confirmPassword}
                onChange={handleChange}
                autoComplete="new-password"
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

            {/* PESAN ERROR */}
            {errorMessage && (
              <p className="register-error" role="alert">
                <span className="register-error-icon">ⓘ</span>
                {errorMessage}
              </p>
            )}

            {/* DAFTAR */}
            <button
              type="submit"
              className="register-button"
              disabled={isLoading}
            >
              {isLoading ? 'Memproses...' : 'Daftar'}
            </button>

          </form>

          {/* LOGIN */}
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

      {/* =========================
          BAGIAN KANAN
      ========================== */}
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