import { useState, useEffect } from 'react'

const API = import.meta.env.VITE_API_BASE

interface User {
  id: number
  login: string
  full_name?: string
  avatar_url?: string
  email?: string
}

interface AuthState {
  isAuthenticated: boolean
  isLoading: boolean
  user: User | null
}

export function useAuth(): AuthState {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        // Check authentication by calling profile endpoint
        // The backend will check for HTTP-only cookie
        const response = await fetch(`${API}/api/profile`, {
          credentials: 'include', // Include cookies in request
        })

        if (response.ok) {
          const userData = await response.json()
          setIsAuthenticated(true)
          setUser(userData)
        } else {
          setIsAuthenticated(false)
          setUser(null)
        }
      } catch (error) {
        console.error('Authentication check failed:', error)
        setIsAuthenticated(false)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuthentication()
  }, [])

  return {
    isAuthenticated,
    isLoading,
    user
  }
}
