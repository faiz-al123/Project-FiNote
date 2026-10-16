
import { useEffect, useState } from 'react'
import dashboardSkeletonImage from '../assets/dashboard-assets/Dashboard low fidelity.png'
import './DashboardSkeleton.css'

export default function DashboardSkeleton({ children }) {
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
        className="fn-dashboard-skeleton"
        role="status"
        aria-label="Memuat dashboard FINote"
        aria-busy="true"
      >
        <img
          className="fn-dashboard-skeleton-image"
          src={dashboardSkeletonImage}
          alt="Low fidelity dashboard FINote"
        />
      </div>
    )
  }

  return children
}
