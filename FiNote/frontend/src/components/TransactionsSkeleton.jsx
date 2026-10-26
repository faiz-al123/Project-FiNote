
import { useEffect, useState } from 'react'
import transactionSkeletonImage from '../assets/transaksi-assets/low fidelity transaksi.png'
import './TransactionsSkeleton.css'

export default function TransactionsSkeleton({ children }) {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 900)

    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return (
      <div
        className="fn-transactions-skeleton"
        role="status"
        aria-label="Memuat halaman transaksi FiNote"
        aria-busy="true"
      >
        <img
          className="fn-transactions-skeleton-image"
          src={transactionSkeletonImage}
          alt="Low fidelity halaman transaksi FiNote"
        />
      </div>
    )
  }

  return children
}
