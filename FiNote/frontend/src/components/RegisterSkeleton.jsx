
import './RegisterSkeleton.css'
import registerSkeletonImage from '../assets/low fidelity register.png'

export default function RegisterSkeleton() {
  return (
    <div
      className="fn-register-skeleton"
      role="status"
      aria-label="Memuat halaman registrasi FINote"
      aria-busy="true"
    >
      <img
        className="fn-register-skeleton-image"
        src={registerSkeletonImage}
        alt=""
      />
    </div>
  )
}
