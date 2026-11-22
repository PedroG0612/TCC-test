import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Spinner } from './ui'

export function ProtectedRoute({ roles }: { roles?: string[] }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <Spinner />
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  if (roles && !roles.includes(user.role)) {
    const home = user.role === 'candidate' ? '/dashboard' : user.role === 'company' ? '/company/dashboard' : '/admin/dashboard'
    return <Navigate to={home} replace />
  }
  return <Outlet />
}
