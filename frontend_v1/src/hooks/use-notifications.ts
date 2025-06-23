import { useState, useEffect, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'

const API = import.meta.env.VITE_API_BASE

interface Notification {
  id: string
  title: string
  message: string
  type: string
  type_display: string
  icon: string
  color: string
  is_read: boolean
  priority: 'low' | 'normal' | 'high' | 'urgent'
  action_url?: string
  action_text?: string
  created_at: string
  metadata: Record<string, any>
}

interface NotificationHook {
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  error: string | null
  fetchNotifications: () => Promise<void>
  markAsRead: (notificationIds?: string | string[]) => Promise<void>
  markAllAsRead: () => Promise<void>
  connectWebSocket: () => void
  disconnectWebSocket: () => void
}

export function useNotifications(): NotificationHook {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ws, setWs] = useState<WebSocket | null>(null)
  const { toast } = useToast()

  // Get auth token from localStorage
  const getAuthToken = () => {
    return localStorage.getItem('token')
  }

  // Get user ID from API since we use session-based auth
  const getUserId = async () => {
    try {
      const response = await fetch(`${API}/api/profile`, {
        credentials: 'include'
      })
      if (response.ok) {
        const userData = await response.json()
        return userData.id
      }
    } catch (error) {
      console.error('Error fetching user ID:', error)
    }
    return null
  }

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    const token = getAuthToken()
    if (!token) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`${API}/api/notifications`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch notifications')
      }

      const data = await response.json()
      if (data.success) {
        setNotifications(data.notifications)
      } else {
        throw new Error(data.message || 'Failed to fetch notifications')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('Error fetching notifications:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    const token = getAuthToken()
    if (!token) return

    try {
      const response = await fetch(`${API}/api/notifications/unread-count`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setUnreadCount(data.unread_count)
        }
      }
    } catch (err) {
      console.error('Error fetching unread count:', err)
    }
  }, [])

  // Mark notifications as read
  const markAsRead = useCallback(async (notificationIds?: string | string[]) => {
    const token = getAuthToken()
    if (!token) return

    try {
      const response = await fetch(`${API}/api/notifications/mark-read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          notification_ids: notificationIds
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          // Update local state
          if (notificationIds) {
            const idsArray = Array.isArray(notificationIds) ? notificationIds : [notificationIds]
            setNotifications(prev => 
              prev.map(notif => 
                idsArray.includes(notif.id) 
                  ? { ...notif, is_read: true }
                  : notif
              )
            )
          } else {
            // Mark all as read
            setNotifications(prev => 
              prev.map(notif => ({ ...notif, is_read: true }))
            )
          }
          
          // Refresh unread count
          await fetchUnreadCount()
        }
      }
    } catch (err) {
      console.error('Error marking notifications as read:', err)
    }
  }, [fetchUnreadCount])

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    await markAsRead()
  }, [markAsRead])

  // Connect to WebSocket for real-time notifications
  const connectWebSocket = useCallback(async () => {
    const token = getAuthToken()
    const userId = await getUserId()

    if (!token || !userId || ws) return

    try {
      const wsUrl = `${API.replace('http', 'ws')}/api/notifications/ws?token=${token}&userId=${userId}`
      const websocket = new WebSocket(wsUrl)

      websocket.onopen = () => {
        console.log('🔔 Connected to notification WebSocket')
        setWs(websocket)
      }

      websocket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          
          switch (message.type) {
            case 'new_notification':
              const newNotification = message.data
              setNotifications(prev => [newNotification, ...prev])
              setUnreadCount(prev => prev + 1)
              
              // Show toast for high priority notifications
              if (newNotification.priority === 'high' || newNotification.priority === 'urgent') {
                toast({
                  title: newNotification.title,
                  description: newNotification.message,
                  variant: newNotification.priority === 'urgent' ? 'destructive' : 'default'
                })
              }
              break
              
            case 'unread_count_update':
              setUnreadCount(message.data.unread_count)
              break
              
            case 'notification_connection_established':
              console.log('🔔 Notification connection established')
              break
              
            default:
              console.log('Unknown notification message type:', message.type)
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err)
        }
      }

      websocket.onclose = () => {
        console.log('🔔 Notification WebSocket disconnected')
        setWs(null)
        
        // Attempt to reconnect after 5 seconds
        setTimeout(async () => {
          if (getAuthToken() && await getUserId()) {
            connectWebSocket()
          }
        }, 5000)
      }

      websocket.onerror = (error) => {
        console.error('🔔 Notification WebSocket error:', error)
      }

    } catch (err) {
      console.error('Error connecting to notification WebSocket:', err)
    }
  }, [ws, toast])

  // Disconnect WebSocket
  const disconnectWebSocket = useCallback(() => {
    if (ws) {
      ws.close()
      setWs(null)
    }
  }, [ws])

  // Initialize on mount
  useEffect(() => {
    const token = getAuthToken()
    if (token) {
      fetchNotifications()
      fetchUnreadCount()
      connectWebSocket()
    }

    return () => {
      disconnectWebSocket()
    }
  }, [])

  // Reconnect WebSocket when auth state changes
  useEffect(() => {
    const checkAndConnect = async () => {
      const token = getAuthToken()
      const userId = await getUserId()

      if (token && userId && !ws) {
        connectWebSocket()
      } else if (!token && ws) {
        disconnectWebSocket()
      }
    }

    checkAndConnect()
  }, [ws, connectWebSocket, disconnectWebSocket])

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    connectWebSocket,
    disconnectWebSocket
  }
}
