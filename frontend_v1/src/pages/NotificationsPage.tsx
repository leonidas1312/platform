import { useState } from 'react'
import { Link } from 'react-router-dom'
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
  ExternalLink,
  Filter,
  RefreshCw
} from 'lucide-react'
import Layout from '@/components/Layout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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

export default function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead
  } = useNotifications()

  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  const handleNotificationClick = async (notificationId: string, isRead: boolean) => {
    if (!isRead) {
      await markAsRead(notificationId)
    }
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

  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread' && notification.is_read) return false
    if (filter === 'read' && !notification.is_read) return false
    if (typeFilter !== 'all' && notification.type !== typeFilter) return false
    return true
  })

  // Get unique notification types for filter
  const notificationTypes = Array.from(new Set(notifications.map(n => n.type)))

  const unreadNotifications = notifications.filter(n => !n.is_read)

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <BellRing className="h-8 w-8" />
              Notifications
            </h1>
            <p className="text-muted-foreground mt-1">
              Stay updated on your submission status and platform activity
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="outline"
                onClick={markAllAsRead}
                className="flex items-center gap-2"
              >
                <CheckCheck className="h-4 w-4" />
                Mark all read
              </Button>
            )}
            <Button
              variant="outline"
              onClick={fetchNotifications}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Bell className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{notifications.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <BellRing className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Unread</p>
                  <p className="text-2xl font-bold">{unreadCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Read</p>
                  <p className="text-2xl font-bold">{notifications.length - unreadCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 mb-6">
          <Tabs value={filter} onValueChange={(value) => setFilter(value as any)}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="unread">
                Unread
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                    {unreadCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="read">Read</TabsTrigger>
            </TabsList>
          </Tabs>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {notificationTypes.map(type => (
                <SelectItem key={type} value={type}>
                  {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-muted rounded"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card>
            <CardContent className="p-8 text-center">
              <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Error Loading Notifications</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={fetchNotifications}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </CardContent>
          </Card>
        ) : filteredNotifications.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {filter === 'unread' ? 'No unread notifications' : 
                 filter === 'read' ? 'No read notifications' : 
                 'No notifications'}
              </h3>
              <p className="text-muted-foreground">
                {filter === 'all' 
                  ? "You'll see notifications here when you submit solvers to the leaderboard."
                  : `No ${filter} notifications found.`
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => {
              const IconComponent = iconMap[notification.icon as keyof typeof iconMap] || Bell
              const iconColor = colorMap[notification.color as keyof typeof colorMap] || 'text-gray-500'
              const priorityColor = priorityColors[notification.priority]

              return (
                <Card
                  key={notification.id}
                  className={cn(
                    "cursor-pointer transition-colors hover:bg-accent/50 border-l-2",
                    priorityColor,
                    !notification.is_read && "bg-accent/20"
                  )}
                  onClick={() => handleNotificationClick(notification.id, notification.is_read)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={cn("mt-0.5 flex-shrink-0", iconColor)}>
                        <IconComponent className="h-5 w-5" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className={cn(
                              "font-medium leading-tight",
                              !notification.is_read && "font-semibold"
                            )}>
                              {notification.title}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {notification.message}
                            </p>
                            <div className="flex items-center gap-4 mt-3">
                              <span className="text-xs text-muted-foreground">
                                {formatTimeAgo(notification.created_at)}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {notification.type_display}
                              </Badge>
                              {notification.priority !== 'normal' && (
                                <Badge 
                                  variant={notification.priority === 'urgent' ? 'destructive' : 'secondary'}
                                  className="text-xs"
                                >
                                  {notification.priority}
                                </Badge>
                              )}
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
                          
                          <div className="flex items-center gap-2">
                            {!notification.is_read && (
                              <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </Layout>
  )
}
