
import './LoginSkeleton.css'
import loginSkeletonImage from '../assets/low fidelity LOGIN.png'

export default function LoginSkeleton() {
  return (
    <div className="fn-skeleton">
      <img
        className="fn-skeleton-image"
        src={loginSkeletonImage}
        alt="Memuat halaman login FINote"
      />

      {/* Tutupi kotak abu-abu di kanan atas pada gambar asli */}
      <div className="fn-skeleton-old-corner" />

      {/* Kotak abu-abu baru di kiri atas */}
      <div className="fn-skeleton-new-corner" />
    </div>
  )
}