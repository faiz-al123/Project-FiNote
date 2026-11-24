import { useEffect, useRef, useState } from 'react'

import AppLayout from '../../components/layout/AppLayout'
import ProfileSkeleton from './ProfileSkeleton'

import {
  getProfile,
  updateProfile,
  changePassword,
} from '../../api/profile.api'

import './ProfilePage.css'

/* =========================================
   KONSTANTA
   Aturan sama dengan backend (profile.validator.js)
========================================= */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const USERNAME_MAX = 50
const PASSWORD_MIN = 8
const PASSWORD_MAX = 72

const MIN_LOADING_MS = 500 // skeleton tampil minimal, agar tidak berkedip
const NOTICE_MS = 3500

const EMPTY_PASSWORDS = { current: '', next: '', confirm: '' }

/* =========================================
   IKON (SVG)
========================================= */

const iconProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
}

function UserIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 20.5a7.5 7.5 0 0 1 15 0" />
    </svg>
  )
}

function MailIcon() {
  return (
    <svg {...iconProps}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3.5 7 8.5 6 8.5-6" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg {...iconProps}>
      <rect x="4.5" y="10.5" width="15" height="10" rx="2" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
    </svg>
  )
}

function EyeIcon() {
  return (
    <svg {...iconProps}>
      <path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg {...iconProps}>
      <path d="M3 3l18 18" />
      <path d="M10.6 5.7A10.5 10.5 0 0 1 12 5.5c6.4 0 10 6.5 10 6.5a17 17 0 0 1-3.2 3.9" />
      <path d="M6.6 6.7C3.9 8.4 2 12 2 12s3.6 6.5 10 6.5c1.5 0 2.9-.4 4.1-.9" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg {...iconProps} strokeWidth={2.2}>
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  )
}

function RefreshIcon() {
  return (
    <svg {...iconProps}>
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  )
}

function LogoutIcon() {
  return (
    <svg {...iconProps}>
      <path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4" />
      <path d="M15 8l4 4-4 4" />
      <path d="M19 12H9" />
    </svg>
  )
}

function AlertIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="currentColor" />
      <path
        d="M12 7v6M12 16.5v.5"
        stroke="#fff"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg {...iconProps} strokeWidth={2.2}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  )
}

/* =========================================
   FUNGSI BANTU
========================================= */

// "2026-11-09" -> "November 2026"
function formatJoined(value) {
  if (!value) return '-'

  const date = new Date(`${value}T00:00:00`)

  if (Number.isNaN(date.getTime())) return '-'

  const text = new Intl.DateTimeFormat('id-ID', {
    month: 'long',
    year: 'numeric',
  }).format(date)

  return text.charAt(0).toUpperCase() + text.slice(1)
}

/* =========================================
   KOMPONEN KECIL
========================================= */

function FieldError({ id, message }) {
  if (!message) return null

  return (
    <p className="profile-field-error" id={id} role="alert">
      <AlertIcon />
      <span>{message}</span>
    </p>
  )
}

function TextField({
  id,
  label,
  labelExtra,
  icon,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  hint,
  autoComplete,
}) {
  const errorId = `${id}-error`
  const hintId = `${id}-hint`

  return (
    <div className="profile-field">
      <div className="profile-label-row">
        <label htmlFor={id}>{label}</label>
        {labelExtra}
      </div>

      <div className={`profile-input ${error ? 'is-invalid' : ''}`}>
        <span className="profile-input-icon">{icon}</span>

        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? errorId : hint ? hintId : undefined}
        />
      </div>

      {error ? (
        <FieldError id={errorId} message={error} />
      ) : (
        hint && (
          <p className="profile-field-hint" id={hintId}>
            {hint}
          </p>
        )
      )}
    </div>
  )
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  placeholder,
  error,
  visible,
  onToggle,
  autoComplete,
}) {
  const errorId = `${id}-error`

  return (
    <div className="profile-field">
      <div className="profile-label-row">
        <label htmlFor={id}>{label}</label>
      </div>

      <div className={`profile-input ${error ? 'is-invalid' : ''}`}>
        <span className="profile-input-icon">
          <LockIcon />
        </span>

        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? errorId : undefined}
        />

        <button
          type="button"
          className="profile-eye-button"
          onClick={onToggle}
          aria-label={visible ? 'Sembunyikan password' : 'Tampilkan password'}
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>

      <FieldError id={errorId} message={error} />
    </div>
  )
}

function LogoutDialog({ onCancel, onConfirm }) {
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') onCancel()
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onCancel])

  return (
    <div className="profile-overlay" onClick={onCancel}>
      <div
        className="profile-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-logout-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="profile-dialog-close"
          onClick={onCancel}
          aria-label="Tutup"
        >
          <CloseIcon />
        </button>

        <span className="profile-dialog-icon">
          <LogoutIcon />
        </span>

        <h2 id="profile-logout-title">Keluar dari Akun?</h2>

        <p>
          Sesi login kamu di perangkat ini akan diakhiri. Pastikan semua
          catatan transaksi sudah tersimpan.
        </p>

        <div className="profile-dialog-actions">
          <button
            type="button"
            className="profile-button outline"
            onClick={onCancel}
            autoFocus
          >
            Batal
          </button>

          <button
            type="button"
            className="profile-button danger"
            onClick={onConfirm}
          >
            <LogoutIcon />
            Keluar
          </button>
        </div>
      </div>
    </div>
  )
}

/* =========================================
   HALAMAN PROFIL
========================================= */

function ProfilePage({ user, onLogout, onNavigate, onUserUpdated }) {
  // Data profil dari server
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  // Form informasi akun
  const [info, setInfo] = useState({ username: '', email: '' })
  const [infoErrors, setInfoErrors] = useState({})
  const [savingInfo, setSavingInfo] = useState(false)

  // Form ganti password
  const [passwords, setPasswords] = useState(EMPTY_PASSWORDS)
  const [visible, setVisible] = useState({
    current: false,
    next: false,
    confirm: false,
  })
  const [passwordErrors, setPasswordErrors] = useState({})
  const [savingPassword, setSavingPassword] = useState(false)

  // Notifikasi dan dialog
  const [notice, setNotice] = useState(null)
  const [showLogout, setShowLogout] = useState(false)
  const noticeTimer = useRef(null)

  /* ---------- Notifikasi ---------- */

  function showNotice(text, type = 'success') {
    window.clearTimeout(noticeTimer.current)
    setNotice({ text, type })

    noticeTimer.current = window.setTimeout(() => {
      setNotice(null)
    }, NOTICE_MS)
  }

  useEffect(() => () => window.clearTimeout(noticeTimer.current), [])

  /* ---------- Ambil data profil ---------- */

  useEffect(() => {
    let cancelled = false

    async function loadProfile() {
      setLoading(true)
      setLoadError('')

      try {
        // Skeleton tampil minimal 500 ms agar tidak berkedip
        const minimumLoading = new Promise((resolve) => {
          setTimeout(resolve, MIN_LOADING_MS)
        })

        const [data] = await Promise.all([getProfile(), minimumLoading])

        if (cancelled) return

        setProfile(data)
        setInfo({ username: data.username, email: data.email })
      } catch (error) {
        if (cancelled) return

        // Token habis atau tidak valid -> kembali ke login
        if (error.status === 401) {
          onLogout?.()
          return
        }

        setLoadError(error.message || 'Gagal memuat data profil.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadProfile()

    return () => {
      cancelled = true
    }
    // onLogout sengaja tidak dimasukkan agar data tidak dimuat ulang tanpa perlu
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadKey])

  /* ---------- Informasi akun ---------- */

  const infoDirty =
    profile !== null &&
    (info.username.trim() !== profile.username ||
      info.email.trim().toLowerCase() !== profile.email.toLowerCase())

  function handleInfoChange(field) {
    return (event) => {
      setInfo((prev) => ({ ...prev, [field]: event.target.value }))
      setInfoErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  function validateInfo() {
    const errors = {}
    const username = info.username.trim()
    const email = info.email.trim()

    if (!username) {
      errors.username = 'Username tidak boleh kosong'
    } else if (username.length > USERNAME_MAX) {
      errors.username = `Username maksimal ${USERNAME_MAX} karakter`
    }

    if (!email) {
      errors.email = 'Email tidak boleh kosong'
    } else if (!EMAIL_REGEX.test(email)) {
      errors.email = 'Format Email tidak valid' // Skenario 2
    }

    return errors
  }

  async function handleSaveInfo(event) {
    event.preventDefault()

    if (savingInfo || !infoDirty) return

    const errors = validateInfo()
    setInfoErrors(errors)

    if (Object.keys(errors).length > 0) return

    // Hanya kirim kolom yang berubah
    const payload = {}
    const username = info.username.trim()
    const email = info.email.trim()

    if (username !== profile.username) payload.username = username
    if (email.toLowerCase() !== profile.email.toLowerCase()) payload.email = email

    setSavingInfo(true)

    try {
      const updated = await updateProfile(payload)

      setProfile(updated)
      setInfo({ username: updated.username, email: updated.email })
      setInfoErrors({})
      onUserUpdated?.(updated)

      showNotice('Informasi Profile berhasil diubah') // Skenario 1
    } catch (error) {
      const message = error.message || 'Gagal menyimpan perubahan.'

      if (/username/i.test(message)) {
        setInfoErrors({ username: message.replace(/\.$/, '') })
      } else if (/email/i.test(message)) {
        setInfoErrors({ email: message.replace(/\.$/, '') })
      } else {
        showNotice(message, 'error')
      }
    } finally {
      setSavingInfo(false)
    }
  }

  // Skenario 3: kembalikan ke data semula
  function handleCancelInfo() {
    if (profile) {
      setInfo({ username: profile.username, email: profile.email })
    }

    setInfoErrors({})
    showNotice('Perubahan dibatalkan', 'info')
  }

  /* ---------- Ganti password ---------- */

  const passwordFilled =
    passwords.current !== '' ||
    passwords.next !== '' ||
    passwords.confirm !== ''

  function handlePasswordChange(field) {
    return (event) => {
      setPasswords((prev) => ({ ...prev, [field]: event.target.value }))
      setPasswordErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  function toggleVisible(field) {
    return () => setVisible((prev) => ({ ...prev, [field]: !prev[field] }))
  }

  function validatePasswords() {
    const errors = {}
    const { current, next, confirm } = passwords

    if (!current) {
      errors.current = 'Password saat ini wajib diisi'
    }

    if (!next) {
      errors.next = 'Password baru wajib diisi'
    } else if (next.length < PASSWORD_MIN || /\s/.test(next)) {
      errors.next = 'Password min.8 karakter tanpa spasi' // Skenario 6
    } else if (next.length > PASSWORD_MAX) {
      errors.next = `Password maksimal ${PASSWORD_MAX} karakter`
    }

    if (!confirm) {
      errors.confirm = 'Konfirmasi password wajib diisi'
    } else if (confirm !== next) {
      errors.confirm = 'Password tidak sesuai' // Skenario 7
    }

    return errors
  }

  async function handleChangePassword(event) {
    event.preventDefault()

    if (savingPassword || !passwordFilled) return

    const errors = validatePasswords()
    setPasswordErrors(errors)

    if (Object.keys(errors).length > 0) return

    setSavingPassword(true)

    try {
      await changePassword({
        passwordLama: passwords.current,
        passwordBaru: passwords.next,
        konfirmasiPassword: passwords.confirm,
      })

      setPasswords(EMPTY_PASSWORDS)
      setVisible({ current: false, next: false, confirm: false })
      setPasswordErrors({})

      showNotice('Password berhasil dirubah') // Skenario 4
    } catch (error) {
      const message = error.message || 'Gagal mengganti password.'

      if (/saat ini/i.test(message)) {
        setPasswordErrors({ current: message }) // Skenario 5
      } else if (/min\.8/i.test(message)) {
        setPasswordErrors({ next: message })
      } else if (/tidak sesuai/i.test(message)) {
        setPasswordErrors({ confirm: message })
      } else {
        showNotice(message, 'error')
      }
    } finally {
      setSavingPassword(false)
    }
  }

  /* ---------- Keluar ---------- */

  function handleConfirmLogout() {
    setShowLogout(false)
    onLogout?.()
  }

  /* =========================================
     TAMPILAN
  ========================================= */

  return (
    <AppLayout
      activePage="profil"
      user={user}
      onNavigate={onNavigate}
      onLogout={onLogout}
      className="profile-layout"
    >
      <div className="app-workspace profile-workspace">
        {notice && (
          <div className={`profile-notice ${notice.type}`} role="status">
            {notice.text}
          </div>
        )}

        <header className="profile-header">
          <span className="profile-header-icon">
            <UserIcon />
          </span>

          <div className="profile-heading">
            <h1>Profil akun</h1>
            <p>kelola informasi akun dan keamanan kamu disini.</p>
          </div>
        </header>

        {loading ? (
          <ProfileSkeleton />
        ) : loadError || !profile ? (
          <div className="profile-load-error" role="alert">
            <p>{loadError || 'Data profil tidak tersedia.'}</p>

            <button
              type="button"
              className="profile-button primary"
              onClick={() => setReloadKey((key) => key + 1)}
            >
              Coba lagi
            </button>
          </div>
        ) : (
          <div className="profile-content">
            <div className="profile-column">
              {/* ---------- INFORMASI AKUN ---------- */}
              <section className="profile-card" aria-labelledby="profile-info-title">
                <div className="profile-card-head">
                  <span className="profile-card-icon">
                    <UserIcon />
                  </span>

                  <div>
                    <h2 id="profile-info-title">Informasi Akun</h2>
                    <p>Perbarui username dan alamat email yang tampil di akunmu.</p>
                  </div>
                </div>

                <form onSubmit={handleSaveInfo} noValidate>
                  <div className="profile-fields-row">
                    <TextField
                      id="profile-username"
                      label="Username"
                      icon={<UserIcon />}
                      value={info.username}
                      onChange={handleInfoChange('username')}
                      error={infoErrors.username}
                      hint="Nama ini tampil di kartu profil sidebar"
                      autoComplete="username"
                    />

                    <TextField
                      id="profile-email"
                      label="Alamat Email"
                      labelExtra={
                        <span className="profile-verified-text">Terverifikasi</span>
                      }
                      icon={<MailIcon />}
                      type="email"
                      value={info.email}
                      onChange={handleInfoChange('email')}
                      error={infoErrors.email}
                      hint="Dipakai untuk masuk ke akun"
                      autoComplete="email"
                    />
                  </div>

                  <div className="profile-actions">
                    <button
                      type="button"
                      className="profile-button outline"
                      onClick={handleCancelInfo}
                    >
                      Batal
                    </button>

                    <button
                      type="submit"
                      className="profile-button primary"
                      disabled={!infoDirty || savingInfo}
                    >
                      <CheckIcon />
                      {savingInfo ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </button>
                  </div>
                </form>
              </section>

              {/* ---------- KEAMANAN & GANTI PASSWORD ---------- */}
              <section className="profile-card" aria-labelledby="profile-password-title">
                <div className="profile-card-head">
                  <span className="profile-card-icon">
                    <LockIcon />
                  </span>

                  <div>
                    <h2 id="profile-password-title">Keamanan &amp; Ganti Password</h2>
                    <p>
                      Gunakan kombinasi minimal 8 karakter dengan huruf dan angka
                      agar catatan keuanganmu tetap aman.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleChangePassword} noValidate>
                  <PasswordField
                    id="profile-password-current"
                    label="Password Saat Ini"
                    value={passwords.current}
                    onChange={handlePasswordChange('current')}
                    error={passwordErrors.current}
                    visible={visible.current}
                    onToggle={toggleVisible('current')}
                    autoComplete="current-password"
                  />

                  <div className="profile-fields-row profile-password-row">
                    <PasswordField
                      id="profile-password-new"
                      label="Password Baru"
                      value={passwords.next}
                      onChange={handlePasswordChange('next')}
                      placeholder="Minimal 8 karakter"
                      error={passwordErrors.next}
                      visible={visible.next}
                      onToggle={toggleVisible('next')}
                      autoComplete="new-password"
                    />

                    <PasswordField
                      id="profile-password-confirm"
                      label="Konfirmasi Password Baru"
                      value={passwords.confirm}
                      onChange={handlePasswordChange('confirm')}
                      placeholder="Ulangi password baru"
                      error={passwordErrors.confirm}
                      visible={visible.confirm}
                      onToggle={toggleVisible('confirm')}
                      autoComplete="new-password"
                    />
                  </div>

                  <div className="profile-actions profile-actions-password">
                    <button
                      type="submit"
                      className="profile-button primary"
                      disabled={!passwordFilled || savingPassword}
                    >
                      <RefreshIcon />
                      {savingPassword ? 'Memperbarui...' : 'Perbarui Password'}
                    </button>
                  </div>
                </form>
              </section>
            </div>

            <div className="profile-column">
              {/* ---------- RINGKASAN AKUN ---------- */}
              <section className="profile-card profile-summary" aria-label="Ringkasan akun">
                <div className="profile-banner" />

                <div className="profile-avatar">
                  <UserIcon />
                  <span className="profile-avatar-dot" aria-hidden="true" />
                </div>

                <div className="profile-name-row">
                  <h2>{profile.username}</h2>
                  <span className="profile-role-pill">mahasiswa</span>
                </div>

                <p className="profile-summary-email">{profile.email}</p>

                <span className="profile-verified-badge">
                  <CheckIcon />
                  Email Terverifikasi
                </span>

                <dl className="profile-facts">
                  <div>
                    <dt>Bergabung sejak</dt>
                    <dd>{formatJoined(profile.bergabung_sejak)}</dd>
                  </div>

                  <div>
                    <dt>Peran</dt>
                    <dd>Mahasiswa</dd>
                  </div>

                  <div>
                    <dt>Status akun</dt>
                    <dd className="active">Aktif</dd>
                  </div>
                </dl>
              </section>

              {/* ---------- SESI & KELUAR ---------- */}
              <section className="profile-card profile-session" aria-labelledby="profile-session-title">
                <div className="profile-card-head">
                  <span className="profile-card-icon danger">
                    <LogoutIcon />
                  </span>

                  <div>
                    <h2 id="profile-session-title">Sesi &amp; Keluar Akun</h2>
                    <p>
                      Akhiri sesi login kamu di perangkat ini. Pastikan semua
                      catatan transaksi hari ini sudah tersimpan.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  className="profile-logout-button"
                  onClick={() => setShowLogout(true)}
                >
                  <LogoutIcon />
                  Keluar dari Akun
                </button>
              </section>
            </div>
          </div>
        )}
      </div>

      {showLogout && (
        <LogoutDialog
          onCancel={() => setShowLogout(false)}
          onConfirm={handleConfirmLogout}
        />
      )}
    </AppLayout>
  )
}

export default ProfilePage