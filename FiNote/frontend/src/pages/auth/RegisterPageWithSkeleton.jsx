
import { useEffect, useState } from 'react'
import RegisterPage from './RegisterPage'
import RegisterSkeleton from '../../components/RegisterSkeleton'

export default function RegisterPageWithSkeleton(props) {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 900)

    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return <RegisterSkeleton />
  }

  return <RegisterPage {...props} />
}
