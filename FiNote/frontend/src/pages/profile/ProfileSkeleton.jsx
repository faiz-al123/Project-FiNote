// Memakai class .skeleton (efek shimmer) dari DashboardSkeleton.css
import '../dashboard/DashboardSkeleton.css'
import './ProfileSkeleton.css'

// Skeleton isi halaman profil: dua kartu form di kiri, dua kartu di kanan.
function ProfileSkeleton() {
  return (
    <div
      className="profile-content"
      role="status"
      aria-busy="true"
      aria-label="Memuat profil"
    >
      <div className="profile-column">
        {/* Kartu Informasi Akun */}
        <section className="profile-card" aria-hidden="true">
          <div className="profile-skeleton-head">
            <span className="skeleton profile-skeleton-tile" />
            <div className="profile-skeleton-lines">
              <span className="skeleton profile-skeleton-title" />
              <span className="skeleton profile-skeleton-sub" />
            </div>
          </div>

          <div className="profile-fields-row">
            <span className="skeleton profile-skeleton-input" />
            <span className="skeleton profile-skeleton-input" />
          </div>

          <div className="profile-skeleton-actions">
            <span className="skeleton profile-skeleton-button small" />
            <span className="skeleton profile-skeleton-button" />
          </div>
        </section>

        {/* Kartu Keamanan */}
        <section className="profile-card" aria-hidden="true">
          <div className="profile-skeleton-head">
            <span className="skeleton profile-skeleton-tile" />
            <div className="profile-skeleton-lines">
              <span className="skeleton profile-skeleton-title" />
              <span className="skeleton profile-skeleton-sub" />
            </div>
          </div>

          <span className="skeleton profile-skeleton-input full" />

          <div className="profile-fields-row">
            <span className="skeleton profile-skeleton-input" />
            <span className="skeleton profile-skeleton-input" />
          </div>

          <div className="profile-skeleton-actions">
            <span className="skeleton profile-skeleton-button" />
          </div>
        </section>
      </div>

      <div className="profile-column">
        {/* Kartu ringkasan akun */}
        <section className="profile-card" aria-hidden="true">
          <span className="skeleton profile-skeleton-banner" />
          <span className="skeleton profile-skeleton-avatar" />
          <span className="skeleton profile-skeleton-name" />
          <span className="skeleton profile-skeleton-email" />
          <span className="skeleton profile-skeleton-pill" />
          <span className="skeleton profile-skeleton-row" />
          <span className="skeleton profile-skeleton-row" />
          <span className="skeleton profile-skeleton-row" />
        </section>

        {/* Kartu sesi */}
        <section className="profile-card" aria-hidden="true">
          <span className="skeleton profile-skeleton-title" />
          <span className="skeleton profile-skeleton-sub" />
          <span className="skeleton profile-skeleton-input" />
        </section>
      </div>

      <span className="sr-only">Memuat...</span>
    </div>
  )
}

export default ProfileSkeleton