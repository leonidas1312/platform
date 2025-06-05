import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { useAdmin } from '@/hooks/use-admin'

interface AdminProtectedRouteProps {
  children: React.ReactNode
}

const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const { isAdmin, isLoading: adminLoading } = useAdmin()

  // Show loading while checking authentication and admin status
  if (authLoading || adminLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Redirect to auth if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />
  }

  // Redirect to home if authenticated but not admin
  if (!isAdmin) {
    return <Navigate to="/" replace />
  }

  // Render children if authenticated and admin
  return <>{children}</>
}

export default AdminProtectedRoute
