import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Bell,
  BellRing,
  Check,
  CheckCheck,
  Clock,
  AlertTriangle,
  Trophy,
  PlayCircle,
  ShieldCheck,
  Cpu,
  CheckCircle,
  XCircle,
  ExternalLink
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { useNotifications } from '@/hooks/use-notifications'

const iconMap = {
  'bell': Bell,
  'play-circle': PlayCircle,
  'shield-check': ShieldCheck,
  'cpu': Cpu,
  'check-circle': CheckCircle,
  'x-circle': XCircle,
  'alert-triangle': AlertTriangle,
  'clock': Clock,
  'trophy': Trophy,
}

const colorMap = {
  'blue': 'text-blue-500',
  'green': 'text-green-500',
  'red': 'text-red-500',
  'yellow': 'text-yellow-500',
  'orange': 'text-orange-500',
  'gold': 'text-yellow-600',
}

const priorityColors = {
  'low': 'border-l-gray-300',
  'normal': 'border-l-blue-300',
  'high': 'border-l-orange-300',
  'urgent': 'border-l-red-500',
}

interface NotificationDropdownProps {
  className?: string
}

export function NotificationDropdown({ className }: NotificationDropdownProps) {
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    fetchNotifications
  } = useNotifications()

  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()

  const handleNotificationClick = async (notification: any) => {
    if (!notification.is_read) {
      await markAsRead(notification.id)
    }

    setIsOpen(false)

    // Handle special submission notifications that should redirect to settings
    if (notification.metadata) {
      try {
        const metadata = typeof notification.metadata === 'string'
          ? JSON.parse(notification.metadata)
          : notification.metadata

        if (metadata.redirect_to === 'settings' && metadata.tab === 'submissions') {
          const submissionParam = metadata.submission_id ? `&submission=${metadata.submission_id}` : ''
          navigate(`/settings?tab=submissions${submissionParam}`)
          return
        }
      } catch (error) {
        console.error('Error parsing notification metadata:', error)
      }
    }

    // Handle action URL if present
    if (notification.action_url) {
      if (notification.action_url.startsWith('http')) {
        window.open(notification.action_url, '_blank')
      } else {
        navigate(notification.action_url)
      }
      return
    }

    // If no specific action, just mark as read (already done above)
  }

  const handleMarkAllRead = async () => {
    await markAllAsRead()
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
    return date.toLocaleDateString()
  }

  const unreadNotifications = notifications.filter(n => !n.is_read)

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "relative h-9 w-9 rounded-full hover:bg-accent",
            className
          )}
        >
          {unreadCount > 0 ? (
            <BellRing className="h-4 w-4" />
          ) : (
            <Bell className="h-4 w-4" />
          )}
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent
        align="end"
        className="w-80 p-0"
        sideOffset={8}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <DropdownMenuLabel className="p-0 font-semibold">
            Notifications
          </DropdownMenuLabel>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllRead}
              className="h-auto p-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        <ScrollArea className="h-96">
          {loading ? (
            <div className="p-4 text-center text-muted-foreground">
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No notifications yet
              </p>
            </div>
          ) : (
            <div className="py-2">
              {notifications.map((notification) => {
                const IconComponent = iconMap[notification.icon as keyof typeof iconMap] || Bell
                const iconColor = colorMap[notification.color as keyof typeof colorMap] || 'text-gray-500'
                const priorityColor = priorityColors[notification.priority]

                return (
                  <DropdownMenuItem
                    key={notification.id}
                    className={cn(
                      "flex items-start gap-3 p-4 cursor-pointer border-l-2 hover:bg-accent/50",
                      priorityColor,
                      !notification.is_read && "bg-accent/20"
                    )}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className={cn("mt-0.5 flex-shrink-0", iconColor)}>
                      <IconComponent className="h-4 w-4" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className={cn(
                            "text-sm font-medium leading-tight",
                            !notification.is_read && "font-semibold"
                          )}>
                            {notification.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-muted-foreground">
                              {formatTimeAgo(notification.created_at)}
                            </span>
                            {notification.action_url && (
                              <Link
                                to={notification.action_url}
                                className="text-xs text-primary hover:underline flex items-center gap-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {notification.action_text || 'View Details'}
                                <ExternalLink className="h-3 w-3" />
                              </Link>
                            )}
                          </div>
                        </div>
                        
                        {!notification.is_read && (
                          <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1" />
                        )}
                      </div>
                    </div>
                  </DropdownMenuItem>
                )
              })}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2">
              <Link to="/notifications">
                <Button
                  variant="ghost"
                  className="w-full justify-center text-sm"
                  onClick={() => setIsOpen(false)}
                >
                  View all notifications
                </Button>
              </Link>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
