import React, { useState, useEffect } from 'react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { User } from 'lucide-react'
import { cn } from '@/lib/utils'

const API = import.meta.env.VITE_API_BASE

interface UserAvatarProps {
  username: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  fallbackIcon?: boolean
  showTooltip?: boolean
}

interface UserData {
  login: string
  avatar_url?: string
  full_name?: string
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6', 
  lg: 'h-8 w-8',
  xl: 'h-10 w-10'
}

const iconSizeClasses = {
  sm: 'h-2 w-2',
  md: 'h-3 w-3',
  lg: 'h-4 w-4', 
  xl: 'h-5 w-5'
}

export function UserAvatar({ 
  username, 
  size = 'md', 
  className, 
  fallbackIcon = false,
  showTooltip = false 
}: UserAvatarProps) {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const fetchUserData = async () => {
      if (!username) {
        setLoading(false)
        setError(true)
        return
      }

      try {
        // Try to fetch user data from our API
        const response = await fetch(`${API}/api/users/${username}/public`, {
          credentials: 'include'
        })

        if (response.ok) {
          const data = await response.json()
          setUserData(data)
        } else {
          setError(true)
        }
      } catch (err) {
        console.error('Failed to fetch user data:', err)
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [username])

  if (loading) {
    return (
      <div className={cn(
        'rounded-full bg-muted animate-pulse',
        sizeClasses[size],
        className
      )} />
    )
  }

  if (error || !userData) {
    // Fallback to icon if requested, otherwise show initials
    if (fallbackIcon) {
      return (
        <div className={cn(
          'rounded-full bg-muted flex items-center justify-center',
          sizeClasses[size],
          className
        )}>
          <User className={cn('text-muted-foreground', iconSizeClasses[size])} />
        </div>
      )
    }
    
    return (
      <Avatar className={cn(sizeClasses[size], className)}>
        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white font-semibold text-xs">
          {username?.substring(0, 2).toUpperCase() || 'U'}
        </AvatarFallback>
      </Avatar>
    )
  }

  const avatarElement = (
    <Avatar className={cn(sizeClasses[size], className)}>
      <AvatarImage 
        src={userData.avatar_url || "/placeholder.svg"} 
        alt={userData.login}
        onError={(e) => {
          e.currentTarget.style.display = 'none'
        }}
      />
      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white font-semibold text-xs">
        {userData.login?.substring(0, 2).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  )

  if (showTooltip) {
    return (
      <div title={userData.full_name || userData.login}>
        {avatarElement}
      </div>
    )
  }

  return avatarElement
}
