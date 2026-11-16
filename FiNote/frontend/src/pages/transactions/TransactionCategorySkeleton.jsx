// Memakai class .skeleton dari DashboardSkeleton.css
import '../dashboard/DashboardSkeleton.css'
import './TransactionCategorySkeleton.css'

// Jumlah kotak = jumlah kategori (6)
const JUMLAH_KATEGORI = 6

function TransactionCategorySkeleton() {
  return (
    <div
      className="transaction-categories"
      role="status"
      aria-busy="true"
      aria-label="Memuat kategori"
    >
      {Array.from({ length: JUMLAH_KATEGORI }, (_, i) => (
        <div
          className="transaction-category skeleton-category"
          key={i}
          aria-hidden="true"
        >
          <span className="skeleton transaction-category-icon" />
          <span className="skeleton skeleton-category-label" />
        </div>
      ))}
    </div>
  )
}

export default TransactionCategorySkeleton
