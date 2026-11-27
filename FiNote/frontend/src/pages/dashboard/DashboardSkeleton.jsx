import './DashboardSkeleton.css'

// Tinggi bar (%) dibuat bervariasi supaya terlihat seperti grafik.
// Jumlahnya sama dengan 6 kategori di DashboardPage.
const TINGGI_BAR = [20, 35, 10, 85, 8, 12]

// Memakai class layout dari DashboardPage.css agar ukurannya sama
// persis dan tidak ada layout shift saat data muncul.
function DashboardSkeleton() {
  return (
    <div
      className="skeleton-dashboard"
      role="status"
      aria-busy="true"
      aria-label="Memuat data dashboard"
    >
      <section className="dashboard-summary">
        {[0, 1, 2].map((i) => (
          <div className="dashboard-summary-card" key={i}>
            <span className="skeleton skeleton-icon" />
            <div className="skeleton-summary-text">
              <span className="skeleton skeleton-title" />
              <span className="skeleton skeleton-value" />
            </div>
          </div>
        ))}
      </section>

      <div className="dashboard-grid">
        <section className="dashboard-card dashboard-chart-card">
          <span className="skeleton skeleton-chart-title" />

          <div className="dashboard-chart">
            {TINGGI_BAR.map((tinggi, i) => (
              <div className="dashboard-chart-column" key={i}>
                <div className="dashboard-chart-bar-area">
                  <span
                    className="skeleton skeleton-bar"
                    style={{ height: `${tinggi}%` }}
                  />
                </div>
                <span className="skeleton skeleton-label" />
              </div>
            ))}
          </div>
        </section>

        <div className="dashboard-side">
          <section className="dashboard-card dashboard-highest-card">
            <span className="skeleton skeleton-chart-title" />
            <span className="skeleton skeleton-pill" />
            <span className="skeleton skeleton-big" />
            <span className="skeleton skeleton-progress" />
          </section>

          <section className="dashboard-card dashboard-recent-card">
            <span className="skeleton skeleton-chart-title" />
            {[0, 1, 2, 3].map((i) => (
              <div className="skeleton-row" key={i}>
                <span className="skeleton skeleton-icon small" />
                <span className="skeleton skeleton-line" />
              </div>
            ))}
          </section>
        </div>
      </div>

      <span className="sr-only">Memuat...</span>
    </div>
  )
}

export default DashboardSkeleton
