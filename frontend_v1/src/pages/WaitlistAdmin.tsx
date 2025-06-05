import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Users, TrendingUp, Clock, CheckCircle, XCircle, Download } from "lucide-react"
import Layout from "@/components/Layout"

const API = import.meta.env.VITE_API_BASE || 'http://localhost:4000'

interface WaitlistEntry {
  id: number
  email: string
  username: string
  description: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  ip_address: string
  user_agent: string
}

interface WaitlistStats {
  total: number
  pending: number
  approved: number
  rejected: number
  recent: number
  daily_signups: Array<{ date: string; count: number }>
}

const WaitlistAdmin = () => {
  const [entries, setEntries] = useState<WaitlistEntry[]>([])
  const [stats, setStats] = useState<WaitlistStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedEntry, setSelectedEntry] = useState<WaitlistEntry | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const { toast } = useToast()

  useEffect(() => {
    fetchStats()
    fetchEntries()
  }, [page, statusFilter])

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API}/api/admin/waitlist/stats`, {
        credentials: 'include'
      })
      const data = await response.json()
      if (data.success) {
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const fetchEntries = async () => {
    try {
      setLoading(true)
      const statusParam = statusFilter === 'all' ? '' : `&status=${statusFilter}`
      const response = await fetch(`${API}/api/admin/waitlist?page=${page}&limit=50${statusParam}`, {
        credentials: 'include'
      })
      const data = await response.json()
      if (data.success) {
        setEntries(data.entries)
      }
    } catch (error) {
      console.error('Error fetching entries:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateEntryStatus = async (id: number, status: string, adminNotes?: string) => {
    try {
      const response = await fetch(`${API}/api/admin/waitlist/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ status, admin_notes: adminNotes })
      })
      
      const data = await response.json()
      if (data.success) {
        toast({
          title: "Status Updated",
          description: `Entry status changed to ${status}`
        })
        fetchEntries()
        fetchStats()
        setSelectedEntry(null)
      } else {
        throw new Error(data.message)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update entry status",
        variant: "destructive"
      })
    }
  }

  const exportData = async (format: 'json' | 'csv') => {
    try {
      const response = await fetch(`${API}/api/admin/waitlist/export?format=${format}`, {
        credentials: 'include'
      })
      
      if (format === 'csv') {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'waitlist.csv'
        a.click()
      } else {
        const data = await response.json()
        const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'waitlist.json'
        a.click()
      }
      
      toast({
        title: "Export Complete",
        description: `Waitlist data exported as ${format.toUpperCase()}`
      })
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export waitlist data",
        variant: "destructive"
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>
      default:
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>
    }
  }

  return (
    <Layout>
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Waitlist Management</h1>
          <div className="flex gap-2">
            <Button onClick={() => exportData('csv')} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button onClick={() => exportData('json')} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export JSON
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Signups</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pending}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Approved</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.approved}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recent (7 days)</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.recent}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-4 mb-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Entries Table */}
        <Card>
          <CardHeader>
            <CardTitle>Waitlist Entries</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4">Loading...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{entry.email}</TableCell>
                      <TableCell>{entry.username}</TableCell>
                      <TableCell>{getStatusBadge(entry.status)}</TableCell>
                      <TableCell>{new Date(entry.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setSelectedEntry(entry)}>
                              Manage
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Manage Entry: {entry.username}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <strong>Email:</strong> {entry.email}
                              </div>
                              <div>
                                <strong>Description:</strong> {entry.description || 'No description provided'}
                              </div>
                              <div>
                                <strong>IP Address:</strong> {entry.ip_address}
                              </div>
                              <div className="flex gap-2">
                                <Button onClick={() => updateEntryStatus(entry.id, 'approved')} className="bg-green-600">
                                  Approve
                                </Button>
                                <Button onClick={() => updateEntryStatus(entry.id, 'rejected')} variant="destructive">
                                  Reject
                                </Button>
                                <Button onClick={() => updateEntryStatus(entry.id, 'pending')} variant="outline">
                                  Reset to Pending
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}

export default WaitlistAdmin
