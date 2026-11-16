import './DashboardSkeleton.css'

// Tinggi bar (%) dibuat bervariasi supaya terlihat seperti grafik.
// Jumlahnya sama dengan 6 kategori di DashboardPage.
const TINGGI_BAR = [70, 45, 90, 55, 35, 60]

function DashboardSkeleton() {
  return (
    <div
      className="skeleton-dashboard"
      role="status"
      aria-busy="true"
      aria-label="Memuat data dashboard"
    >
      {/* Dua kartu ringkasan: hari ini & bulan ini */}
      <section className="dashboard-summary">
        {[0, 1].map((i) => (
          <div className="dashboard-summary-card" key={i}>
            <span className="skeleton skeleton-title" />
            <span className="skeleton skeleton-value" />
          </div>
        ))}
      </section>

      {/* Kartu grafik kategori */}
      <section className="dashboard-chart-card">
        <div className="dashboard-chart-heading">
          <span className="skeleton skeleton-chart-icon" />
          <span className="skeleton skeleton-chart-title" />
        </div>

        <div className="dashboard-chart-divider" />

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

        <div className="dashboard-chart-baseline" />
      </section>

      <span className="sr-only">Memuat...</span>
    </div>
  )
}

export default DashboardSkeleton
