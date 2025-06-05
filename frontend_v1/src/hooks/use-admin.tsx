import { useState, useEffect } from 'react'
import { useAuth } from './use-auth'

export function useAdmin() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAdminStatus = () => {
      // If auth is still loading, keep admin loading too
      if (authLoading) {
        setIsLoading(true)
        return
      }

      if (!isAuthenticated || !user) {
        setIsAdmin(false)
        setIsLoading(false)
        return
      }

      // Simple admin check based on username
      // This matches the backend admin check in routes/index.js
      const adminUsers = ['ileo']
      const userIsAdmin = adminUsers.includes(user.login)

      setIsAdmin(userIsAdmin)
      setIsLoading(false)
    }

    checkAdminStatus()
  }, [user, isAuthenticated, authLoading])

  return {
    isAdmin,
    isLoading
  }
}
